# UCI get / set  (login at the top of the file)

POST http://{{host}}/api/auth/login
Content-Type: application/json
{ "password": "{{password}}" }

HTTP 200


# Single option — returns flat object with full path as key
GET http://{{host}}/api/uci?get=system.language.language
HTTP 200
[Asserts]
jsonpath "$['system.language.language']" exists


# Section-level read — all options included
GET http://{{host}}/api/uci?get=network.lan
HTTP 200
[Asserts]
jsonpath "$['network.lan.ipaddr']" exists
jsonpath "$['network.lan.netmask']" exists


GET http://{{host}}/api/uci?get=network.wan
HTTP 200
[Asserts]
jsonpath "$['network.wan.proto']" exists


# Multi-key (comma-separated, URL-encoded)
GET http://{{host}}/api/uci?get=system.%40system%5B0%5D.hostname%2Cnetwork.lan.ipaddr
HTTP 200
[Asserts]
jsonpath "$['system.@system[0].hostname']" exists
jsonpath "$['network.lan.ipaddr']" exists


# Capture hostname and lan IP, then write them back unchanged (noop set)
GET http://{{host}}/api/uci?get=system.%40system%5B0%5D.hostname%2Cnetwork.lan.ipaddr
HTTP 200
[Captures]
hostname: jsonpath "$['system.@system[0].hostname']"
lan_ip:   jsonpath "$['network.lan.ipaddr']"

POST http://{{host}}/api/uci/set
Content-Type: application/json
{
  "system.@system[0].hostname": "{{hostname}}",
  "network.lan.ipaddr": "{{lan_ip}}"
}

HTTP 200
[Asserts]
jsonpath "$.result" == "ok"


# Invalid key (path traversal) → 400
GET http://{{host}}/api/uci?get=../../etc/passwd
HTTP 400


POST http://{{host}}/api/uci/set
Content-Type: application/json
{ "../bad": "x" }

HTTP 400
