#include "http.h"

#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

#define CHUNK_SIZE (64 * 1024)

static const char *mime_for_path(const char *path)
{
    const char *dot = strrchr(path, '.');
    if (!dot) return "application/octet-stream";
    dot++; /* skip the '.' */

    if (strcasecmp(dot, "html") == 0 || strcasecmp(dot, "htm") == 0)
        return "text/html; charset=utf-8";
    if (strcasecmp(dot, "js") == 0)
        return "application/javascript";
    if (strcasecmp(dot, "css") == 0)
        return "text/css";
    if (strcasecmp(dot, "json") == 0)
        return "application/json";
    if (strcasecmp(dot, "png") == 0)
        return "image/png";
    if (strcasecmp(dot, "jpg") == 0 || strcasecmp(dot, "jpeg") == 0)
        return "image/jpeg";
    if (strcasecmp(dot, "gif") == 0)
        return "image/gif";
    if (strcasecmp(dot, "ico") == 0)
        return "image/x-icon";
    if (strcasecmp(dot, "svg") == 0)
        return "image/svg+xml";
    if (strcasecmp(dot, "woff") == 0)
        return "font/woff";
    if (strcasecmp(dot, "woff2") == 0)
        return "font/woff2";
    if (strcasecmp(dot, "ttf") == 0)
        return "font/ttf";
    if (strcasecmp(dot, "eot") == 0)
        return "application/vnd.ms-fontobject";
    return "application/octet-stream";
}

static void write_all(int fd, const void *buf, size_t len)
{
    const char *p = (const char *)buf;
    while (len > 0) {
        ssize_t n;
        do { n = write(fd, p, len); } while (n == -1 && errno == EINTR);
        if (n <= 0) return;
        p   += n;
        len -= (size_t)n;
    }
}

void static_serve(int client_fd, const http_request_t *req, const char *webroot)
{
    /* Reject paths containing ".." — path traversal guard */
    if (strstr(req->path, "..")) {
        http_send_error(client_fd, 403, "Forbidden");
        return;
    }

    /* Build full filesystem path */
    char fullpath[MAX_PATH * 2];
    int n = snprintf(fullpath, sizeof(fullpath), "%s%s", webroot, req->path);
    if (n < 0 || (size_t)n >= sizeof(fullpath)) {
        http_send_error(client_fd, 414, "URI Too Long");
        return;
    }

    /* stat to determine if it's a directory or missing */
    struct stat st;
    if (stat(fullpath, &st) < 0) {
        if (errno == ENOENT || errno == ENOTDIR)
            http_send_error(client_fd, 404, "Not Found");
        else
            http_send_error(client_fd, 500, "Internal Server Error");
        return;
    }

    /* If directory: try to serve index.html */
    if (S_ISDIR(st.st_mode)) {
        /* Append index.html */
        char idx[MAX_PATH * 2 + 16];
        size_t plen = strlen(fullpath);
        int trailing_slash = (plen > 0 && fullpath[plen - 1] == '/');
        snprintf(idx, sizeof(idx), "%s%sindex.html",
                 fullpath, trailing_slash ? "" : "/");

        if (stat(idx, &st) < 0) {
            http_send_error(client_fd, 404, "Not Found");
            return;
        }
        strncpy(fullpath, idx, sizeof(fullpath) - 1);
        fullpath[sizeof(fullpath) - 1] = '\0';
    }

    if (!S_ISREG(st.st_mode)) {
        http_send_error(client_fd, 403, "Forbidden");
        return;
    }

    off_t file_size = st.st_size;
    const char *mime = mime_for_path(fullpath);

    int fd = open(fullpath, O_RDONLY);
    if (fd < 0) {
        http_send_error(client_fd, 500, "Internal Server Error");
        return;
    }

    /* Send headers */
    char hdr[512];
    int hlen = snprintf(hdr, sizeof(hdr),
        "HTTP/1.1 200 OK\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %lld\r\n"
        "Cache-Control: no-cache\r\n"
        "Connection: close\r\n"
        "\r\n",
        mime, (long long)file_size);
    write_all(client_fd, hdr, (size_t)hlen);

    /* Send file in 64KB chunks */
    static char buf[CHUNK_SIZE];
    ssize_t r;
    while ((r = read(fd, buf, sizeof(buf))) > 0) {
        write_all(client_fd, buf, (size_t)r);
    }

    close(fd);
}
