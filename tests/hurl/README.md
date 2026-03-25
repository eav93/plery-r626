# wbsrv API tests

HTTP tests for wbsrv endpoints using [Hurl](https://hurl.dev).

## Install

```sh
# macOS
brew install hurl

# Linux
curl -LO https://github.com/Orange-OpenSource/hurl/releases/latest/download/hurl-x86_64-unknown-linux-gnu.tar.gz
tar xzf hurl-*.tar.gz && sudo mv hurl /usr/local/bin/
```

## Run

```sh
# Against the router (default 192.168.0.1 / password admin)
hurl --variables-file tests/hurl/hurl.env --test tests/hurl/*.hurl

# Override host / password
hurl --variable host=192.168.1.1 --variable password=mypassword \
     --test tests/hurl/*.hurl

# Single file
hurl --variables-file tests/hurl/hurl.env --test tests/hurl/04-system.hurl

# Verbose output (shows request/response details)
hurl --variables-file tests/hurl/hurl.env --test --very-verbose tests/hurl/*.hurl
```

## Files

| File | What it tests |
|------|---------------|
| `01-public.hurl` | `/api/ping`, 401 enforcement without cookie |
| `02-auth.hurl` | Login / check / logout lifecycle |
| `03-uci.hurl` | UCI get, multi-key, section read, set, validation |
| `04-system.hurl` | stats, version, sysinfo, language, ports |
| `05-network.hurl` | DHCP leases, ARP table |
| `06-actions.hurl` | `/api/action/apply` including invalid service rejection |

## Notes

- `01-public.hurl` runs **without** a session cookie by design — it must be
  the first file so the cookie jar is empty.
- Files `03–06` each log in at the top; cookies are scoped per-file.
- The `06-actions.hurl` applies the network config — it reloads `netifd` on
  the router (~1 s delay). **Do not add a reboot test here** unless you intend
  to actually reboot the device.
