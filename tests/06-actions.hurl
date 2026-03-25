# Action endpoints: apply, reboot (reboot is destructive — kept last)

POST http://{{host}}/api/auth/login
Content-Type: application/json
{ "password": "{{password}}" }

HTTP 200


# Apply network — safe, just reloads config
POST http://{{host}}/api/action/apply
Content-Type: application/json
{ "service": "network" }

HTTP 200
[Asserts]
jsonpath "$.result" == "ok"


# Apply with invalid service name → 400
POST http://{{host}}/api/action/apply
Content-Type: application/json
{ "service": "../../etc/evil" }

HTTP 400
[Asserts]
jsonpath "$.errCode" exists


# Apply with empty service → 400
POST http://{{host}}/api/action/apply
Content-Type: application/json
{ "service": "" }

HTTP 400
