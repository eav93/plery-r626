#!/bin/bash
#
# Plery R626 (COMFAST cf-plery) firmware builder
# Chip: MT7628 (ramips), OS: LEDE 17.01, Kernel: Linux 4.4.194
#
# Usage: ./build.sh [output_name.bin]
#
# Structure:
#   kernel.bin          — original uImage kernel (LZMA, MIPS32)
#   rootfs/             — root filesystem (edit files here)
#   metadata.json       — device metadata for fwtool
#   fwtool              — compiled OpenWrt fwtool (appends metadata + CRC)
#
# Output firmware layout:
#   [kernel.bin][SquashFS][0xFF padding][fwimage_header + metadata.json + FWx trailer]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

DIST_DIR="dist"
mkdir -p "$DIST_DIR"
OUTPUT="$DIST_DIR/${1:-Plery-R626-custom.bin}"
KERNEL="kernel.bin"
ROOTFS_DIR="rootfs"
METADATA="metadata.json"
FWTOOL_DIR="fwtool"
FWTOOL="$FWTOOL_DIR/fwtool"
FWTOOL_REPO="https://git.openwrt.org/project/fwtool.git"
FWTOOL_COMMIT="04cd252e4e9394ffacd51f56f1f124abc534f715"
BASE_VERSION="CF-Plery-R626-eav93"
# Note: release tag format must match version file format for OTA version comparison

# ---- Colors ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[-]${NC} $1"; exit 1; }

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
[ -d "$ROOTFS_DIR" ] || err "rootfs/ directory not found"
[ -f "$METADATA" ] || err "metadata.json not found"

# ---- Write firmware version ----
VERSION_FILE="$ROOTFS_DIR/etc/defconfig/cf-plery/version"

if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
    COMMIT_SHORT=$(git rev-parse --short HEAD 2>/dev/null || echo "dev")
    FIRMWARE_VERSION="${BASE_VERSION}-${COMMIT_SHORT}"
else
    FIRMWARE_VERSION="${BASE_VERSION}-dev"
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

# ---- Remove build artifacts from rootfs (restored after build) ----
find "$ROOTFS_DIR" -name ".DS_Store" -delete 2>/dev/null
find "$ROOTFS_DIR" -name ".gitkeep" -delete 2>/dev/null
# ---- Build SquashFS ----
log "Building SquashFS from $ROOTFS_DIR/..."

SQUASHFS_TMP=$(mktemp /tmp/rootfs_XXXXXX.squashfs)
trap "rm -f '$SQUASHFS_TMP' /tmp/firmware_raw_$$.bin; cd '$SCRIPT_DIR' && find '$ROOTFS_DIR' -type d -empty -exec touch {}/.gitkeep \;" EXIT

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

# ---- Pad to flash boundary ----
FLASH_BOUNDARY=$((0x8A0000))

if [ "$BODY_SIZE" -gt "$FLASH_BOUNDARY" ]; then
    err "Firmware too large! Body ($BODY_SIZE) exceeds flash boundary ($FLASH_BOUNDARY)"
fi

PAD_SIZE=$((FLASH_BOUNDARY - BODY_SIZE))
log "Padding:  $PAD_SIZE bytes (0xFF to offset 0x$(printf '%X' $FLASH_BOUNDARY))"

# ---- Assemble raw firmware ----
RAW_FW="/tmp/firmware_raw_$$.bin"

cat "$KERNEL" "$SQUASHFS_TMP" > "$RAW_FW"
dd if=/dev/zero bs=1 count="$PAD_SIZE" 2>/dev/null | tr '\0' '\377' >> "$RAW_FW"

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
