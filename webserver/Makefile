SDK_DIR  ?= /root/xl2tpd-build/lede-sdk-17.01.7-ramips-mt7628_gcc-5.4.0_musl-1.1.16.Linux-x86_64
TOOLCHAIN ?= $(SDK_DIR)/staging_dir/toolchain-mipsel_24kc_gcc-5.4.0_musl-1.1.16
CC_CROSS   = $(TOOLCHAIN)/bin/mipsel-openwrt-linux-musl-gcc

TARGET = wbsrv
SRCS   = src/main.c src/http.c src/fcgi.c src/static.c src/handlers.c
CFLAGS = -Os -Wall -Wextra -std=c99 -D_GNU_SOURCE

.PHONY: all cross clean

all:
	$(CC) $(CFLAGS) -o $(TARGET) $(SRCS)

cross:
	$(CC_CROSS) $(CFLAGS) -s -o $(TARGET) $(SRCS)

clean:
	rm -f $(TARGET)
