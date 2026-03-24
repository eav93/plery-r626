#include "handlers.h"
#include "http.h"

#include <string.h>

/* ------------------------------------------------------------------ */
/* Built-in handler: GET /api/ping                                     */
/* ------------------------------------------------------------------ */
static int handle_ping(int client_fd, const http_request_t *req)
{
    /* Only handle exact path /api/ping */
    if (strcmp(req->path, "/api/ping") != 0)
        return 0;

    static const char body[] = "{\"status\":\"ok\"}";
    http_send_response(client_fd, 200, "OK",
                       "application/json",
                       body, sizeof(body) - 1);
    return 1;
}

/* ------------------------------------------------------------------ */
/* Handler table                                                        */
/*                                                                      */
/* To add a new custom handler:                                         */
/*   1. Write a function:  static int handle_foo(int, const http_request_t *); */
/*   2. Add an entry below: { "/foo", handle_foo }                      */
/*   3. The path_prefix is a prefix match — a handler for "/api/"      */
/*      receives ALL requests whose path starts with "/api/".           */
/*      The handler can then inspect req->path further and return 0     */
/*      to fall through to the next handler.                            */
/* ------------------------------------------------------------------ */
static handler_t handlers[] = {
    { "/api/", handle_ping },
    /* Add custom handlers here */
};

static const int num_handlers = (int)(sizeof(handlers) / sizeof(handlers[0]));

/* ------------------------------------------------------------------ */

void handlers_init(void)
{
    /* Nothing to initialise currently.
     * Add per-handler setup here if needed. */
}

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
