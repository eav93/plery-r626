#!/bin/bash
#
# Plery R626 (COMFAST cf-plery) firmware builder
# Chip: MT7628 (ramips), OS: LEDE 17.01, Kernel: Linux 4.4.194
#
# Usage:
#   ./build.sh [output_name.bin]
#   KEEP_LANGS=en,ru ./build.sh [output_name.bin]
#
# Structure:
#   kernel.bin          — original uImage kernel (LZMA, MIPS32)
#   rootfs/             — root filesystem (edit files here)
#   metadata.json       — device metadata for fwtool
#   fwtool              — compiled OpenWrt fwtool (appends metadata + CRC)
#
# Output firmware layout:
#   [kernel.bin][SquashFS][fwimage_header + metadata.json + FWx trailer]
#   rootfs_data is placed dynamically by mtdsplit right after squashfs end (no fixed boundary)
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

DIST_DIR="dist"
mkdir -p "$DIST_DIR"
OUTPUT="$DIST_DIR/${1:-Plery-R626-custom.bin}"
KERNEL="kernel.bin"
ROOTFS_SRC="rootfs"
ROOTFS_DIR=""
BUILD_ROOT=""
LANG_JS=""
METADATA="metadata.json"
FWTOOL_DIR="fwtool"
FWTOOL="$FWTOOL_DIR/fwtool"
FWTOOL_REPO="https://git.openwrt.org/project/fwtool.git"
FWTOOL_COMMIT="04cd252e4e9394ffacd51f56f1f124abc534f715"
KEEP_LANGS="${KEEP_LANGS:-en,ru}"

# ---- Colors ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[-]${NC} $1"; exit 1; }

normalize_langs() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]'
}

prune_locale_file() {
    local file="$1"
    local lang

    [ -f "$file" ] || return 0

    # Remove whole locale blocks like:
    #   'cn': { ... },
    # for languages not present in KEEP_LANGS_SET.
    for lang in cn en ru; do
        if [[ "$KEEP_LANGS_SET" != *",$lang,"* ]]; then
            # Drop locale lines like: 'cn': '...'
            perl -i -ne "next if /^\\s*'$lang'\\s*:\\s*'[^']*'\\s*,?\\s*$/; print;" "$file"
            # Drop locale object blocks like: 'cn': { ... },
            perl -0777 -i -pe "s/\\n\\s*'$lang'\\s*:\\s*\\{[^{}]*\\}\\s*,?//gs" "$file"
        fi
    done

    # Remove trailing commas before closing braces after language pruning.
    perl -0777 -i -pe 's/,\n(\s*})/\n$1/g' "$file"
}


# ---- Check dependencies ----
log "Checking dependencies..."

command -v mksquashfs >/dev/null 2>&1 || err "mksquashfs not found. Install: brew install squashfs / apt install squashfs-tools"

if [ ! -x "$FWTOOL" ]; then
    log "Fetching fwtool from $FWTOOL_REPO..."
    git clone -q "$FWTOOL_REPO" "$FWTOOL_DIR" 2>/dev/null || true
    cd "$FWTOOL_DIR"
    git checkout -q "$FWTOOL_COMMIT"
    cc -o fwtool fwtool.c -Wall -O2 || err "Failed to compile fwtool"
    cd "$SCRIPT_DIR"
fi

[ -f "$KERNEL" ]   || err "kernel.bin not found"
[ -d "$ROOTFS_SRC" ] || err "rootfs/ directory not found"
[ -f "$METADATA" ] || err "metadata.json not found"

KEEP_LANGS="$(normalize_langs "$KEEP_LANGS")"
[[ "$KEEP_LANGS" =~ ^[a-z]{2}(,[a-z]{2})*$ ]] || err "Invalid KEEP_LANGS='$KEEP_LANGS' (expected like: en,ru or cn,en,ru)"
KEEP_LANGS_SET=",$KEEP_LANGS,"
log "Keeping UI languages: $KEEP_LANGS"

# ---- Build workspace (isolated rootfs copy) ----
BUILD_ROOT="$(mktemp -d /tmp/rootfs_build_XXXXXX)"
cp -a "$ROOTFS_SRC/." "$BUILD_ROOT/"
ROOTFS_DIR="$BUILD_ROOT"
LANG_JS="$ROOTFS_DIR/www-comfast/js/language.js"
log "Using temporary rootfs workspace: $ROOTFS_DIR"

# ---- Write firmware version ----
VERSION_FILE="$ROOTFS_DIR/etc/defconfig/cf-plery/version"
BASE_VERSION="CF-PLERY-R626-eav93"

if [ -z "${FIRMWARE_VERSION:-}" ]; then
    BUILD_DATE=$(date '+%Y%m%d-%H%M')
    FIRMWARE_VERSION="${BASE_VERSION}-${BUILD_DATE}"
fi

echo -n "$FIRMWARE_VERSION" > "$VERSION_FILE"
log "Firmware version: $FIRMWARE_VERSION"

# ---- Ensure required directories exist (git doesn't track empty dirs) ----
for dir in dev etc/crontabs etc/easy-rsa/pki/private etc/easy-rsa/pki/reqs \
           etc/hotplug.d/ntp etc/openvpn/ccd etc/ssl/certs etc/ssl/private \
           lib/firmware mnt overlay proc root sys tmp usr/lib/opkg/lists \
           www www-comfast/upload; do
    mkdir -p "$ROOTFS_DIR/$dir"
done
chmod 1777 "$ROOTFS_DIR/tmp"

# ---- Remove build artifacts from rootfs ----
find "$ROOTFS_DIR" -name ".DS_Store" -delete 2>/dev/null
find "$ROOTFS_DIR" -name ".gitkeep" -delete 2>/dev/null

SQUASHFS_TMP=$(mktemp /tmp/rootfs_XXXXXX.squashfs)
trap "rm -f '$SQUASHFS_TMP' /tmp/firmware_raw_$$.bin; [ -n '$BUILD_ROOT' ] && rm -rf '$BUILD_ROOT'" EXIT

# ---- Optional language pruning ----
log "Pruning UI locales..."
prune_locale_file "$LANG_JS"


# ---- Build SquashFS ----
log "Building SquashFS from $ROOTFS_DIR/..."

# Check if mksquashfs supports MIPS BCJ filter
XZ_BCJ_OPT=""
if mksquashfs -help-comp xz 2>&1 | grep -q mips; then
    XZ_BCJ_OPT="-Xbcj mips"
    log "Using MIPS BCJ filter"
fi

mksquashfs "$ROOTFS_DIR" "$SQUASHFS_TMP" \
    -comp xz \
    $XZ_BCJ_OPT \
    -Xdict-size 100% \
    -b 262144 \
    -nopad \
    -noappend \
    -no-xattrs \
    -all-root \
    -quiet

KERNEL_SIZE=$(stat -f%z "$KERNEL" 2>/dev/null || stat -c%s "$KERNEL")
SQUASHFS_SIZE=$(stat -f%z "$SQUASHFS_TMP" 2>/dev/null || stat -c%s "$SQUASHFS_TMP")
BODY_SIZE=$((KERNEL_SIZE + SQUASHFS_SIZE))

log "Kernel:   $KERNEL_SIZE bytes"
log "SquashFS: $SQUASHFS_SIZE bytes"

# ---- Size check ----
# firmware partition = 0xFB0000 (~15.7 MB), leave at least 1 MB for rootfs_data overlay
FIRMWARE_PARTITION=$((0xFB0000))
MIN_OVERLAY=$((0x100000))
MAX_IMAGE=$((FIRMWARE_PARTITION - MIN_OVERLAY))

if [ "$BODY_SIZE" -gt "$MAX_IMAGE" ]; then
    err "Firmware too large! kernel+squashfs ($BODY_SIZE) > max allowed ($MAX_IMAGE)"
fi

log "Size OK:  $BODY_SIZE / $MAX_IMAGE bytes ($(( BODY_SIZE * 100 / MAX_IMAGE ))% used)"

# ---- Assemble raw firmware ----
# No 0xFF padding — rootfs_data is placed dynamically by mtdsplit right after squashfs.
# Adding padding would overwrite existing jffs2 overlay on sysupgrade.
RAW_FW="/tmp/firmware_raw_$$.bin"

cat "$KERNEL" "$SQUASHFS_TMP" > "$RAW_FW"

# ---- Append metadata with fwtool ----
log "Appending metadata with fwtool (CRC32 calculated automatically)..."

"$FWTOOL" -I "$METADATA" "$RAW_FW" || err "fwtool failed to append metadata"

# ---- Verify ----
log "Verifying metadata..."

VERIFY=$("$FWTOOL" -i /dev/stdout "$RAW_FW" 2>&1) || err "fwtool verification failed!"
echo "    $VERIFY"

# ---- Output ----
mv "$RAW_FW" "$OUTPUT"
FINAL_SIZE=$(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT")

echo ""
log "Firmware built successfully!"
echo "    File:    $OUTPUT"
echo "    Size:    $FINAL_SIZE bytes ($(echo "scale=1; $FINAL_SIZE / 1048576" | bc) MB)"
echo "    Version: $FIRMWARE_VERSION"
echo ""
echo "    Flash via web:  http://192.168.0.1/computer/upgrade.html"
echo "    Flash via SSH:  scp -O $OUTPUT root@192.168.0.1:/tmp/fw.bin && ssh root@192.168.0.1 'sysupgrade /tmp/fw.bin'"
