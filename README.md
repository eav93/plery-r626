# Plery R626 Custom Firmware

Кастомная прошивка для роутера Plery R626 (COMFAST cf-plery).

## Железо

- SoC: MediaTek MT7628AN (MIPS 24KEc, 580MHz)
- RAM: 64MB DDR2
- Flash: 16MB SPI-NOR (MX25L12805D)
- WiFi: 2.4GHz (встроенный) + 5GHz (PCIe)
- Порты: 2x LAN + 1x WAN + USB 2.0
- Модем: Fibocom 4G LTE (USB RNDIS)
- ОС: LEDE 17.01, ядро Linux 4.4.194

## Изменения

- Русский язык интерфейса (по умолчанию)
- Исправлены ошибки в английском и русском переводах
- Исправлена опечатка Wireguade → WireGuard (включая файлы и роутинг)
- Исправлены шрифты для кириллицы (системные шрифты вместо Microsoft YaHei)
- Стили для подменю 2-го и 3-го уровня
- Автообновление через GitHub Releases (страница в меню Система)
- Убраны проверки при обновлении прошивки
- Укорочены длинные переводы для корректного отображения в UI

## Сборка

```bash
./build.sh firmware.bin
```

Требуется: `mksquashfs` (`brew install squashfs` / `apt install squashfs-tools`)

CI автоматически собирает прошивку и создаёт релиз при пуше в main.

## Прошивка

**Через веб-интерфейс:**
http://192.168.0.1/computer/upgrade.html

**Через SSH (с сохранением настроек):**
```bash
scp -O dist/firmware.bin root@192.168.0.1:/tmp/fw.bin && ssh root@192.168.0.1 'sysupgrade /tmp/fw.bin'
```

**Через SSH (чистая установка):**
```bash
scp -O dist/firmware.bin root@192.168.0.1:/tmp/fw.bin && ssh root@192.168.0.1 'sysupgrade -n /tmp/fw.bin'
```

## Восстановление через UART

Если роутер не загружается:

1. Подключить USB-TTL (3.3V) к UART роутера, скорость **119048** baud для U-Boot
2. Поднять TFTP сервер на 192.168.1.10 с файлом `firmware.bin`
3. Подключить LAN кабель от роутера к ПК
4. В U-Boot CLI:
```
tftpboot 0x80100000 firmware.bin
erase linux
cp.linux
reset
```

U-Boot настроен: `bootfile=firmware.bin`, `bootdelay=3`, IP роутера `192.168.1.1`, TFTP сервер `192.168.1.10`.

## Структура

```
kernel.bin          — ядро Linux 4.4.194 (uImage, LZMA)
rootfs/             — корневая файловая система
metadata.json       — метаданные для fwtool
build.sh            — скрипт сборки
```
