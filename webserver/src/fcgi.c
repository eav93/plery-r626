#include "fcgi.h"
#include "http.h"

#include <arpa/inet.h>
#include <ctype.h>
#include <errno.h>
#include <netdb.h>
#include <netinet/in.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

/* ------------------------------------------------------------------ */
/* FastCGI record types                                                */
/* ------------------------------------------------------------------ */
#define FCGI_VERSION         1
#define FCGI_BEGIN_REQUEST   1
#define FCGI_END_REQUEST     3
#define FCGI_PARAMS          4
#define FCGI_STDIN           5
#define FCGI_STDOUT          6
#define FCGI_STDERR          7

/* Role */
#define FCGI_RESPONDER       1

/* ------------------------------------------------------------------ */
/* Structures                                                          */
/* ------------------------------------------------------------------ */
typedef struct {
    uint8_t version;
    uint8_t type;
    uint8_t req_id_hi;
    uint8_t req_id_lo;
    uint8_t content_len_hi;
    uint8_t content_len_lo;
    uint8_t padding_len;
    uint8_t reserved;
} fcgi_header_t;

/* ------------------------------------------------------------------ */
/* Low-level helpers                                                   */
/* ------------------------------------------------------------------ */
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

/* Build an 8-byte FCGI header in-place. */
static void make_header(fcgi_header_t *h, uint8_t type,
                        uint16_t req_id, uint16_t content_len,
                        uint8_t padding_len)
{
    h->version       = FCGI_VERSION;
    h->type          = type;
    h->req_id_hi     = (uint8_t)(req_id >> 8);
    h->req_id_lo     = (uint8_t)(req_id & 0xff);
    h->content_len_hi = (uint8_t)(content_len >> 8);
    h->content_len_lo = (uint8_t)(content_len & 0xff);
    h->padding_len   = padding_len;
    h->reserved      = 0;
}

/* Send a single FCGI record (header + content + padding). */
static void send_record(int fd, uint8_t type, uint16_t req_id,
                        const void *content, uint16_t content_len)
{
    /* Pad to 8-byte boundary */
    uint8_t padding_len = (uint8_t)((8 - (content_len % 8)) % 8);
    static const uint8_t zeros[8] = {0};

    fcgi_header_t hdr;
    make_header(&hdr, type, req_id, content_len, padding_len);

    write_all(fd, &hdr, sizeof(hdr));
    if (content_len > 0)
        write_all(fd, content, content_len);
    if (padding_len > 0)
        write_all(fd, zeros, padding_len);
}

/* ------------------------------------------------------------------ */
/* FCGI name-value encoding                                            */
/* ------------------------------------------------------------------ */

/* Return number of bytes needed to encode a length value. */
static int nv_len_bytes(size_t v)
{
    return (v < 128) ? 1 : 4;
}

/* Write FCGI length encoding into buf, return bytes written. */
static int write_nv_len(uint8_t *buf, size_t v)
{
    if (v < 128) {
        buf[0] = (uint8_t)v;
        return 1;
    }
    buf[0] = (uint8_t)((v >> 24) | 0x80);
    buf[1] = (uint8_t)((v >> 16) & 0xff);
    buf[2] = (uint8_t)((v >>  8) & 0xff);
    buf[3] = (uint8_t)( v        & 0xff);
    return 4;
}

/* Append a single name=value pair to a buffer.
 * Returns bytes appended, or 0 if there's no room. */
static size_t append_nv(uint8_t *buf, size_t buf_cap, size_t offset,
                        const char *name, const char *value)
{
    if (!name || !value) return 0;
    size_t nlen = strlen(name);
    size_t vlen = strlen(value);
    size_t needed = (size_t)(nv_len_bytes(nlen) + nv_len_bytes(vlen))
                    + nlen + vlen;
    if (offset + needed > buf_cap) return 0;

    uint8_t *p = buf + offset;
    p += write_nv_len(p, nlen);
    p += write_nv_len(p, vlen);
    memcpy(p, name,  nlen); p += nlen;
    memcpy(p, value, vlen);
    return needed;
}

/* ------------------------------------------------------------------ */
/* Send PARAMS stream (may produce multiple records if large)          */
/* ------------------------------------------------------------------ */
static void send_params(int fd, uint16_t req_id,
                        const uint8_t *data, size_t data_len)
{
    const uint8_t *p = data;
    size_t remaining = data_len;

    while (remaining > 0) {
        uint16_t chunk = (remaining > 65535) ? 65535 : (uint16_t)remaining;
        send_record(fd, FCGI_PARAMS, req_id, p, chunk);
        p         += chunk;
        remaining -= chunk;
    }
    /* Empty PARAMS record signals end of params */
    send_record(fd, FCGI_PARAMS, req_id, NULL, 0);
}

/* ------------------------------------------------------------------ */
/* Growable buffer                                                     */
/* ------------------------------------------------------------------ */
typedef struct {
    uint8_t *data;
    size_t   len;
    size_t   cap;
} gbuf_t;

static int gbuf_append(gbuf_t *g, const void *src, size_t n)
{
    if (g->len + n > g->cap) {
        size_t newcap = g->cap ? g->cap * 2 : 65536;
        while (newcap < g->len + n) newcap *= 2;
        if (newcap > 32 * 1024 * 1024) return -1; /* 32 MB cap */
        uint8_t *np = realloc(g->data, newcap);
        if (!np) return -1;
        g->data = np;
        g->cap  = newcap;
    }
    memcpy(g->data + g->len, src, n);
    g->len += n;
    return 0;
}

/* ------------------------------------------------------------------ */
/* Main proxy function                                                 */
/* ------------------------------------------------------------------ */
void fcgi_proxy(int client_fd, const http_request_t *req,
                const char *host, int port, int http_port,
                const char *remote_addr)
{
    /* --- Connect to FastCGI daemon --- */
    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_port   = htons((uint16_t)port);

    /* Try numeric first, fall back to gethostbyname */
    if (inet_pton(AF_INET, host, &addr.sin_addr) != 1) {
        struct hostent *he = gethostbyname(host);
        if (!he) {
            http_send_error(client_fd, 502, "Bad Gateway: cannot resolve fcgi host");
            return;
        }
        memcpy(&addr.sin_addr, he->h_addr, (size_t)he->h_length);
    }

    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) {
        http_send_error(client_fd, 502, "Bad Gateway: socket error");
        return;
    }

    if (connect(sock, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        dprintf(STDERR_FILENO, "fcgi: connect failed: %s\n", strerror(errno));
        close(sock);
        http_send_error(client_fd, 502, "Bad Gateway: cannot connect to fcgi");
        return;
    }

    const uint16_t REQ_ID = 1;

    /* --- FCGI_BEGIN_REQUEST --- */
    {
        uint8_t body[8];
        body[0] = 0;                    /* role hi */
        body[1] = FCGI_RESPONDER;       /* role lo */
        body[2] = 0;                    /* flags (no keep-alive) */
        memset(body + 3, 0, 5);
        send_record(sock, FCGI_BEGIN_REQUEST, REQ_ID, body, 8);
    }

    /* --- Build PARAMS buffer --- */
    /* Allocate a generous buffer; resize if needed (rare) */
    size_t params_cap = 16384;
    uint8_t *params = malloc(params_cap);
    if (!params) {
        close(sock);
        http_send_error(client_fd, 500, "Internal Server Error");
        return;
    }
    size_t params_len = 0;

#define GROW_PARAMS(needed) \
    do { \
        while (params_cap < params_len + (needed)) params_cap *= 2; \
        uint8_t *_np = realloc(params, params_cap); \
        if (!_np) { free(params); close(sock); \
            http_send_error(client_fd, 500, "Internal Server Error"); return; } \
        params = _np; \
    } while (0)

#define ADD_PARAM(name, value) \
    do { \
        const char *_v = (value); \
        if (_v) { \
            size_t _needed = strlen(name) + strlen(_v) + 8; \
            GROW_PARAMS(_needed); \
            params_len += append_nv(params, params_cap, params_len, (name), _v); \
        } \
    } while (0)

    /* Content-Length as string */
    char cl_str[32];
    snprintf(cl_str, sizeof(cl_str), "%zu", req->content_length);

    /* Server port as string (HTTP listen port, not FastCGI port) */
    char port_str[16];
    snprintf(port_str, sizeof(port_str), "%d", http_port);

    /* REQUEST_URI = path [?query] */
    char request_uri[MAX_PATH + MAX_QUERY + 2];
    if (req->query[0])
        snprintf(request_uri, sizeof(request_uri), "%s?%s", req->path, req->query);
    else
        snprintf(request_uri, sizeof(request_uri), "%s", req->path);

    ADD_PARAM("REQUEST_METHOD",   req->method);
    ADD_PARAM("REQUEST_URI",      request_uri);
    ADD_PARAM("DOCUMENT_URI",     req->path);
    ADD_PARAM("DOCUMENT_ROOT",    "/www-comfast");
    ADD_PARAM("SCRIPT_NAME",      req->path);
    ADD_PARAM("SCRIPT_FILENAME",  req->path);
    ADD_PARAM("QUERY_STRING",     req->query);
    ADD_PARAM("REDIRECT_STATUS",  "200");
    ADD_PARAM("REMOTE_ADDR",      remote_addr ? remote_addr : "127.0.0.1");
    ADD_PARAM("SERVER_NAME",      "localhost");
    ADD_PARAM("SERVER_PORT",      port_str);
    ADD_PARAM("SERVER_PROTOCOL",  req->version);
    ADD_PARAM("REQUEST_SCHEME",   "http");
    ADD_PARAM("GATEWAY_INTERFACE","CGI/1.1");

    const char *ct = http_get_header(req, "Content-Type");
    if (ct) ADD_PARAM("CONTENT_TYPE", ct);
    /* Always send CONTENT_LENGTH (mirrors nginx behaviour) */
    ADD_PARAM("CONTENT_LENGTH", cl_str);

    /* HTTP_* headers */
    for (int i = 0; i < req->header_count; i++) {
        const char *hname = req->headers[i].name;

        /* Build "HTTP_" + uppercased name with '-' replaced by '_' */
        char env_name[MAX_HEADER_NAME + 6];
        snprintf(env_name, sizeof(env_name), "HTTP_%s", hname);
        for (char *cp = env_name + 5; *cp; cp++) {
            if (*cp == '-') *cp = '_';
            else *cp = (char)toupper((unsigned char)*cp);
        }
        ADD_PARAM(env_name, req->headers[i].value);
    }

#undef ADD_PARAM
#undef GROW_PARAMS

    send_params(sock, REQ_ID, params, params_len);
    free(params);

    /* --- Stream STDIN --- */
    if (req->content_length > 0) {
        uint8_t chunk[8192];
        size_t remaining = req->content_length;

        while (remaining > 0) {
            size_t want = remaining < sizeof(chunk) ? remaining : sizeof(chunk);
            ssize_t got;
            do { got = read(client_fd, chunk, want); }
            while (got == -1 && errno == EINTR);
            if (got <= 0) break;

            send_record(sock, FCGI_STDIN, REQ_ID, chunk, (uint16_t)got);
            remaining -= (size_t)got;
        }
    }
    /* Empty STDIN — end of request body */
    send_record(sock, FCGI_STDIN, REQ_ID, NULL, 0);

    /* --- Read FCGI_STDOUT until END_REQUEST --- */
    gbuf_t stdout_buf = {NULL, 0, 0};

    for (;;) {
        fcgi_header_t hdr;
        /* Read the 8-byte record header */
        ssize_t n;
        size_t got = 0;
        uint8_t *hp = (uint8_t *)&hdr;
        while (got < sizeof(hdr)) {
            do { n = read(sock, hp + got, sizeof(hdr) - got); }
            while (n == -1 && errno == EINTR);
            if (n <= 0) goto done_reading;
            got += (size_t)n;
        }

        uint16_t content_len = (uint16_t)((hdr.content_len_hi << 8) |
                                            hdr.content_len_lo);
        uint8_t  padding_len = hdr.padding_len;

        /* Read content */
        if (content_len > 0) {
            uint8_t *cbuf = malloc(content_len);
            if (!cbuf) break;
            got = 0;
            while (got < content_len) {
                do { n = read(sock, cbuf + got, content_len - got); }
                while (n == -1 && errno == EINTR);
                if (n <= 0) { free(cbuf); goto done_reading; }
                got += (size_t)n;
            }

            if (hdr.type == FCGI_STDOUT) {
                gbuf_append(&stdout_buf, cbuf, content_len);
            } else if (hdr.type == FCGI_STDERR) {
                /* Log stderr to our own stderr */
                write_all(STDERR_FILENO, cbuf, content_len);
            }
            free(cbuf);
        }

        /* Drain padding */
        if (padding_len > 0) {
            uint8_t pad[256];
            size_t pdone = 0;
            while (pdone < padding_len) {
                do { n = read(sock, pad, padding_len - pdone); }
                while (n == -1 && errno == EINTR);
                if (n <= 0) goto done_reading;
                pdone += (size_t)n;
            }
        }

        if (hdr.type == FCGI_END_REQUEST)
            break;
    }

done_reading:
    close(sock);

    /* --- Parse and forward the CGI response --- */
    if (stdout_buf.len == 0) {
        http_send_error(client_fd, 502, "Bad Gateway: empty fcgi response");
        free(stdout_buf.data);
        return;
    }

    /* Find the blank-line separator between headers and body */
    const char *sep = NULL;
    for (size_t i = 0; i + 3 < stdout_buf.len; i++) {
        if (stdout_buf.data[i]   == '\r' &&
            stdout_buf.data[i+1] == '\n' &&
            stdout_buf.data[i+2] == '\r' &&
            stdout_buf.data[i+3] == '\n') {
            sep = (const char *)stdout_buf.data + i;
            break;
        }
    }
    /* Also try bare \n\n */
    if (!sep) {
        for (size_t i = 0; i + 1 < stdout_buf.len; i++) {
            if (stdout_buf.data[i] == '\n' && stdout_buf.data[i+1] == '\n') {
                sep = (const char *)stdout_buf.data + i;
                break;
            }
        }
    }

    if (!sep) {
        /* No header/body split found — send as-is with 200 */
        http_send_response(client_fd, 200, "OK",
                           "application/octet-stream",
                           (const char *)stdout_buf.data, stdout_buf.len);
        free(stdout_buf.data);
        return;
    }

    /* Determine separator width (\r\n\r\n = 4, \n\n = 2) */
    size_t sep_width = (sep[0] == '\r') ? 4 : 2;

    /* --- Parse CGI headers --- */
    char  cgi_headers_buf[4096];
    size_t hdr_section_len = (size_t)(sep - (const char *)stdout_buf.data);
    if (hdr_section_len >= sizeof(cgi_headers_buf))
        hdr_section_len = sizeof(cgi_headers_buf) - 1;
    memcpy(cgi_headers_buf, stdout_buf.data, hdr_section_len);
    cgi_headers_buf[hdr_section_len] = '\0';

    int    cgi_status    = 200;
    char   cgi_status_text[64] = "OK";
    char   cgi_content_type[256] = "application/octet-stream";

    /* Parse line by line */
    char *line = cgi_headers_buf;
    while (line && *line) {
        char *end = strpbrk(line, "\r\n");
        if (end) {
            if (*end == '\r' && *(end+1) == '\n') end += 2;
            else end++;
        }

        /* Find colon */
        char *colon = strchr(line, ':');
        if (colon) {
            *colon = '\0';
            char *val = colon + 1;
            while (*val == ' ' || *val == '\t') val++;

            /* Trim trailing whitespace from val */
            char *tail = val + strlen(val) - 1;
            while (tail >= val && (*tail == '\r' || *tail == '\n' ||
                                   *tail == ' '  || *tail == '\t'))
                *tail-- = '\0';

            if (strcasecmp(line, "Status") == 0) {
                cgi_status = (int)strtol(val, NULL, 10);
                /* Copy rest as status text */
                char *sp2 = strchr(val, ' ');
                if (sp2) {
                    strncpy(cgi_status_text, sp2 + 1, sizeof(cgi_status_text) - 1);
                    cgi_status_text[sizeof(cgi_status_text) - 1] = '\0';
                }
            } else if (strcasecmp(line, "Content-Type") == 0) {
                strncpy(cgi_content_type, val, sizeof(cgi_content_type) - 1);
                cgi_content_type[sizeof(cgi_content_type) - 1] = '\0';
            }
        }
        line = end;
    }

    /* Body starts right after separator */
    const char *body    = (const char *)stdout_buf.data
                          + hdr_section_len + sep_width;
    size_t      body_len = stdout_buf.len - hdr_section_len - sep_width;

    /* Build response: status line + all CGI headers (except Status) + body */
    /* We forward the raw CGI headers verbatim after the status line, then add
     * Content-Length and Connection before the body. */

    /* Reconstruct a proper HTTP response manually */
    char status_line[128];
    int sllen = snprintf(status_line, sizeof(status_line),
                         "HTTP/1.1 %d %s\r\n", cgi_status, cgi_status_text);
    write_all(client_fd, status_line, (size_t)sllen);

    /* Forward CGI headers line by line, skipping Status: */
    {
        char buf2[4096];
        size_t copy_len = hdr_section_len < sizeof(buf2) - 1
                          ? hdr_section_len : sizeof(buf2) - 1;
        memcpy(buf2, stdout_buf.data, copy_len);
        buf2[copy_len] = '\0';

        char *ln = buf2;
        while (ln && *ln) {
            char *eol = strpbrk(ln, "\r\n");
            char *next;
            if (eol) {
                if (*eol == '\r' && *(eol+1) == '\n') { next = eol + 2; }
                else { next = eol + 1; }
            } else {
                next = NULL;
            }

            /* Isolate just the header name */
            char *col2 = strchr(ln, ':');
            if (col2) {
                size_t namelen = (size_t)(col2 - ln);
                char hname[64] = {0};
                if (namelen < sizeof(hname)) {
                    memcpy(hname, ln, namelen);
                    hname[namelen] = '\0';
                }
                /* Skip Status and Content-Length — we set them ourselves */
                if (strcasecmp(hname, "Status") != 0 &&
                    strcasecmp(hname, "Content-Length") != 0) {
                    /* Write the line */
                    if (eol) {
                        write_all(client_fd, ln, (size_t)(eol - ln));
                        write_all(client_fd, "\r\n", 2);
                    } else {
                        write_all(client_fd, ln, strlen(ln));
                        write_all(client_fd, "\r\n", 2);
                    }
                }
            }
            ln = next;
        }
    }

    /* Add Content-Length and Connection headers */
    char extra[128];
    int elen = snprintf(extra, sizeof(extra),
                        "Content-Length: %zu\r\nConnection: close\r\n\r\n",
                        body_len);
    write_all(client_fd, extra, (size_t)elen);

    /* Write body */
    if (body_len > 0)
        write_all(client_fd, body, body_len);

    free(stdout_buf.data);
}

/* ------------------------------------------------------------------ */
/* Auth check                                                          */
/* ------------------------------------------------------------------ */
int fcgi_check_auth(const char *cookie, const char *host, int port)
{
    /* Connect */
    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_port   = htons((uint16_t)port);
    if (inet_pton(AF_INET, host, &addr.sin_addr) != 1) {
        struct hostent *he = gethostbyname(host);
        if (!he) return 0;
        memcpy(&addr.sin_addr, he->h_addr, (size_t)he->h_length);
    }

    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) return 0;
    if (connect(sock, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        close(sock);
        return 0;
    }

    const uint16_t REQ_ID = 1;

    /* BEGIN_REQUEST */
    {
        uint8_t brbody[8] = {0, FCGI_RESPONDER, 0, 0, 0, 0, 0, 0};
        send_record(sock, FCGI_BEGIN_REQUEST, REQ_ID, brbody, 8);
    }

    /* PARAMS — minimal GET probe to a known lightweight endpoint */
    uint8_t pbuf[2048];
    size_t  plen = 0;

#define AP(n, v) plen += append_nv(pbuf, sizeof(pbuf), plen, (n), (v))
    AP("REQUEST_METHOD",    "GET");
    AP("REQUEST_URI",       "/cgi-bin/system-status?method=GET&section=base_info");
    AP("SCRIPT_NAME",       "/cgi-bin/system-status");
    AP("SCRIPT_FILENAME",   "/cgi-bin/system-status");
    AP("QUERY_STRING",      "method=GET&section=base_info");
    AP("SERVER_NAME",       "localhost");
    AP("SERVER_PORT",       "80");
    AP("SERVER_PROTOCOL",   "HTTP/1.1");
    AP("GATEWAY_INTERFACE", "CGI/1.1");
    AP("CONTENT_LENGTH",    "0");
    if (cookie && cookie[0])
        AP("HTTP_COOKIE", cookie);
#undef AP

    send_params(sock, REQ_ID, pbuf, plen);
    /* Empty STDIN */
    send_record(sock, FCGI_STDIN, REQ_ID, NULL, 0);

    /* Read FCGI_STDOUT records and collect the body */
    char   resp[4096];
    size_t resp_len = 0;
    int    result   = 1; /* innocent until proven guilty */

    for (;;) {
        fcgi_header_t hdr;
        size_t got = 0;
        uint8_t *hp = (uint8_t *)&hdr;
        while (got < sizeof(hdr)) {
            ssize_t n;
            do { n = read(sock, hp + got, sizeof(hdr) - got); }
            while (n == -1 && errno == EINTR);
            if (n <= 0) goto auth_done;
            got += (size_t)n;
        }

        uint16_t clen  = (uint16_t)((hdr.content_len_hi << 8) | hdr.content_len_lo);
        uint8_t  padln = hdr.padding_len;

        if (clen > 0) {
            uint8_t *cbuf = malloc(clen);
            if (!cbuf) { result = 0; goto auth_done; }
            got = 0;
            while (got < clen) {
                ssize_t n;
                do { n = read(sock, cbuf + got, clen - got); }
                while (n == -1 && errno == EINTR);
                if (n <= 0) { free(cbuf); goto auth_done; }
                got += (size_t)n;
            }
            if (hdr.type == FCGI_STDOUT && resp_len < sizeof(resp) - 1) {
                size_t copy = clen < sizeof(resp) - resp_len - 1
                              ? clen : sizeof(resp) - resp_len - 1;
                memcpy(resp + resp_len, cbuf, copy);
                resp_len += copy;
                resp[resp_len] = '\0';
            }
            free(cbuf);
        }

        /* Drain padding */
        if (padln > 0) {
            uint8_t pad[256];
            size_t  pdone = 0;
            while (pdone < padln) {
                ssize_t n;
                do { n = read(sock, pad, padln - pdone); }
                while (n == -1 && errno == EINTR);
                if (n <= 0) goto auth_done;
                pdone += (size_t)n;
            }
        }

        if (hdr.type == FCGI_END_REQUEST) break;
    }

    /* webmgnt returns errCode -32002 for unauthenticated requests */
    if (resp_len > 0 && strstr(resp, "-32002"))
        result = 0;

auth_done:
    close(sock);
    return result;
}
