#ifndef __LIBUBOX_UTILS_H
#define __LIBUBOX_UTILS_H

#include <sys/types.h>
#include <stdint.h>
#include <stdbool.h>

#ifdef __APPLE__
#include <machine/endian.h>
#include <machine/byte_order.h>
#define bswap_32(x) OSSwapInt32(x)
#define bswap_64(x) OSSwapInt64(x)
#elif defined(__linux__) || defined(__CYGWIN__)
#include <byteswap.h>
#include <endian.h>
#elif defined(__FreeBSD__)
#include <sys/endian.h>
#define bswap_32(x) bswap32(x)
#define bswap_64(x) bswap64(x)
#else
#include <machine/endian.h>
#define bswap_32(x) swap32(x)
#define bswap_64(x) swap64(x)
#endif

#ifndef __BYTE_ORDER
#define __BYTE_ORDER BYTE_ORDER
#endif
#ifndef __BIG_ENDIAN
#define __BIG_ENDIAN BIG_ENDIAN
#endif
#ifndef __LITTLE_ENDIAN
#define __LITTLE_ENDIAN LITTLE_ENDIAN
#endif

static inline uint16_t __u_bswap16(uint16_t val)
{
	return ((val >> 8) & 0xffu) | ((val & 0xffu) << 8);
}

#define __u_bswap32(x) __builtin_bswap32(x)
#define __u_bswap64(x) __builtin_bswap64(x)

#if __BYTE_ORDER == __LITTLE_ENDIAN

#define cpu_to_be64(x) __u_bswap64(x)
#define cpu_to_be32(x) __u_bswap32(x)
#define cpu_to_be16(x) __u_bswap16((uint16_t) (x))

#define be64_to_cpu(x) __u_bswap64(x)
#define be32_to_cpu(x) __u_bswap32(x)
#define be16_to_cpu(x) __u_bswap16((uint16_t) (x))

#else

#define cpu_to_be64(x) (x)
#define cpu_to_be32(x) (x)
#define cpu_to_be16(x) (x)

#define be64_to_cpu(x) (x)
#define be32_to_cpu(x) (x)
#define be16_to_cpu(x) (x)

#endif

#endif
