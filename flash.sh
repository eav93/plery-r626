#!/bin/bash
#
# flash.sh — download latest Plery R626 firmware and flash via SSH
#
# Usage:
#   ./flash.sh [router_ip]
#
# Requirements: curl, ssh, scp
#

set -euo pipefail

ROUTER="${1:-192.168.0.1}"
REPO="eav93/plery-r626"
TMP_DIR="$(mktemp -d)"
FW="$TMP_DIR/firmware.bin"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[-]${NC} $1"; exit 1; }

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

# ── 1. Get latest release info ────────────────────────────────────────────────
log "Fetching latest release info from GitHub..."

RELEASE_JSON="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest")"
TAG="$(echo "$RELEASE_JSON" | grep '"tag_name"' | head -1 | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/')"
DL_URL="$(echo "$RELEASE_JSON" | grep '"browser_download_url"' | head -1 | sed 's/.*"browser_download_url": *"\([^"]*\)".*/\1/')"

[ -n "$TAG" ]    || err "Could not parse tag_name from GitHub API"
[ -n "$DL_URL" ] || err "Could not parse download URL from GitHub API"

log "Latest release: $TAG"

# ── 2. Check current version on router ───────────────────────────────────────
log "Checking current version on router..."
CURRENT="$(ssh -o ConnectTimeout=5 root@"$ROUTER" \
    'cat /etc/defconfig/cf-plery/version 2>/dev/null || echo unknown')" || true

echo "    Current : ${CURRENT:-unknown}"
echo "    Latest  : $TAG"

if [ "$CURRENT" = "$TAG" ]; then
    warn "Already running latest version. Use -f to force."
    [[ "${2:-}" == "-f" ]] || exit 0
fi

# ── 3. Download firmware ──────────────────────────────────────────────────────
log "Downloading $TAG..."
curl -fL --progress-bar -o "$FW" "$DL_URL"

SIZE="$(wc -c < "$FW")"
log "Downloaded: $SIZE bytes"
[ "$SIZE" -gt 1000000 ] || err "File too small ($SIZE bytes), download may be corrupt"

# ── 4. Validate locally (if fwtool available) ─────────────────────────────────
if command -v fwtool >/dev/null 2>&1; then
    log "Validating with fwtool..."
    fwtool -i /dev/stdout "$FW" || err "fwtool validation failed"
else
    warn "fwtool not found locally, skipping local validation"
fi

# ── 5. Upload to router ───────────────────────────────────────────────────────
log "Uploading to router ($ROUTER)..."
scp -O "$FW" root@"$ROUTER":/tmp/fw.bin

# ── 6. Validate on router ─────────────────────────────────────────────────────
log "Validating on router..."
ssh root@"$ROUTER" '
    fwtool -q -i /dev/null /tmp/fw.bin      || { echo "fwtool failed"; exit 1; }
    sysupgrade -T /tmp/fw.bin               || { echo "sysupgrade -T failed"; exit 1; }
    echo "Validation OK"
'

# ── 7. Flash ──────────────────────────────────────────────────────────────────
echo ""
warn "About to flash $TAG — router will reboot in ~90 seconds."
read -rp "    Continue? [y/N] " CONFIRM
[[ "$CONFIRM" =~ ^[Yy]$ ]] || { log "Aborted."; exit 0; }

log "Flashing (keeping config)..."
ssh root@"$ROUTER" 'sysupgrade /tmp/fw.bin' || true

# ── 8. Wait for reboot ────────────────────────────────────────────────────────
echo ""
log "Waiting for router to come back online..."
for i in $(seq 1 30); do
    sleep 5
    if ssh -o ConnectTimeout=3 -o BatchMode=yes root@"$ROUTER" \
        'cat /etc/defconfig/cf-plery/version' 2>/dev/null | grep -q .; then
        NEW="$(ssh root@"$ROUTER" 'cat /etc/defconfig/cf-plery/version')"
        echo ""
        log "Router is back online. Version: $NEW"
        exit 0
    fi
    printf "\r    Attempt %d/30..." "$i"
done

echo ""
warn "Router did not respond in 150s. Check manually: ssh root@$ROUTER"
