# Network info: DHCP leases, ARP table

POST http://{{host}}/api/auth/login
Content-Type: application/json
{ "password": "{{password}}" }

HTTP 200


GET http://{{host}}/api/dhcp/leases
HTTP 200
[Asserts]
jsonpath "$.leases" isCollection


GET http://{{host}}/api/arp
HTTP 200
[Asserts]
jsonpath "$.entries" isCollection
