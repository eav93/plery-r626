SDK_DIR    ?= /root/xl2tpd-build/lede-sdk-17.01.7-ramips-mt7628_gcc-5.4.0_musl-1.1.16.Linux-x86_64
TOOLCHAIN  ?= $(SDK_DIR)/staging_dir/toolchain-mipsel_24kc_gcc-5.4.0_musl-1.1.16
TARGET_DIR ?= $(SDK_DIR)/staging_dir/target-mipsel_24kc_musl-1.1.16
CC_CROSS    = $(TOOLCHAIN)/bin/mipsel-openwrt-linux-musl-gcc
AR_CROSS    = $(TOOLCHAIN)/bin/mipsel-openwrt-linux-musl-ar

# libuci source dir — cloned from openwrt/uci lede-17.01 by CI (or locally)
LIBUCI_DIR ?= ../libuci
LIBUCI_A    = $(LIBUCI_DIR)/libuci.a

TARGET = wbsrv
SRCS   = src/main.c src/http.c src/fcgi.c src/static.c src/handlers.c
CFLAGS = -Os -Wall -Wextra -std=c99 -D_GNU_SOURCE -I$(LIBUCI_DIR)

.PHONY: all cross clean

all:
	$(CC) $(CFLAGS) -o $(TARGET) $(SRCS) -luci -lssl -lcrypto

# Cross-compile static libuci.a from cloned source (lede-17.01: libuci.c not uci.c)
LIBUCI_SRCS = libuci.c file.c util.c delta.c
LIBUCI_OBJS = $(patsubst %.c,$(LIBUCI_DIR)/%.o,$(LIBUCI_SRCS))

$(LIBUCI_DIR)/%.o: $(LIBUCI_DIR)/%.c
	$(CC_CROSS) -Os -std=c99 -D_GNU_SOURCE -I$(LIBUCI_DIR) -c $< -o $@

$(LIBUCI_A): $(LIBUCI_OBJS)
	$(AR_CROSS) rcs $@ $^

cross: $(LIBUCI_A)
	$(CC_CROSS) $(CFLAGS) \
	    -I./include \
	    -s -o $(TARGET) $(SRCS) $(LIBUCI_A) \
	    -L../rootfs/usr/lib -l:libssl.so.1.0.0 -l:libcrypto.so.1.0.0

clean:
	rm -f $(TARGET)
	rm -f $(LIBUCI_DIR)/*.o $(LIBUCI_A)
