#ifndef FCGI_H
#define FCGI_H

#include "http.h"

void fcgi_proxy(int client_fd, const http_request_t *req,
                const char *host, int port, int http_port,
                const char *remote_addr);

/* Check whether the given cookie represents a valid webmgnt session.
 * Makes a lightweight FastCGI probe request to host:port.
 * Returns 1 if authenticated, 0 if not (or on any error). */
int fcgi_check_auth(const char *cookie, const char *host, int port);

#endif /* FCGI_H */
