#include "handlers.h"
#include "fcgi.h"
#include "http.h"
#include "uci.h"

#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

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
/* JSON helpers                                                         */
/* ------------------------------------------------------------------ */

/* Escape a string for safe embedding in a JSON string value */
static void json_escape(const char *src, char *dst, size_t dstsz)
{
    size_t i = 0;
    for (; *src && i + 2 < dstsz; src++) {
        unsigned char c = (unsigned char)*src;
        if (c == '"' || c == '\\') {
            if (i + 3 >= dstsz) break;
            dst[i++] = '\\';
            dst[i++] = (char)c;
        } else if (c == '\n') {
            if (i + 3 >= dstsz) break;
            dst[i++] = '\\'; dst[i++] = 'n';
        } else if (c == '\r') {
            /* skip */
        } else if (c < 0x20) {
            /* skip other control chars */
        } else {
            dst[i++] = (char)c;
        }
    }
    dst[i] = '\0';
}

/* Extract a JSON string field from a flat JSON object.
 * e.g. json_get_str(body, "key", buf, sizeof(buf))
 * Returns dst on success, NULL if field not found. */
static char *json_get_str(const char *json, const char *field,
                           char *dst, size_t dstsz)
{
    char search[64];
    snprintf(search, sizeof(search), "\"%s\"", field);
    const char *p = strstr(json, search);
    if (!p) return NULL;
    p += strlen(search);
    while (*p == ' ' || *p == '\t' || *p == ':') p++;
    if (*p != '"') return NULL;
    p++;
    size_t i = 0;
    while (*p && *p != '"' && i + 1 < dstsz) {
        if (*p == '\\') {
            p++;
            if      (*p == '"')  dst[i++] = '"';
            else if (*p == '\\') dst[i++] = '\\';
            else if (*p == 'n')  dst[i++] = '\n';
            else if (*p == 'r')  dst[i++] = '\r';
            else if (*p)         dst[i++] = *p;
            if (*p) p++;
        } else {
            dst[i++] = *p++;
        }
    }
    dst[i] = '\0';
    return dst;
}

/* Read the request body (up to content_length bytes) into a malloc'd buffer.
 * Caller must free(). Returns NULL on error or empty body. */
static char *read_body(int client_fd, const http_request_t *req)
{
    if (req->content_length == 0 || req->content_length > 65536)
        return NULL;
    char *buf = malloc(req->content_length + 1);
    if (!buf) return NULL;
    size_t got = 0;
    while (got < req->content_length) {
        ssize_t n = read(client_fd, buf + got, req->content_length - got);
        if (n <= 0) { free(buf); return NULL; }
        got += (size_t)n;
    }
    buf[got] = '\0';
    return buf;
}

/* Validate a UCI path: only allow [a-zA-Z0-9._@\[\]-]
 * Prevents any shell injection even though we use libuci directly. */
static int is_safe_uci_key(const char *key)
{
    if (!key || !key[0]) return 0;
    for (const char *p = key; *p; p++) {
        unsigned char c = (unsigned char)*p;
        if (!isalnum(c) && c != '.' && c != '_' && c != '-' &&
            c != '@'    && c != '[' && c != ']')
            return 0;
    }
    return 1;
}

/* ------------------------------------------------------------------ */
/* GET /api/ping  (no auth)                                            */
/* ------------------------------------------------------------------ */
static int handle_ping(int client_fd, const http_request_t *req)
{
    if (strcmp(req->path, "/api/ping") != 0) return 0;
    static const char body[] = "{\"status\":\"ok\"}";
    http_send_response(client_fd, 200, "OK", "application/json",
                       body, sizeof(body) - 1);
    return 1;
}

/* ------------------------------------------------------------------ */
/* GET /api/sysinfo  (auth required)                                   */
/* ------------------------------------------------------------------ */
static int handle_sysinfo(int client_fd, const http_request_t *req)
{
    if (strcmp(req->path, "/api/sysinfo") != 0) return 0;
    if (!check_auth(client_fd, req)) return 1;

    char hostname[64] = "unknown";
    struct uci_context *ctx = uci_alloc_context();
    if (ctx) {
        char key[] = "system.@system[0].hostname";
        struct uci_ptr ptr;
        if (uci_lookup_ptr(ctx, &ptr, key, true) == UCI_OK &&
            (ptr.flags & UCI_LOOKUP_COMPLETE) && ptr.o &&
            ptr.o->type == UCI_TYPE_STRING) {
            strncpy(hostname, ptr.o->v.string, sizeof(hostname) - 1);
            hostname[sizeof(hostname) - 1] = '\0';
        }
        uci_free_context(ctx);
    }

    char uptime[32] = "0";
    FILE *fp = fopen("/proc/uptime", "r");
    if (fp) {
        double up = 0;
        fscanf(fp, "%lf", &up);
        snprintf(uptime, sizeof(uptime), "%.0f", up);
        fclose(fp);
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
/* GET /api/uci?get=<path>  (auth required)                            */
/*                                                                      */
/* Returns the value of a single UCI option.                            */
/* Example: GET /api/uci?get=system.@system[0].hostname                 */
/* Response: {"value":"PLERY"}                                          */
/* ------------------------------------------------------------------ */
static int handle_uci_get(int client_fd, const http_request_t *req)
{
    if (strcmp(req->path, "/api/uci") != 0) return 0;
    if (strcmp(req->method, "GET")    != 0) return 0;
    if (!check_auth(client_fd, req))        return 1;

    /* Extract ?get=<key> from query string */
    const char *key = NULL;
    if (strncmp(req->query, "get=", 4) == 0) {
        key = req->query + 4;
    } else {
        const char *p = strstr(req->query, "&get=");
        if (p) key = p + 5;
    }

    if (!is_safe_uci_key(key)) {
        static const char err[] =
            "{\"errCode\":-1,\"errMsg\":\"Missing or invalid 'get' parameter\"}";
        http_send_response(client_fd, 400, "Bad Request",
                           "application/json", err, sizeof(err) - 1);
        return 1;
    }

    struct uci_context *ctx = uci_alloc_context();
    if (!ctx) { http_send_error(client_fd, 500, "Internal Server Error"); return 1; }

    char key_buf[256];
    strncpy(key_buf, key, sizeof(key_buf) - 1);
    key_buf[sizeof(key_buf) - 1] = '\0';

    char body[1024];
    int blen;
    struct uci_ptr ptr;

    if (uci_lookup_ptr(ctx, &ptr, key_buf, true) == UCI_OK &&
        (ptr.flags & UCI_LOOKUP_COMPLETE) && ptr.o)
    {
        char esc[512];
        if (ptr.o->type == UCI_TYPE_STRING) {
            json_escape(ptr.o->v.string, esc, sizeof(esc));
            blen = snprintf(body, sizeof(body), "{\"value\":\"%s\"}", esc);
        } else {
            /* List: join with \n */
            char joined[512] = "";
            size_t off = 0;
            struct uci_element *e;
            uci_foreach_element(&ptr.o->v.list, e) {
                if (off > 0 && off < sizeof(joined) - 1)
                    joined[off++] = '\n';
                size_t rem  = sizeof(joined) - off - 1;
                size_t elen = strlen(e->name);
                if (elen > rem) elen = rem;
                memcpy(joined + off, e->name, elen);
                off += elen;
            }
            joined[off] = '\0';
            json_escape(joined, esc, sizeof(esc));
            blen = snprintf(body, sizeof(body), "{\"value\":\"%s\"}", esc);
        }
    } else {
        blen = snprintf(body, sizeof(body),
                        "{\"errCode\":-2,\"errMsg\":\"Not found\"}");
    }

    uci_free_context(ctx);
    http_send_response(client_fd, 200, "OK",
                       "application/json; charset=utf-8",
                       body, (size_t)blen);
    return 1;
}

/* ------------------------------------------------------------------ */
/* POST /api/uci/set  (auth required)                                  */
/*                                                                      */
/* Sets a single UCI option and commits.                                */
/* Body: {"key":"system.@system[0].hostname","value":"NewName"}         */
/* Response: {"result":"ok"} or {"errCode":-1,"errMsg":"..."}           */
/* ------------------------------------------------------------------ */
static int handle_uci_set(int client_fd, const http_request_t *req)
{
    if (strcmp(req->path, "/api/uci/set") != 0) return 0;
    if (strcmp(req->method, "POST")       != 0) return 0;
    if (!check_auth(client_fd, req))             return 1;

    char *body = read_body(client_fd, req);
    if (!body) {
        http_send_error(client_fd, 400, "Bad Request");
        return 1;
    }

    char uci_key[256] = {0};
    char uci_val[512] = {0};
    json_get_str(body, "key",   uci_key, sizeof(uci_key));
    json_get_str(body, "value", uci_val, sizeof(uci_val));
    free(body);

    if (!is_safe_uci_key(uci_key)) {
        static const char err[] = "{\"errCode\":-1,\"errMsg\":\"Invalid UCI key\"}";
        http_send_response(client_fd, 400, "Bad Request",
                           "application/json", err, sizeof(err) - 1);
        return 1;
    }

    struct uci_context *ctx = uci_alloc_context();
    if (!ctx) { http_send_error(client_fd, 500, "Internal Server Error"); return 1; }

    char key_buf[256];
    strncpy(key_buf, uci_key, sizeof(key_buf) - 1);
    key_buf[sizeof(key_buf) - 1] = '\0';

    struct uci_ptr ptr;
    const char *errmsg = NULL;

    if (uci_lookup_ptr(ctx, &ptr, key_buf, true) != UCI_OK) {
        errmsg = "Lookup failed";
    } else {
        ptr.value = uci_val;
        if (uci_set(ctx, &ptr) != UCI_OK)
            errmsg = "Set failed";
        else if (uci_commit(ctx, &ptr.p, false) != UCI_OK)
            errmsg = "Commit failed";
    }

    uci_free_context(ctx);

    if (errmsg) {
        char resp[128];
        int rlen = snprintf(resp, sizeof(resp),
                            "{\"errCode\":-1,\"errMsg\":\"%s\"}", errmsg);
        http_send_response(client_fd, 500, "Internal Server Error",
                           "application/json", resp, (size_t)rlen);
    } else {
        static const char ok[] = "{\"result\":\"ok\"}";
        http_send_response(client_fd, 200, "OK",
                           "application/json", ok, sizeof(ok) - 1);
    }
    return 1;
}

/* ------------------------------------------------------------------ */
/* Handler table                                                        */
/* ------------------------------------------------------------------ */
static handler_t handlers[] = {
    { "/api/ping",    handle_ping    },
    { "/api/sysinfo", handle_sysinfo },
    { "/api/uci",     handle_uci_get },
    { "/api/uci/set", handle_uci_set },
};

static const int num_handlers = (int)(sizeof(handlers) / sizeof(handlers[0]));

int handlers_dispatch(int client_fd, const http_request_t *req)
{
    for (int i = 0; i < num_handlers; i++) {
        const char *prefix = handlers[i].path_prefix;
        if (strncmp(req->path, prefix, strlen(prefix)) == 0) {
            if (handlers[i].fn(client_fd, req))
                return 1;
        }
    }
    return 0;
}
