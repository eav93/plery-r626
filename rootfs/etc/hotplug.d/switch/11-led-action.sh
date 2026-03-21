[ "$STATUS" = "UP" -o "$STATUS" = "DOWN" ] && {
    [ -x /usr/bin/hotplugportled ] && /usr/bin/hotplugportled trigger
}
