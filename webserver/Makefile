SDK_DIR   ?= /root/xl2tpd-build/lede-sdk-17.01.7-ramips-mt7628_gcc-5.4.0_musl-1.1.16.Linux-x86_64
TOOLCHAIN ?= $(SDK_DIR)/staging_dir/toolchain-mipsel_24kc_gcc-5.4.0_musl-1.1.16
CC_CROSS   = $(TOOLCHAIN)/bin/mipsel-openwrt-linux-musl-gcc
AR_CROSS   = $(TOOLCHAIN)/bin/mipsel-openwrt-linux-musl-ar

# libuci source dir — cloned from openwrt/uci lede-17.01 by CI (or locally)
LIBUCI_DIR ?= ../libuci
LIBUCI_A    = $(LIBUCI_DIR)/libuci.a

TARGET = wbsrv
SRCS   = src/main.c src/http.c src/fcgi.c src/static.c src/handlers.c
CFLAGS = -Os -Wall -Wextra -std=c99 -D_GNU_SOURCE -I$(LIBUCI_DIR)

.PHONY: all cross clean

all:
	$(CC) $(CFLAGS) -o $(TARGET) $(SRCS) -luci

# Cross-compile static libuci.a from cloned source
$(LIBUCI_A):
	$(CC_CROSS) -Os -std=c99 -D_GNU_SOURCE -I$(LIBUCI_DIR) \
		-c $(LIBUCI_DIR)/uci.c   -o $(LIBUCI_DIR)/uci.o
	$(CC_CROSS) -Os -std=c99 -D_GNU_SOURCE -I$(LIBUCI_DIR) \
		-c $(LIBUCI_DIR)/file.c  -o $(LIBUCI_DIR)/file.o
	$(CC_CROSS) -Os -std=c99 -D_GNU_SOURCE -I$(LIBUCI_DIR) \
		-c $(LIBUCI_DIR)/util.c  -o $(LIBUCI_DIR)/util.o
	$(CC_CROSS) -Os -std=c99 -D_GNU_SOURCE -I$(LIBUCI_DIR) \
		-c $(LIBUCI_DIR)/delta.c -o $(LIBUCI_DIR)/delta.o
	$(AR_CROSS) rcs $(LIBUCI_A) \
		$(LIBUCI_DIR)/uci.o $(LIBUCI_DIR)/file.o \
		$(LIBUCI_DIR)/util.o $(LIBUCI_DIR)/delta.o

cross: $(LIBUCI_A)
	$(CC_CROSS) $(CFLAGS) -s -o $(TARGET) $(SRCS) $(LIBUCI_A)

clean:
	rm -f $(TARGET)
	rm -f $(LIBUCI_DIR)/*.o $(LIBUCI_A)
