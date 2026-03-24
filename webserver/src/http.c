#include "http.h"

#include <ctype.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/time.h>
#include <unistd.h>

/* Read a single line from fd into buf (up to buf_size-1 bytes), stripping
 * the trailing \r\n or \n.  Returns the number of characters stored
 * (excluding the NUL), 0 on an empty line, -1 on error / EOF. */
static int read_line(int fd, char *buf, int buf_size)
{
    int n = 0;
    char c;

    while (n < buf_size - 1) {
        ssize_t r;

        do {
            r = read(fd, &c, 1);
        } while (r == -1 && errno == EINTR);

        if (r <= 0)
            return -1;   /* error or connection closed */

        if (c == '\n') {
            /* strip the preceding \r if present */
            if (n > 0 && buf[n - 1] == '\r')
                n--;
            break;
        }
        buf[n++] = c;
    }

    buf[n] = '\0';
    return n;
}

/* ------------------------------------------------------------------ */

int http_parse_request(int fd, http_request_t *req)
{
    /* Set a 10-second receive timeout */
    struct timeval tv = { .tv_sec = 10, .tv_usec = 0 };
    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));

    memset(req, 0, sizeof(*req));

    /* ---- Request line ---- */
    char line[MAX_PATH + MAX_QUERY + MAX_METHOD + 32];
    if (read_line(fd, line, sizeof(line)) <= 0)
        return -1;

    /* Split: METHOD SP REQUEST-TARGET SP HTTP/x.y */
    char *p = line;
    char *sp = strchr(p, ' ');
    if (!sp) return -1;
    int mlen = (int)(sp - p);
    if (mlen <= 0 || mlen >= MAX_METHOD) return -1;
    memcpy(req->method, p, (size_t)mlen);
    req->method[mlen] = '\0';

    p = sp + 1;
    sp = strchr(p, ' ');
    if (!sp) return -1;

    /* Extract path (and optional query) from request target */
    char target[MAX_PATH + MAX_QUERY + 2];
    int tlen = (int)(sp - p);
    if (tlen <= 0 || tlen >= (int)sizeof(target)) return -1;
    memcpy(target, p, (size_t)tlen);
    target[tlen] = '\0';

    char *qmark = strchr(target, '?');
    if (qmark) {
        *qmark = '\0';
        strncpy(req->query, qmark + 1, MAX_QUERY - 1);
        req->query[MAX_QUERY - 1] = '\0';
    }
    strncpy(req->path, target, MAX_PATH - 1);
    req->path[MAX_PATH - 1] = '\0';

    p = sp + 1;
    strncpy(req->version, p, sizeof(req->version) - 1);
    req->version[sizeof(req->version) - 1] = '\0';

    /* ---- Headers ---- */
    while (req->header_count < MAX_HEADERS) {
        char hline[MAX_HEADER_NAME + MAX_HEADER_VALUE + 4];
        int len = read_line(fd, hline, sizeof(hline));
        if (len < 0) return -1;  /* connection dropped */
        if (len == 0) break;     /* blank line — end of headers */

        /* Split on first ': ' */
        char *colon = strchr(hline, ':');
        if (!colon) continue;    /* malformed header — skip */

        *colon = '\0';
        char *val = colon + 1;
        while (*val == ' ' || *val == '\t') val++;

        strncpy(req->headers[req->header_count].name,  hline, MAX_HEADER_NAME - 1);
        req->headers[req->header_count].name[MAX_HEADER_NAME - 1] = '\0';
        strncpy(req->headers[req->header_count].value, val,   MAX_HEADER_VALUE - 1);
        req->headers[req->header_count].value[MAX_HEADER_VALUE - 1] = '\0';
        req->header_count++;
    }

    /* Extract Content-Length */
    const char *cl = http_get_header(req, "Content-Length");
    if (cl)
        req->content_length = (size_t)strtoul(cl, NULL, 10);

    return 0;
}

/* ------------------------------------------------------------------ */

const char *http_get_header(const http_request_t *req, const char *name)
{
    for (int i = 0; i < req->header_count; i++) {
        if (strcasecmp(req->headers[i].name, name) == 0)
            return req->headers[i].value;
    }
    return NULL;
}

/* ------------------------------------------------------------------ */

static const char *status_text(int status)
{
    switch (status) {
        case 200: return "OK";
        case 201: return "Created";
        case 204: return "No Content";
        case 301: return "Moved Permanently";
        case 302: return "Found";
        case 304: return "Not Modified";
        case 400: return "Bad Request";
        case 401: return "Unauthorized";
        case 403: return "Forbidden";
        case 404: return "Not Found";
        case 405: return "Method Not Allowed";
        case 500: return "Internal Server Error";
        case 502: return "Bad Gateway";
        case 503: return "Service Unavailable";
        default:  return "Unknown";
    }
}

/* Write all bytes, handling EINTR. */
static void write_all(int fd, const char *buf, size_t len)
{
    while (len > 0) {
        ssize_t n;
        do {
            n = write(fd, buf, len);
        } while (n == -1 && errno == EINTR);
        if (n <= 0) return;
        buf += n;
        len -= (size_t)n;
    }
}

void http_send_response(int fd, int status, const char *status_str,
                        const char *content_type, const char *body,
                        size_t body_len)
{
    if (!status_str || status_str[0] == '\0')
        status_str = status_text(status);

    char hdr[512];
    int hlen = snprintf(hdr, sizeof(hdr),
        "HTTP/1.1 %d %s\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %zu\r\n"
        "Connection: close\r\n"
        "\r\n",
        status, status_str,
        content_type ? content_type : "text/plain",
        body_len);

    write_all(fd, hdr, (size_t)hlen);
    if (body && body_len > 0)
        write_all(fd, body, body_len);
}

void http_send_error(int fd, int status, const char *message)
{
    http_send_response(fd, status, NULL, "text/plain; charset=utf-8",
                       message, strlen(message));
}
