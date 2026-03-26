# Native auth lifecycle: login / check / logout

# Wrong password → 401
POST http://{{host}}/api/auth/login
Content-Type: application/json
{ "password": "wrong_password_xyz" }

HTTP 401
[Asserts]
jsonpath "$.errCode" == -1
jsonpath "$.errKey"  == "password_error"
jsonpath "$.errMsg"  exists


# Correct password → 200, sets slt cookie
POST http://{{host}}/api/auth/login
Content-Type: application/json
{ "password": "{{password}}" }

HTTP 200
[Asserts]
jsonpath "$.errCode" == 0
cookie "slt" exists
cookie "slt[HttpOnly]" exists


# Auth check with cookie → authenticated
GET http://{{host}}/api/auth/check
HTTP 200
[Asserts]
jsonpath "$.authenticated" == true


# Logout → clears slt cookie
POST http://{{host}}/api/auth/logout
Content-Type: application/json
{}

HTTP 200
[Asserts]
jsonpath "$.errCode" == 0
cookie "slt[Max-Age]" == 0


# Auth check after logout → not authenticated
GET http://{{host}}/api/auth/check
HTTP 200
[Asserts]
jsonpath "$.authenticated" == false
