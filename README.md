# Plery R626 Custom Firmware

Кастомная прошивка для роутера Plery R626 (COMFAST cf-plery, MT7628) с небольшими улучшениями.

## Изменения

- Русский язык интерфейса (по умолчанию)
- Исправлены ошибки в английском переводе
- Исправлена опечатка Wireguade → WireGuard
- Убраны проверки при обновлении прошивки
- Исправлен шрифт в подменю 3-го уровня

## Сборка

```bash
./build.sh firmware.bin
```

Требуется: `mksquashfs` (`brew install squashfs` / `apt install squashfs-tools`)

## Прошивка

- Веб: http://192.168.0.1/computer/upgrade.html
- SSH: `scp -O dist/firmware.bin root@192.168.0.1:/tmp/fw.bin && ssh root@192.168.0.1 'sysupgrade -n /tmp/fw.bin'`
