#!/bin/sh

. /lib/functions/system.sh

lan_mac=$(cat /tmp/sysinfo/mac)
[ -z "$lan_mac" ] && return

wifi0_mac=$(macaddr_add "$lan_mac" 2)
wifi1_mac=$(macaddr_add "$lan_mac" 3)
wifi0_ssid=WIFISKY_$(echo "${wifi0_mac}" | awk -F ":" '{print $5""$6 }' | tr a-z A-Z)_2G
wifi1_ssid=WIFISKY_$(echo "${wifi1_mac}" | awk -F ":" '{print $5""$6 }' | tr a-z A-Z)_5G

uci -q batch <<-EOF
	set system.@system[0].hostname='WIFISKY'

	set dhcp.@dnsmasq[0].domain='WIFISKY'

	set wireless.@wifi-iface[0].ssid="${wifi0_ssid}"
	set wireless.@wifi-iface[7].ssid='WIFISKY_ADMIN_2G'

	set wireless.@wifi-iface[8].ssid='${wifi1_ssid}'
	set wireless.@wifi-iface[15].ssid='WIFISKY_ADMIN_5G'
EOF
