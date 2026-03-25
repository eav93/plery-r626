# System info endpoints: stats, version, language, ports

POST http://{{host}}/api/auth/login
Content-Type: application/json
{ "password": "{{password}}" }

HTTP 200


# Stats — all expected fields present and sensible
GET http://{{host}}/api/system/stats
HTTP 200
[Asserts]
jsonpath "$.cpu_pct"   isInteger
jsonpath "$.cpu_pct"   >= 0
jsonpath "$.cpu_pct"   <= 100
jsonpath "$.mem_pct"   isInteger
jsonpath "$.mem_pct"   >= 0
jsonpath "$.mem_pct"   <= 100
jsonpath "$.mem_total" isInteger
jsonpath "$.mem_total" > 0
jsonpath "$.mem_avail" isInteger
jsonpath "$.mem_avail" >= 0
jsonpath "$.rx_bytes"  isInteger
jsonpath "$.tx_bytes"  isInteger
jsonpath "$.uptime"    isInteger
jsonpath "$.uptime"    >= 0
jsonpath "$.conntrack" isInteger
jsonpath "$.conntrack" >= 0


# Version
GET http://{{host}}/api/system/version
HTTP 200
[Asserts]
jsonpath "$.version"  isString
jsonpath "$.macaddr"  isString
jsonpath "$.hostname" isString


# Sysinfo (legacy)
GET http://{{host}}/api/sysinfo
HTTP 200
[Asserts]
jsonpath "$.hostname" exists
jsonpath "$.uptime"   exists


# Language GET
GET http://{{host}}/api/system/language
HTTP 200
[Asserts]
jsonpath "$.language" exists
jsonpath "$.changed"  exists
[Captures]
current_lang: jsonpath "$.language"


# Language POST — write same value back (noop)
POST http://{{host}}/api/system/language
Content-Type: application/json
{ "language": "{{current_lang}}" }

HTTP 200
[Asserts]
jsonpath "$.result" == "ok"


# Language POST — invalid code → 400
POST http://{{host}}/api/system/language
Content-Type: application/json
{ "language": "xx" }

HTTP 400


# Port status
GET http://{{host}}/api/system/ports
HTTP 200
[Asserts]
jsonpath "$.errCode"   == 0
jsonpath "$.port_list" isCollection
jsonpath "$.port_list[0].up"         isInteger
jsonpath "$.port_list[0].wan_enable" isInteger
