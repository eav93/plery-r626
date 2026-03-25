#include "handlers.h"
#include "fcgi.h"
#include "http.h"
#include "uci.h"

#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>

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
/* UCI helpers shared by GET and SET handlers                          */
/* ------------------------------------------------------------------ */

/* URL-decode src into dst (in-place safe: dst may equal src). */
static void url_decode(const char *src, char *dst, size_t dstsz)
{
    size_t i = 0;
    while (*src && i + 1 < dstsz) {
        if (*src == '%' && isxdigit((unsigned char)src[1]) &&
                           isxdigit((unsigned char)src[2])) {
            char hex[3] = { src[1], src[2], '\0' };
            dst[i++] = (char)(unsigned char)strtol(hex, NULL, 16);
            src += 3;
        } else {
            dst[i++] = *src++;
        }
    }
    dst[i] = '\0';
}

/* Encode a UCI option value into the output buffer (list → \n-joined). */
static void append_uci_val(struct uci_option *o, char *esc, size_t escsz)
{
    if (o->type == UCI_TYPE_STRING) {
        json_escape(o->v.string, esc, escsz);
    } else {
        char joined[512] = "";
        size_t joff = 0;
        struct uci_element *le;
        uci_foreach_element(&o->v.list, le) {
            if (joff > 0 && joff < sizeof(joined) - 1) joined[joff++] = '\n';
            size_t elen = strlen(le->name);
            size_t rem  = sizeof(joined) - joff - 1;
            if (elen > rem) elen = rem;
            memcpy(joined + joff, le->name, elen);
            joff += elen;
        }
        joined[joff] = '\0';
        json_escape(joined, esc, escsz);
    }
}

/* Append one UCI key (option or section) to a heap buffer.
 * key_path is the decoded UCI path used as JSON key prefix.
 * buf, off, cap, first are in/out parameters. */
static void uci_append_key(struct uci_context *ctx, const char *key_path,
                            char **buf, size_t *off, size_t *cap, int *first)
{
    char key_buf[256];
    strncpy(key_buf, key_path, sizeof(key_buf) - 1);
    key_buf[sizeof(key_buf) - 1] = '\0';

    struct uci_ptr ptr;
    if (uci_lookup_ptr(ctx, &ptr, key_buf, true) != UCI_OK) return;

    if (ptr.o) {
        /* Single option: {"package.section.option":"value"} */
        char esc_key[384], esc_val[512];
        json_escape(key_path, esc_key, sizeof(esc_key));
        append_uci_val(ptr.o, esc_val, sizeof(esc_val));

        if (*off + 900 > *cap) {
            *cap *= 2;
            *buf = realloc(*buf, *cap);
            if (!*buf) return;
        }
        *off += (size_t)snprintf(*buf + *off, *cap - *off,
            "%s\"%s\":\"%s\"", *first ? "" : ",", esc_key, esc_val);
        *first = 0;

    } else if (ptr.s) {
        /* Section: emit every option with full path as key */
        struct uci_element *e;
        uci_foreach_element(&ptr.s->options, e) {
            struct uci_option *o = uci_to_option(e);

            char full_path[384], esc_key[384], esc_val[512];
            snprintf(full_path, sizeof(full_path), "%s.%s", key_path, e->name);
            json_escape(full_path, esc_key, sizeof(esc_key));
            append_uci_val(o, esc_val, sizeof(esc_val));

            if (*off + 900 > *cap) {
                *cap *= 2;
                *buf = realloc(*buf, *cap);
                if (!*buf) return;
            }
            *off += (size_t)snprintf(*buf + *off, *cap - *off,
                "%s\"%s\":\"%s\"", *first ? "" : ",", esc_key, esc_val);
            *first = 0;
        }
    }
    /* package-level (ptr.p only) — not supported */
}

/* ------------------------------------------------------------------ */
/* GET /api/uci?get=<path>[,<path>...]  (auth required)               */
/*                                                                     */
/* Comma-separated paths, each may be option or section level.        */
/* Keys are always full UCI paths. URL-encoding is decoded.           */
/*                                                                     */
/* Examples:                                                           */
/*   ?get=network.wan.proto                                           */
/*      → {"network.wan.proto":"dhcp"}                                */
/*   ?get=network.wan                                                  */
/*      → {"network.wan.proto":"dhcp","network.wan.ipaddr":"..."}     */
/*   ?get=network.wan,system.@system[0].hostname                      */
/*      → {"network.wan.proto":"dhcp",...,"system.@system[0].hostname":"PLERY"} */
/* ------------------------------------------------------------------ */
static int handle_uci_get(int client_fd, const http_request_t *req)
{
    if (strcmp(req->path, "/api/uci") != 0) return 0;
    if (strcmp(req->method, "GET")    != 0) return 0;
    if (!check_auth(client_fd, req))        return 1;

    /* Extract ?get= value from query string */
    const char *raw = NULL;
    if (strncmp(req->query, "get=", 4) == 0) {
        raw = req->query + 4;
    } else {
        const char *p = strstr(req->query, "&get=");
        if (p) raw = p + 5;
    }

    if (!raw || !raw[0]) {
        static const char err[] =
            "{\"errCode\":-1,\"errMsg\":\"Missing 'get' parameter\"}";
        http_send_response(client_fd, 400, "Bad Request",
                           "application/json", err, sizeof(err) - 1);
        return 1;
    }

    /* URL-decode the full value (handles %40 → @, %5B → [, %2C → ,) */
    char decoded[1024];
    url_decode(raw, decoded, sizeof(decoded));

    struct uci_context *ctx = uci_alloc_context();
    if (!ctx) { http_send_error(client_fd, 500, "Internal Server Error"); return 1; }

    size_t cap = 4096;
    char *body = malloc(cap);
    if (!body) { uci_free_context(ctx); http_send_error(client_fd, 500, "Internal Server Error"); return 1; }

    body[0] = '{';
    size_t off = 1;
    int first = 1;

    /* Validate all keys before touching UCI (reject on any bad key) */
    {
        char tmp[sizeof(decoded)];
        memcpy(tmp, decoded, sizeof(decoded));
        char *t = tmp;
        while (t && *t) {
            char *comma = strchr(t, ',');
            if (comma) *comma = '\0';
            if (!is_safe_uci_key(t)) {
                free(body);
                uci_free_context(ctx);
                static const char bad[] =
                    "{\"errCode\":-1,\"errMsg\":\"Invalid UCI key\"}";
                http_send_response(client_fd, 400, "Bad Request",
                                   "application/json", bad, sizeof(bad) - 1);
                return 1;
            }
            t = comma ? comma + 1 : NULL;
        }
    }

    /* Split decoded value by comma, look up each key */
    char *tok = decoded;
    while (tok && *tok) {
        char *comma = strchr(tok, ',');
        if (comma) *comma = '\0';
        uci_append_key(ctx, tok, &body, &off, &cap, &first);
        tok = comma ? comma + 1 : NULL;
    }

    uci_free_context(ctx);

    if (off + 2 < cap) body[off++] = '}';
    http_send_response(client_fd, 200, "OK",
                       "application/json; charset=utf-8",
                       body, off);
    free(body);
    return 1;
}

/* ------------------------------------------------------------------ */
/* POST /api/uci/set  (auth required)                                  */
/*                                                                      */
/* Body is a flat JSON object: {"uci.path.key":"value", ...}           */
/* All pairs are set and committed in one request.                     */
/* Response: {"result":"ok"} or {"errCode":-1,"errMsg":"..."}          */
/* ------------------------------------------------------------------ */

/* Iterate over all string key-value pairs in a flat JSON object.
 * cb(key, value, ctx) — return < 0 to stop. */
static int json_obj_each(const char *json,
                          int (*cb)(const char *, const char *, void *),
                          void *ctx)
{
    const char *p = strchr(json, '{');
    if (!p) return 0;
    p++;
    char key[256], val[512];
    int count = 0;
    while (*p) {
        while (*p == ' ' || *p == '\t' || *p == '\n' || *p == ',') p++;
        if (*p == '}' || *p == '\0') break;
        if (*p != '"') { p++; continue; }
        p++;
        size_t i = 0;
        while (*p && *p != '"' && i + 1 < sizeof(key)) {
            if (*p == '\\') { p++; if (*p) key[i++] = *p++; }
            else key[i++] = *p++;
        }
        key[i] = '\0';
        if (*p == '"') p++;
        while (*p == ' ' || *p == '\t' || *p == ':') p++;
        if (*p != '"') {
            /* skip non-string values */
            while (*p && *p != ',' && *p != '}') p++;
            continue;
        }
        p++;
        i = 0;
        while (*p && *p != '"' && i + 1 < sizeof(val)) {
            if (*p == '\\') { p++; if (*p) val[i++] = *p++; }
            else val[i++] = *p++;
        }
        val[i] = '\0';
        if (*p == '"') p++;
        if (cb(key, val, ctx) < 0) break;
        count++;
    }
    return count;
}

typedef struct {
    struct uci_context *ctx;
    const char *errmsg;
    int bad_key;
} set_ctx_t;

static int set_one_cb(const char *key, const char *val, void *vctx)
{
    set_ctx_t *s = (set_ctx_t *)vctx;
    if (!is_safe_uci_key(key)) {
        s->errmsg = "Invalid UCI key";
        s->bad_key = 1;
        return -1;
    }

    char key_buf[256];
    strncpy(key_buf, key, sizeof(key_buf) - 1);
    key_buf[sizeof(key_buf) - 1] = '\0';

    /* val may be up to 512 bytes; uci_set needs a mutable string */
    char val_buf[512];
    strncpy(val_buf, val, sizeof(val_buf) - 1);
    val_buf[sizeof(val_buf) - 1] = '\0';

    struct uci_ptr ptr;
    if (uci_lookup_ptr(s->ctx, &ptr, key_buf, true) != UCI_OK) {
        s->errmsg = "Lookup failed";
        return -1;
    }
    ptr.value = val_buf;
    if (uci_set(s->ctx, &ptr) != UCI_OK) {
        s->errmsg = "Set failed";
        return -1;
    }
    if (uci_commit(s->ctx, &ptr.p, false) != UCI_OK) {
        s->errmsg = "Commit failed";
        return -1;
    }
    return 0;
}

static int handle_uci_set(int client_fd, const http_request_t *req)
{
    if (strcmp(req->path, "/api/uci/set") != 0) return 0;
    if (strcmp(req->method, "POST")       != 0) return 0;
    if (!check_auth(client_fd, req))             return 1;

    char *body = read_body(client_fd, req);
    if (!body) { http_send_error(client_fd, 400, "Bad Request"); return 1; }

    struct uci_context *ctx = uci_alloc_context();
    if (!ctx) { free(body); http_send_error(client_fd, 500, "Internal Server Error"); return 1; }

    set_ctx_t s = { ctx, NULL, 0 };
    json_obj_each(body, set_one_cb, &s);
    free(body);
    uci_free_context(ctx);

    if (s.errmsg) {
        int code = s.bad_key ? 400 : 500;
        const char *status = s.bad_key ? "Bad Request" : "Internal Server Error";
        char resp[128];
        int rlen = snprintf(resp, sizeof(resp),
                            "{\"errCode\":-1,\"errMsg\":\"%s\"}", s.errmsg);
        http_send_response(client_fd, code, status,
                           "application/json", resp, (size_t)rlen);
    } else {
        static const char ok[] = "{\"result\":\"ok\"}";
        http_send_response(client_fd, 200, "OK",
                           "application/json", ok, sizeof(ok) - 1);
    }
    return 1;
}

/* ------------------------------------------------------------------ */
/* System stats                                                         */
/* GET /api/system/stats  (auth required)                             */
/* Response: {"cpu_pct":25,"mem_total":65536,"mem_avail":40000,       */
/*            "rx_bytes":12345,"tx_bytes":6789}                       */
/* ------------------------------------------------------------------ */
static int read_cpu_stat(unsigned long long *total, unsigned long long *idle)
{
    FILE *fp = fopen("/proc/stat", "r");
    if (!fp) return -1;
    unsigned long long user, nice, sys, id, iowait, irq, softirq;
    int r = fscanf(fp, "cpu  %llu %llu %llu %llu %llu %llu %llu",
                   &user, &nice, &sys, &id, &iowait, &irq, &softirq);
    fclose(fp);
    if (r < 7) return -1;
    *idle  = id + iowait;
    *total = user + nice + sys + id + iowait + irq + softirq;
    return 0;
}

static int read_netdev(const char *iface,
                        unsigned long long *rx, unsigned long long *tx)
{
    FILE *fp = fopen("/proc/net/dev", "r");
    if (!fp) return -1;
    char line[256];
    *rx = *tx = 0;
    while (fgets(line, sizeof(line), fp)) {
        char name[32] = "";
        unsigned long long rb = 0, tb = 0;
        if (sscanf(line, " %31[^:]: %llu %*u %*u %*u %*u %*u %*u %*u %llu",
                   name, &rb, &tb) >= 3 &&
            strcmp(name, iface) == 0)
        {
            *rx = rb; *tx = tb;
            fclose(fp);
            return 0;
        }
    }
    fclose(fp);
    return -1;
}

static int handle_system_stats(int client_fd, const http_request_t *req)
{
    if (strcmp(req->path, "/api/system/stats") != 0) return 0;
    if (!check_auth(client_fd, req)) return 1;

    /* CPU: 200 ms sample */
    unsigned long long tot1 = 0, idl1 = 0, tot2 = 0, idl2 = 0;
    read_cpu_stat(&tot1, &idl1);
    usleep(200000);
    read_cpu_stat(&tot2, &idl2);

    int cpu_pct = 0;
    if (tot2 > tot1) {
        unsigned long long dtot  = tot2 - tot1;
        unsigned long long didle = (idl2 > idl1) ? idl2 - idl1 : 0;
        cpu_pct = (int)(100ULL * (dtot - didle) / dtot);
    }

    /* Memory */
    unsigned long mem_total = 0, mem_avail = 0;
    FILE *fp = fopen("/proc/meminfo", "r");
    if (fp) {
        char line[128];
        while (fgets(line, sizeof(line), fp)) {
            unsigned long v;
            if (sscanf(line, "MemTotal: %lu kB", &v) == 1)     mem_total = v;
            if (sscanf(line, "MemAvailable: %lu kB", &v) == 1) mem_avail = v;
        }
        fclose(fp);
    }
    int mem_pct = mem_total ? (int)(100UL * (mem_total - mem_avail) / mem_total) : 0;

    /* Network — get WAN ifname from UCI, fall back to eth1 */
    char wan_iface[32] = "eth1";
    struct uci_context *ctx = uci_alloc_context();
    if (ctx) {
        char key[] = "network.wan.ifname";
        struct uci_ptr ptr;
        if (uci_lookup_ptr(ctx, &ptr, key, true) == UCI_OK &&
            (ptr.flags & UCI_LOOKUP_COMPLETE) && ptr.o &&
            ptr.o->type == UCI_TYPE_STRING)
        {
            strncpy(wan_iface, ptr.o->v.string, sizeof(wan_iface) - 1);
            wan_iface[sizeof(wan_iface) - 1] = '\0';
        }
        uci_free_context(ctx);
    }

    unsigned long long rx = 0, tx = 0;
    read_netdev(wan_iface, &rx, &tx);

    char body[256];
    int blen = snprintf(body, sizeof(body),
        "{\"cpu_pct\":%d,\"mem_pct\":%d,\"mem_total\":%lu,\"mem_avail\":%lu,"
        "\"rx_bytes\":%llu,\"tx_bytes\":%llu}",
        cpu_pct, mem_pct, mem_total, mem_avail, rx, tx);

    http_send_response(client_fd, 200, "OK",
                       "application/json; charset=utf-8",
                       body, (size_t)blen);
    return 1;
}

/* ------------------------------------------------------------------ */
/* System version                                                       */
/* GET /api/system/version  (auth required)                           */
/* Response: {"version":"CF-PLERY-...","macaddr":"AA:BB:CC:DD:EE:FF"} */
/* ------------------------------------------------------------------ */
static int handle_system_version(int client_fd, const http_request_t *req)
{
    if (strcmp(req->path, "/api/system/version") != 0) return 0;
    if (!check_auth(client_fd, req)) return 1;

    char version[128] = "unknown";
    FILE *fp = fopen("/etc/defconfig/cf-plery/version", "r");
    if (fp) {
        if (fgets(version, sizeof(version), fp)) {
            size_t n = strlen(version);
            while (n > 0 && (version[n-1] == '\n' || version[n-1] == '\r'))
                version[--n] = '\0';
        }
        fclose(fp);
    }

    char macaddr[32] = "00:00:00:00:00:00";
    struct uci_context *ctx = uci_alloc_context();
    if (ctx) {
        /* Try def_wan_macaddr first, then wan.macaddr */
        static const char *mac_keys[] = {
            "network.def_wan_macaddr",
            "network.wan.macaddr",
            NULL
        };
        for (int i = 0; mac_keys[i]; i++) {
            char key_buf[64];
            strncpy(key_buf, mac_keys[i], sizeof(key_buf) - 1);
            key_buf[sizeof(key_buf) - 1] = '\0';
            struct uci_ptr ptr;
            if (uci_lookup_ptr(ctx, &ptr, key_buf, true) == UCI_OK &&
                (ptr.flags & UCI_LOOKUP_COMPLETE) && ptr.o &&
                ptr.o->type == UCI_TYPE_STRING &&
                ptr.o->v.string[0] != '\0')
            {
                strncpy(macaddr, ptr.o->v.string, sizeof(macaddr) - 1);
                macaddr[sizeof(macaddr) - 1] = '\0';
                break;
            }
        }
        uci_free_context(ctx);
    }

    char esc_ver[256], esc_mac[64];
    json_escape(version, esc_ver, sizeof(esc_ver));
    json_escape(macaddr, esc_mac, sizeof(esc_mac));

    char body[512];
    int blen = snprintf(body, sizeof(body),
                        "{\"version\":\"%s\",\"macaddr\":\"%s\"}",
                        esc_ver, esc_mac);
    http_send_response(client_fd, 200, "OK",
                       "application/json; charset=utf-8",
                       body, (size_t)blen);
    return 1;
}

/* ------------------------------------------------------------------ */
/* System language                                                      */
/* GET  /api/system/language  — returns {"language":"ru","changed":1} */
/* POST /api/system/language  — body {"language":"ru"} sets + commits */
/* ------------------------------------------------------------------ */
static int handle_system_language(int client_fd, const http_request_t *req)
{
    if (strcmp(req->path, "/api/system/language") != 0) return 0;
    if (!check_auth(client_fd, req)) return 1;

    if (strcmp(req->method, "GET") == 0) {
        char lang[16] = "en";
        int  changed  = 0;
        struct uci_context *ctx = uci_alloc_context();
        if (ctx) {
            char k1[] = "system.language.language";
            char k2[] = "system.language.changed";
            struct uci_ptr ptr;
            if (uci_lookup_ptr(ctx, &ptr, k1, true) == UCI_OK &&
                (ptr.flags & UCI_LOOKUP_COMPLETE) && ptr.o &&
                ptr.o->type == UCI_TYPE_STRING)
            {
                strncpy(lang, ptr.o->v.string, sizeof(lang) - 1);
                lang[sizeof(lang) - 1] = '\0';
            }
            if (uci_lookup_ptr(ctx, &ptr, k2, true) == UCI_OK &&
                (ptr.flags & UCI_LOOKUP_COMPLETE) && ptr.o &&
                ptr.o->type == UCI_TYPE_STRING)
            {
                changed = atoi(ptr.o->v.string);
            }
            uci_free_context(ctx);
        }
        char esc[32];
        json_escape(lang, esc, sizeof(esc));
        char body[128];
        int blen = snprintf(body, sizeof(body),
                            "{\"language\":\"%s\",\"changed\":%d}",
                            esc, changed);
        http_send_response(client_fd, 200, "OK",
                           "application/json; charset=utf-8",
                           body, (size_t)blen);
        return 1;
    }

    if (strcmp(req->method, "POST") == 0) {
        char *body = read_body(client_fd, req);
        if (!body) { http_send_error(client_fd, 400, "Bad Request"); return 1; }
        char lang[16] = {0};
        json_get_str(body, "language", lang, sizeof(lang));
        free(body);

        /* Whitelist languages */
        if (strcmp(lang, "en") != 0 && strcmp(lang, "ru") != 0 &&
            strcmp(lang, "cn") != 0)
        {
            static const char err[] = "{\"errCode\":-1,\"errMsg\":\"Invalid language\"}";
            http_send_response(client_fd, 400, "Bad Request",
                               "application/json", err, sizeof(err) - 1);
            return 1;
        }

        struct uci_context *ctx = uci_alloc_context();
        if (!ctx) { http_send_error(client_fd, 500, "Internal Server Error"); return 1; }

        const char *errmsg = NULL;
        char key_buf[] = "system.language.language";
        struct uci_ptr ptr;
        if (uci_lookup_ptr(ctx, &ptr, key_buf, true) != UCI_OK) {
            errmsg = "Lookup failed";
        } else {
            ptr.value = lang;
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

    return 0;
}

/* ------------------------------------------------------------------ */
/* DHCP leases                                                          */
/* GET /api/dhcp/leases  (auth required)                              */
/* Response: {"leases":[{"mac":"..","ip":"..","hostname":"..","expires":N}]} */
/* ------------------------------------------------------------------ */
static int handle_dhcp_leases(int client_fd, const http_request_t *req)
{
    if (strcmp(req->path, "/api/dhcp/leases") != 0) return 0;
    if (!check_auth(client_fd, req)) return 1;

    /* Build JSON into a heap buffer (leases file can be large) */
    size_t cap = 4096;
    char *out = malloc(cap);
    if (!out) { http_send_error(client_fd, 500, "Internal Server Error"); return 1; }

    size_t off = 0;
    off += (size_t)snprintf(out + off, cap - off, "{\"leases\":[");

    FILE *fp = fopen("/tmp/dhcp.leases", "r");
    if (fp) {
        char line[256];
        int first = 1;
        while (fgets(line, sizeof(line), fp)) {
            long long expires = 0;
            char mac[32] = "", ip[32] = "", host[64] = "";
            if (sscanf(line, "%lld %31s %31s %63s", &expires, mac, ip, host) < 3)
                continue;
            if (strcmp(host, "*") == 0) host[0] = '\0';

            char esc_mac[64], esc_ip[64], esc_host[128];
            json_escape(mac,  esc_mac,  sizeof(esc_mac));
            json_escape(ip,   esc_ip,   sizeof(esc_ip));
            json_escape(host, esc_host, sizeof(esc_host));

            /* Grow buffer if needed */
            size_t needed = off + 256;
            if (needed > cap) {
                cap *= 2;
                char *tmp = realloc(out, cap);
                if (!tmp) break;
                out = tmp;
            }

            off += (size_t)snprintf(out + off, cap - off,
                "%s{\"mac\":\"%s\",\"ip\":\"%s\",\"hostname\":\"%s\",\"expires\":%lld}",
                first ? "" : ",", esc_mac, esc_ip, esc_host, expires);
            first = 0;
        }
        fclose(fp);
    }

    if (off + 4 < cap) {
        out[off++] = ']';
        out[off++] = '}';
    }

    http_send_response(client_fd, 200, "OK",
                       "application/json; charset=utf-8",
                       out, off);
    free(out);
    return 1;
}

/* ------------------------------------------------------------------ */
/* ARP table                                                            */
/* GET /api/arp  (auth required)                                      */
/* Response: {"entries":[{"ip":"..","mac":"..","iface":".."}]}        */
/* ------------------------------------------------------------------ */
static int handle_arp(int client_fd, const http_request_t *req)
{
    if (strcmp(req->path, "/api/arp") != 0) return 0;
    if (!check_auth(client_fd, req)) return 1;

    char out[4096];
    size_t off = (size_t)snprintf(out, sizeof(out), "{\"entries\":[");
    int first = 1;

    FILE *fp = fopen("/proc/net/arp", "r");
    if (fp) {
        char line[256];
        fgets(line, sizeof(line), fp); /* skip header */
        while (fgets(line, sizeof(line), fp)) {
            char ip[32] = "", hwtype[16] = "", flags[16] = "";
            char mac[32] = "", mask[16] = "", iface[32] = "";
            if (sscanf(line, "%31s %15s %15s %31s %15s %31s",
                       ip, hwtype, flags, mac, mask, iface) < 6) continue;
            if (strcmp(mac, "00:00:00:00:00:00") == 0) continue;

            char esc_ip[64], esc_mac[64], esc_iface[64];
            json_escape(ip,    esc_ip,    sizeof(esc_ip));
            json_escape(mac,   esc_mac,   sizeof(esc_mac));
            json_escape(iface, esc_iface, sizeof(esc_iface));

            size_t n = (size_t)snprintf(out + off, sizeof(out) - off,
                "%s{\"ip\":\"%s\",\"mac\":\"%s\",\"iface\":\"%s\"}",
                first ? "" : ",", esc_ip, esc_mac, esc_iface);
            if (off + n + 4 >= sizeof(out)) break;
            off += n;
            first = 0;
        }
        fclose(fp);
    }

    if (off + 4 < sizeof(out)) {
        out[off++] = ']';
        out[off++] = '}';
    }
    http_send_response(client_fd, 200, "OK",
                       "application/json; charset=utf-8",
                       out, off);
    return 1;
}

/* ------------------------------------------------------------------ */
/* Actions: POST /api/action/reboot                                    */
/*          POST /api/action/reset                                     */
/*          POST /api/action/apply  body: {"service":"network"}       */
/* ------------------------------------------------------------------ */
static void run_delayed(const char *cmd)
{
    pid_t pid = fork();
    if (pid == 0) {
        /* Detach from parent process group */
        setsid();
        sleep(1);
        execl("/bin/sh", "sh", "-c", cmd, NULL);
        _exit(1);
    }
    /* Parent does not wait — child is daemonised */
}

static int handle_action(int client_fd, const http_request_t *req)
{
    if (strncmp(req->path, "/api/action/", 12) != 0) return 0;
    if (strcmp(req->method, "POST") != 0)             return 0;
    if (!check_auth(client_fd, req))                  return 1;

    const char *action = req->path + 12; /* "reboot", "reset", "apply" */

    static const char ok[] = "{\"result\":\"ok\"}";
    static const char err[] = "{\"errCode\":-1,\"errMsg\":\"Unknown action\"}";

    if (strcmp(action, "reboot") == 0) {
        http_send_response(client_fd, 200, "OK",
                           "application/json", ok, sizeof(ok) - 1);
        run_delayed("reboot");
        return 1;
    }

    if (strcmp(action, "reset") == 0) {
        http_send_response(client_fd, 200, "OK",
                           "application/json", ok, sizeof(ok) - 1);
        run_delayed("firstboot -y && reboot");
        return 1;
    }

    if (strcmp(action, "apply") == 0) {
        char *body = read_body(client_fd, req);
        char service[32] = {0};
        if (body) {
            json_get_str(body, "service", service, sizeof(service));
            free(body);
        }
        /* Whitelist service names to prevent injection */
        static const char *allowed[] = {
            "network", "wireless", "system", "firewall", "dnsmasq", NULL
        };
        int ok_svc = 0;
        for (int i = 0; allowed[i]; i++) {
            if (strcmp(service, allowed[i]) == 0) { ok_svc = 1; break; }
        }
        if (!ok_svc) {
            static const char bad[] =
                "{\"errCode\":-1,\"errMsg\":\"Invalid service\"}";
            http_send_response(client_fd, 400, "Bad Request",
                               "application/json", bad, sizeof(bad) - 1);
            return 1;
        }
        http_send_response(client_fd, 200, "OK",
                           "application/json", ok, sizeof(ok) - 1);
        char cmd[128];
        snprintf(cmd, sizeof(cmd), "/etc/init.d/%s reload", service);
        run_delayed(cmd);
        return 1;
    }

    http_send_response(client_fd, 400, "Bad Request",
                       "application/json", err, sizeof(err) - 1);
    return 1;
}

/* ------------------------------------------------------------------ */
/* Handler table                                                        */
/* ------------------------------------------------------------------ */
static handler_t handlers[] = {
    { "/api/ping",             handle_ping            },
    { "/api/sysinfo",          handle_sysinfo         },
    { "/api/uci/set",          handle_uci_set         },
    { "/api/uci",              handle_uci_get         },
    { "/api/system/stats",     handle_system_stats    },
    { "/api/system/version",   handle_system_version  },
    { "/api/system/language",  handle_system_language },
    { "/api/dhcp/leases",      handle_dhcp_leases     },
    { "/api/arp",              handle_arp             },
    { "/api/action/",          handle_action          },
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
