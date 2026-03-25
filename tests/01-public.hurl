# Public endpoints and 401 enforcement (no session cookie)

# Ping — no auth required
GET http://{{host}}/api/ping
HTTP 200
[Asserts]
jsonpath "$.status" == "ok"


# Auth check without cookie → not authenticated
GET http://{{host}}/api/auth/check
HTTP 200
[Asserts]
jsonpath "$.authenticated" == false


# Protected endpoints must return 401 without cookie
GET http://{{host}}/api/sysinfo
HTTP 401
[Asserts]
jsonpath "$.errCode" == -32002


GET http://{{host}}/api/system/stats
HTTP 401


GET http://{{host}}/api/uci?get=network.lan.ipaddr
HTTP 401


GET http://{{host}}/api/system/version
HTTP 401
