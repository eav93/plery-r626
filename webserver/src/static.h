#ifndef STATIC_H
#define STATIC_H

#include "http.h"

void static_serve(int client_fd, const http_request_t *req,
                  const char *webroot);

#endif /* STATIC_H */
