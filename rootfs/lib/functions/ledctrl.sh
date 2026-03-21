#!/bin/sh
. /lib/functions.sh

export SYSTEM_LED_LIST=""

_load_led() {
    local sysfs

    config_get sysfs $1 sysfs
    [ -e /sys/class/leds/${sysfs}/brightness ] || return 0
    SYSTEM_LED_LIST="${SYSTEM_LED_LIST} ${sysfs}"
}

led_ctrl_init() {
    local section_type=led
    [ -n "$1" ] && section_type=$1
    config_load system
    config_foreach _load_led $section_type
}

led_ctrl_all()
{
    local bright=$1
    local led_brightness=""
    [ "$SYSTEM_LED_LIST" == "" ] && return
    for led in $SYSTEM_LED_LIST
    do
        led_brightness=/sys/class/leds/${led}/brightness
        echo $bright >$led_brightness
    done
}
