#!/bin/sh
# API tests for wbsrv endpoints
# Usage: HOST=192.168.0.1 PASSWORD=admin ./tests/api_test.sh
#
# Requires: curl, jq

HOST="${HOST:-192.168.0.1}"
PASSWORD="${PASSWORD:-admin}"
COOKIE_JAR="/tmp/wbsrv_test_cookies_$$.txt"

PASS=0
FAIL=0

pass() { echo "  PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "  FAIL: $1 — $2"; FAIL=$((FAIL+1)); }

# Run curl, store HTTP status in $STATUS, body in $BODY
get() {
    BODY=$(curl -s -o /tmp/wbsrv_body_$$.txt -w "%{http_code}" \
        -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
        "http://$HOST$1")
    STATUS=$BODY
    BODY=$(cat /tmp/wbsrv_body_$$.txt)
}

post() {
    BODY=$(curl -s -o /tmp/wbsrv_body_$$.txt -w "%{http_code}" \
        -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
        -X POST -H "Content-Type: application/json" \
        -d "$2" \
        "http://$HOST$1")
    STATUS=$BODY
    BODY=$(cat /tmp/wbsrv_body_$$.txt)
}

assert_status() {
    if [ "$STATUS" = "$1" ]; then
        pass "$2 (HTTP $1)"
    else
        fail "$2" "expected HTTP $1, got $STATUS. Body: $BODY"
    fi
}

assert_key() {
    local val
    val=$(echo "$BODY" | jq -r "$1" 2>/dev/null)
    if [ "$val" != "null" ] && [ -n "$val" ]; then
        pass "$2 (key $1 = $val)"
    else
        fail "$2" "key $1 missing or null in: $BODY"
    fi
}

assert_key_eq() {
    local val
    val=$(echo "$BODY" | jq -r "$1" 2>/dev/null)
    if [ "$val" = "$2" ]; then
        pass "$3"
    else
        fail "$3" "expected $1=$2, got $val"
    fi
}

cleanup() {
    rm -f "$COOKIE_JAR" /tmp/wbsrv_body_$$.txt
}
trap cleanup EXIT

# ---- Login ---------------------------------------------------------------
echo ""
echo "=== Auth ==="

post "/cgi-bin/login" "{\"username\":\"admin\",\"password\":\"$PASSWORD\"}"
if echo "$BODY" | jq -e '.errCode == 0' > /dev/null 2>&1; then
    pass "Login successful"
else
    fail "Login" "errCode != 0: $BODY"
    echo "WARN: Remaining tests may fail due to missing auth"
fi

# ---- No-auth endpoints ---------------------------------------------------
echo ""
echo "=== No-auth endpoints ==="

get "/api/ping"
assert_status "200" "GET /api/ping status"
assert_key_eq ".status" "ok" "GET /api/ping body"

# ---- Auth check ----------------------------------------------------------
echo ""
echo "=== Auth enforcement ==="

# Test without cookie
BODY=$(curl -s -o /tmp/wbsrv_body_$$.txt -w "%{http_code}" \
    "http://$HOST/api/sysinfo")
STATUS=$BODY; BODY=$(cat /tmp/wbsrv_body_$$.txt)
assert_status "401" "GET /api/sysinfo without cookie → 401"

# ---- Sysinfo -------------------------------------------------------------
echo ""
echo "=== GET /api/sysinfo ==="

get "/api/sysinfo"
assert_status "200" "GET /api/sysinfo status"
assert_key ".hostname" "GET /api/sysinfo has hostname"
assert_key ".uptime"   "GET /api/sysinfo has uptime"

# ---- UCI get -------------------------------------------------------------
echo ""
echo "=== GET /api/uci ==="

# Single option — full path as key
get "/api/uci?get=system.%40system%5B0%5D.hostname"
assert_status "200" "GET /api/uci?get=hostname status"
assert_key '.["system.@system[0].hostname"]' "single option returns full-path key"

get "/api/uci?get=system.language.language"
assert_status "200" "GET /api/uci?get=language status"
assert_key '.["system.language.language"]' "single option returns full-path key"

# Section-level read — all options with full paths as keys
get "/api/uci?get=network.lan"
assert_status "200" "GET /api/uci?get=network.lan (section) status"
assert_key '.["network.lan.ipaddr"]' "section response has network.lan.ipaddr key"

get "/api/uci?get=network.wan"
assert_status "200" "GET /api/uci?get=network.wan (section) status"
assert_key '.["network.wan.proto"]' "section response has network.wan.proto key"

# Invalid key → 400
get "/api/uci?get=../../etc/passwd"
assert_status "400" "GET /api/uci invalid key → 400"

# ---- UCI set (non-destructive: write same value back) --------------------
echo ""
echo "=== POST /api/uci/set ==="

# Read current hostname first
get "/api/uci?get=system.%40system%5B0%5D.hostname"
CURRENT_HOSTNAME=$(echo "$BODY" | jq -r '.value')

post "/api/uci/set" "{\"key\":\"system.@system[0].hostname\",\"value\":\"$CURRENT_HOSTNAME\"}"
assert_status "200" "POST /api/uci/set (noop write) status"
assert_key_eq ".result" "ok" "POST /api/uci/set result=ok"

# Invalid key → 400
post "/api/uci/set" "{\"key\":\"../bad\",\"value\":\"x\"}"
assert_status "400" "POST /api/uci/set invalid key → 400"

# ---- UCI batch -----------------------------------------------------------
echo ""
echo "=== POST /api/uci/batch ==="

post "/api/uci/batch" \
    '{"paths":["system.@system[0].hostname","system.language.language","network.lan.ipaddr"]}'
assert_status "200" "POST /api/uci/batch status"
assert_key ".values" "POST /api/uci/batch has values"
assert_key '.values["system.@system[0].hostname"]' "POST /api/uci/batch hostname key"

# ---- System stats --------------------------------------------------------
echo ""
echo "=== GET /api/system/stats ==="

get "/api/system/stats"
assert_status "200" "GET /api/system/stats status"
assert_key ".cpu_pct"   "GET /api/system/stats has cpu_pct"
assert_key ".mem_pct"   "GET /api/system/stats has mem_pct"
assert_key ".mem_total" "GET /api/system/stats has mem_total"
assert_key ".rx_bytes"  "GET /api/system/stats has rx_bytes"

# ---- System version ------------------------------------------------------
echo ""
echo "=== GET /api/system/version ==="

get "/api/system/version"
assert_status "200" "GET /api/system/version status"
assert_key ".version" "GET /api/system/version has version"
assert_key ".macaddr" "GET /api/system/version has macaddr"

# ---- System language -----------------------------------------------------
echo ""
echo "=== GET /api/system/language ==="

get "/api/system/language"
assert_status "200" "GET /api/system/language status"
assert_key ".language" "GET /api/system/language has language"
assert_key ".changed"  "GET /api/system/language has changed"

# Write same language back (noop)
CURRENT_LANG=$(echo "$BODY" | jq -r '.language')
post "/api/system/language" "{\"language\":\"$CURRENT_LANG\"}"
assert_status "200" "POST /api/system/language (noop) status"
assert_key_eq ".result" "ok" "POST /api/system/language result=ok"

# Invalid language → 400
post "/api/system/language" '{"language":"xx"}'
assert_status "400" "POST /api/system/language invalid → 400"

# ---- DHCP leases ---------------------------------------------------------
echo ""
echo "=== GET /api/dhcp/leases ==="

get "/api/dhcp/leases"
assert_status "200" "GET /api/dhcp/leases status"
assert_key ".leases" "GET /api/dhcp/leases has leases array"

# ---- ARP -----------------------------------------------------------------
echo ""
echo "=== GET /api/arp ==="

get "/api/arp"
assert_status "200" "GET /api/arp status"
assert_key ".entries" "GET /api/arp has entries array"

# ---- Action: apply (safe, network reload) --------------------------------
echo ""
echo "=== POST /api/action/apply ==="

post "/api/action/apply" '{"service":"network"}'
assert_status "200" "POST /api/action/apply network status"
assert_key_eq ".result" "ok" "POST /api/action/apply result=ok"

# Invalid service → 400
post "/api/action/apply" '{"service":"../../etc/evil"}'
assert_status "400" "POST /api/action/apply invalid service → 400"

# ---- Summary -------------------------------------------------------------
echo ""
echo "=============================="
echo "Results: $PASS passed, $FAIL failed"
echo "=============================="

[ "$FAIL" -eq 0 ]
