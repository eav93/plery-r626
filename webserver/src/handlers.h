#ifndef HANDLERS_H
#define HANDLERS_H

#include "http.h"

/* A handler function receives the client socket and the parsed request.
 * Return 1 if the request was handled (response sent), 0 to fall through. */
typedef int (*handler_fn_t)(int client_fd, const http_request_t *req);

typedef struct {
    const char   *path_prefix; /* e.g. "/api/"  — prefix match */
    handler_fn_t  fn;
} handler_t;

/* Call once at startup. */
void handlers_init(void);

/* Try each registered handler in order.
 * Returns 1 if a handler matched and sent a response, 0 otherwise. */
int handlers_dispatch(int client_fd, const http_request_t *req);

#endif /* HANDLERS_H */
