#ifndef FCGI_H
#define FCGI_H

#include "http.h"

void fcgi_proxy(int client_fd, const http_request_t *req,
                const char *host, int port);

#endif /* FCGI_H */
