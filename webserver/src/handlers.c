#include "handlers.h"
#include "fcgi.h"
#include "http.h"

#include <stdio.h>
#include <string.h>

/* ------------------------------------------------------------------ */
/* FastCGI backend address (set once at startup)                       */
/* ------------------------------------------------------------------ */
static char g_fcgi_host[64] = "127.0.0.1";
static int  g_fcgi_port     = 9002;

void handlers_init(const char *fcgi_host, int fcgi_port)
{
    strncpy(g_fcgi_host, fcgi_host, sizeof(g_fcgi_host) - 1);
    g_fcgi_host[sizeof(g_fcgi_host) - 1] = '\0';
    g_fcgi_port = fcgi_port;
}

/* ------------------------------------------------------------------ */
/* Auth helper                                                          */
/*                                                                      */
/* Call at the top of any handler that requires a valid session.        */
/* If the session is invalid, sends a JSON 401 (errCode -32002, which   */
/* makes the frontend redirect to /login.html) and returns 0.           */
/* Usage:                                                               */
/*   if (!check_auth(client_fd, req)) return 1;                         */
/* ------------------------------------------------------------------ */
static int check_auth(int client_fd, const http_request_t *req)
{
    const char *cookie = http_get_header(req, "Cookie");
    if (fcgi_check_auth(cookie ? cookie : "", g_fcgi_host, g_fcgi_port))
        return 1;

    static const char body[] = "{\"errCode\":-32002,\"errMsg\":\"Not authenticated\"}";
    http_send_response(client_fd, 401, "Unauthorized",
                       "application/json; charset=utf-8",
                       body, sizeof(body) - 1);
    return 0;
}

/* ------------------------------------------------------------------ */
/* Built-in handler: GET /api/ping  (no auth required)                */
/* ------------------------------------------------------------------ */
static int handle_ping(int client_fd, const http_request_t *req)
{
    if (strcmp(req->path, "/api/ping") != 0)
        return 0;

    static const char body[] = "{\"status\":\"ok\"}";
    http_send_response(client_fd, 200, "OK",
                       "application/json",
                       body, sizeof(body) - 1);
    return 1;
}

/* ------------------------------------------------------------------ */
/* Built-in handler: GET /api/sysinfo  (requires auth)                */
/*                                                                      */
/* Returns basic system info read from /tmp/fibocom/ and /proc.        */
/* Demonstrates the auth pattern; add real handlers below.            */
/* ------------------------------------------------------------------ */
static int handle_sysinfo(int client_fd, const http_request_t *req)
{
    if (strcmp(req->path, "/api/sysinfo") != 0)
        return 0;

    if (!check_auth(client_fd, req))
        return 1;

    /* Read a few quick values via popen(uci) */
    char hostname[64] = "unknown";
    FILE *fp = popen("uci -q get system.@system[0].hostname 2>/dev/null", "r");
    if (fp) {
        if (fgets(hostname, sizeof(hostname), fp)) {
            /* strip trailing newline */
            size_t len = strlen(hostname);
            if (len > 0 && hostname[len - 1] == '\n')
                hostname[len - 1] = '\0';
        }
        pclose(fp);
    }

    char uptime[32] = "0";
    fp = popen("cat /proc/uptime 2>/dev/null", "r");
    if (fp) {
        double up = 0;
        fscanf(fp, "%lf", &up);
        snprintf(uptime, sizeof(uptime), "%.0f", up);
        pclose(fp);
    }

    char body[256];
    int blen = snprintf(body, sizeof(body),
                        "{\"hostname\":\"%s\",\"uptime\":%s}",
                        hostname, uptime);

    http_send_response(client_fd, 200, "OK",
                       "application/json; charset=utf-8",
                       body, (size_t)blen);
    return 1;
}

/* ------------------------------------------------------------------ */
/* Handler table                                                        */
/*                                                                      */
/* To add a new custom handler:                                         */
/*   1. Write:  static int handle_foo(int, const http_request_t *);    */
/*   2. Add an entry: { "/api/foo", handle_foo }                        */
/*   3. Use check_auth() at the top if the endpoint requires a session. */
/* ------------------------------------------------------------------ */
static handler_t handlers[] = {
    { "/api/ping",    handle_ping    },
    { "/api/sysinfo", handle_sysinfo },
};

static const int num_handlers = (int)(sizeof(handlers) / sizeof(handlers[0]));

/* ------------------------------------------------------------------ */

int handlers_dispatch(int client_fd, const http_request_t *req)
{
    for (int i = 0; i < num_handlers; i++) {
        const char *prefix = handlers[i].path_prefix;
        if (strncmp(req->path, prefix, strlen(prefix)) == 0) {
            int handled = handlers[i].fn(client_fd, req);
            if (handled)
                return 1;
        }
    }
    return 0;
}
