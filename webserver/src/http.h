#ifndef HTTP_H
#define HTTP_H

#include <stddef.h>

#define MAX_HEADERS      32
#define MAX_PATH         512
#define MAX_QUERY        512
#define MAX_METHOD       16
#define MAX_HEADER_NAME  64
#define MAX_HEADER_VALUE 512

typedef struct {
    char name[MAX_HEADER_NAME];
    char value[MAX_HEADER_VALUE];
} http_header_t;

typedef struct {
    char method[MAX_METHOD];
    char path[MAX_PATH];
    char query[MAX_QUERY];
    char version[16];
    http_header_t headers[MAX_HEADERS];
    int header_count;
    size_t content_length;
} http_request_t;

int         http_parse_request(int fd, http_request_t *req);
const char *http_get_header(const http_request_t *req, const char *name);
void        http_send_response(int fd, int status, const char *status_text,
                               const char *content_type, const char *body,
                               size_t body_len);
void        http_send_error(int fd, int status, const char *message);

#endif /* HTTP_H */
