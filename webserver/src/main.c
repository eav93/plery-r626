#include "fcgi.h"
#include "handlers.h"
#include "http.h"
#include "static.h"

#include <arpa/inet.h>
#include <errno.h>
#include <netinet/in.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

/* ------------------------------------------------------------------ */
/* Globals                                                              */
/* ------------------------------------------------------------------ */
static volatile sig_atomic_t g_running = 1;

/* ------------------------------------------------------------------ */
/* Signal handlers                                                      */
/* ------------------------------------------------------------------ */
static void sig_chld(int sig)
{
    (void)sig;
    /* Reap all finished children without blocking */
    while (waitpid(-1, NULL, WNOHANG) > 0)
        ;
}

static void sig_term(int sig)
{
    (void)sig;
    g_running = 0;
}

/* ------------------------------------------------------------------ */
/* Connection handler (runs in child process)                          */
/* ------------------------------------------------------------------ */
static void handle_connection(int client_fd,
                               const char *webroot,
                               const char *fcgi_host,
                               int         fcgi_port,
                               int         listen_port,
                               const char *remote_addr)
{
    http_request_t req;

    if (http_parse_request(client_fd, &req) < 0) {
        /* Could be a timeout or a bad request — nothing useful to send */
        return;
    }

    dprintf(STDERR_FILENO, "wbsrv: %s %s\n", req.method, req.path);

    /* Redirect bare / to the login page (mirrors nginx: index /cgi-bin/index) */
    if (strcmp(req.path, "/") == 0) {
        static const char redir[] =
            "HTTP/1.1 302 Found\r\n"
            "Location: /cgi-bin/index\r\n"
            "Content-Length: 0\r\n"
            "Connection: close\r\n"
            "\r\n";
        const char *p = redir;
        size_t left = sizeof(redir) - 1;
        while (left > 0) {
            ssize_t n = write(client_fd, p, left);
            if (n <= 0) break;
            p += n; left -= (size_t)n;
        }
        return;
    }

    /* 1. Custom handlers */
    if (handlers_dispatch(client_fd, &req))
        return;

    /* 2. FastCGI proxy for /cgi-bin/ */
    if (strncmp(req.path, "/cgi-bin/", 9) == 0) {
        fcgi_proxy(client_fd, &req, fcgi_host, fcgi_port, listen_port, remote_addr);
        return;
    }

    /* 3. Static files */
    static_serve(client_fd, &req, webroot);
}

/* ------------------------------------------------------------------ */
/* Usage                                                                */
/* ------------------------------------------------------------------ */
static void usage(const char *prog)
{
    dprintf(STDERR_FILENO,
            "Usage: %s [-p PORT] [-r WEBROOT] [-f FCGI_HOST:PORT]\n"
            "  -p PORT         TCP port to listen on (default: 80)\n"
            "  -r WEBROOT      Static file root directory (default: /www-comfast)\n"
            "  -f HOST:PORT    FastCGI backend address (default: 127.0.0.1:9002)\n",
            prog);
}

/* ------------------------------------------------------------------ */
/* main                                                                 */
/* ------------------------------------------------------------------ */
int main(int argc, char *argv[])
{
    int         listen_port = 80;
    const char *webroot     = "/www-comfast";
    char        fcgi_host[64] = "127.0.0.1";
    int         fcgi_port   = 9002;

    /* --- Parse CLI args --- */
    int opt;
    while ((opt = getopt(argc, argv, "p:r:f:h")) != -1) {
        switch (opt) {
        case 'p':
            listen_port = atoi(optarg);
            if (listen_port <= 0 || listen_port > 65535) {
                dprintf(STDERR_FILENO, "wbsrv: invalid port: %s\n", optarg);
                return 1;
            }
            break;

        case 'r':
            webroot = optarg;
            break;

        case 'f': {
            /* Parse HOST:PORT */
            char *colon = strrchr(optarg, ':');
            if (!colon) {
                dprintf(STDERR_FILENO,
                        "wbsrv: -f requires HOST:PORT format\n");
                return 1;
            }
            *colon = '\0';
            strncpy(fcgi_host, optarg, sizeof(fcgi_host) - 1);
            fcgi_host[sizeof(fcgi_host) - 1] = '\0';
            fcgi_port = atoi(colon + 1);
            if (fcgi_port <= 0 || fcgi_port > 65535) {
                dprintf(STDERR_FILENO,
                        "wbsrv: invalid fcgi port: %s\n", colon + 1);
                return 1;
            }
            break;
        }

        case 'h':
            usage(argv[0]);
            return 0;

        default:
            usage(argv[0]);
            return 1;
        }
    }

    /* --- Signals --- */
    struct sigaction sa;
    memset(&sa, 0, sizeof(sa));

    sa.sa_handler = sig_chld;
    sa.sa_flags   = SA_RESTART | SA_NOCLDSTOP;
    sigaction(SIGCHLD, &sa, NULL);

    sa.sa_handler = sig_term;
    sa.sa_flags   = 0;
    sigemptyset(&sa.sa_mask);
    sigaction(SIGTERM, &sa, NULL);
    sigaction(SIGINT,  &sa, NULL);

    signal(SIGPIPE, SIG_IGN);

    /* --- Create listening socket --- */
    int listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (listen_fd < 0) {
        dprintf(STDERR_FILENO, "wbsrv: socket: %s\n", strerror(errno));
        return 1;
    }

    int yes = 1;
    setsockopt(listen_fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family      = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port        = htons((uint16_t)listen_port);

    if (bind(listen_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        dprintf(STDERR_FILENO, "wbsrv: bind: %s\n", strerror(errno));
        close(listen_fd);
        return 1;
    }

    if (listen(listen_fd, 128) < 0) {
        dprintf(STDERR_FILENO, "wbsrv: listen: %s\n", strerror(errno));
        close(listen_fd);
        return 1;
    }

    /* --- Init handlers --- */
    handlers_init(fcgi_host, fcgi_port);

    dprintf(STDERR_FILENO,
            "wbsrv: listening on port %d, webroot=%s, fcgi=%s:%d\n",
            listen_port, webroot, fcgi_host, fcgi_port);

    /* --- Accept loop --- */
    while (g_running) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);

        int client_fd = accept(listen_fd,
                               (struct sockaddr *)&client_addr,
                               &client_len);
        if (client_fd < 0) {
            if (errno == EINTR) continue; /* interrupted by signal */
            if (g_running)
                dprintf(STDERR_FILENO, "wbsrv: accept: %s\n",
                        strerror(errno));
            break;
        }

        pid_t pid = fork();
        if (pid < 0) {
            dprintf(STDERR_FILENO, "wbsrv: fork: %s\n", strerror(errno));
            close(client_fd);
            continue;
        }

        if (pid == 0) {
            /* Child: close listening socket, handle connection, exit */
            close(listen_fd);
            char remote_addr[INET_ADDRSTRLEN] = "127.0.0.1";
            inet_ntop(AF_INET, &client_addr.sin_addr,
                      remote_addr, sizeof(remote_addr));
            handle_connection(client_fd, webroot, fcgi_host, fcgi_port,
                              listen_port, remote_addr);
            close(client_fd);
            _exit(0);
        }

        /* Parent: close client fd and keep accepting */
        close(client_fd);
    }

    close(listen_fd);
    dprintf(STDERR_FILENO, "wbsrv: shutting down\n");
    return 0;
}
