#!/bin/sh
append DRIVERS "mt7663e"

# . /lib/wifi/ralink_common.sh

scan_mt7663e() {
	scan_ralink_wifi mt7663e mt7663e
}

enable_mt7663e() {
	scan_mt7663e
	enable_ralink_wifi mt7663e mt7663e
	bridge_state=`cat /tmp/status/workmode`
	apcli_enable=`cat /etc/apclix_enable 2>/dev/null`
	bridge_mode=`echo $bridge_state | grep "wds"`

	# wifi scan
	[ -f /tmp/sysinfo/apcli_up ] && ifconfig apclii0 up

	if [[ "$bridge_mode" != "" && "$apcli_enable" == "5" ]];then
	    brctl addif br-lan apclii0
	fi
}

disable_mt7663e() {
	ifconfig apclii0 down > /dev/null 2>&1
	disable_ralink_wifi mt7663e
}

reload_mt7663e() {
	disable_mt7663e
	sleep 1
	enable_mt7663e
}

#The aregion of the US country is 7
#The aregion of the CN country is 0
detect_mt7663e() {
	#dat2uci -l /etc/wireless/l1profile.dat -u /etc/config/wireless -d MT7663
	ssid5g=PLERY-`ifconfig eth0 | grep HWaddr | cut -c 51- | sed 's/://g'`
	ssid5g_set=`echo $ssid5g | sed 's/[[:space:]]//g'`
	ssid_type=`cat /tmp/sysinfo/ssid_type`
	txpower_5g=$(cat /tmp/sysinfo/txpower_5g)
	[ -e /etc/config/wireless ] && return
	[ ! -f /sys/module/mt7663e ] && insmod mt7663e
	if [ "$ssid_type" == "1" ]; then  # 1 is single
	cat <<EOF
config wifi-device	mt7663e
	option type     mt7663e
	option vendor   ralink
	option band     5G
	option channel  0
	option autoch   2
	option bw       2
	option country  UK
	option aregion  0
	option hwmode   ac
	option htmode   VHT80
	option txpower  100
	option noforward  '0;0;0;0'
	option autoch_skip 52;56;60;64
	option rtsthres 2347
	option fragthres 2346

config wifi-iface
	option device   mt7663e
	option ifname   rai0
	option mode	ap
	option network  lan
	option ssid     $ssid5g_set
	option encryption none
	option key      ""
	option hidden   0
	option wmm      1
	option wds      1
	option disabled 0
	option isolate 	0
	option wps_pushbutton 1
	option AccessPolicy0 0

EOF
	elif [ "$ssid_type" == "3" ]; then  # 3 is multi wifi ap(admin wifi)
	cat <<EOF
config wifi-device  mt7663e
	option type     mt7663e
	option vendor   ralink
	option band     5G
	option channel  0
	option autoch   2
	option bw   	2
	option country  UK
	option aregion  13
	option hwmode   ac
	option htmode   VHT80
	option txpower  ${txpower_5g}
	option noforward  '0;0;0;0;0;0;0;0'
	option autoch_skip 52;56;60;64
	option rtsthres 2347
	option fragthres 2346
	option ht_gi 1
	option rekeymethod 'TIME;TIME;TIME;TIME;TIME;TIME;TIME;TIME'

config wifi-iface
	option device   mt7663e
	option device_def   mt7663e
	option ifname   rai0
	option mode ap
	option network  lan
	option ssid     ${ssid5g_set}
	option encryption 'psk2+ccmp'
	option key      "12345678"
	option hidden   0
	option wmm      1
	option wds      1
	option disabled 0
	option isolate 0
	option wps_pushbutton 1
	option AccessPolicy0 0
	option maxassoc 256

config wifi-iface
	option device_def   mt7663e
	option ifname   rai1
	option network  lan
	option mode     ap
	option disabled 1
	option ieee80211r 0
	option mobility_domain 4096
	option encryption none
	option key      ""

config wifi-iface
	option device_def   mt7663e
	option ifname   rai2
	option network  lan
	option mode     ap
	option disabled 1
	option ieee80211r 0
	option mobility_domain 4096
	option encryption none
	option key      ""

config wifi-iface
	option device_def   mt7663e
	option ifname   rai3
	option network  lan
	option mode     ap
	option disabled 1
	option ieee80211r 0
	option mobility_domain 4096
	option encryption none
	option key      ""

config wifi-iface
	option device_def   mt7663e
	option ifname   rai4
	option network  lan
	option mode     ap
	option disabled 1
	option ieee80211r 0
	option mobility_domain 4096
	option encryption none
	option key      ""

config wifi-iface
	option device_def   mt7663e
	option ifname   rai5
	option network  lan
	option mode     ap
	option disabled 1
	option ieee80211r 0
	option mobility_domain 4096
	option encryption none
	option key      ""

config wifi-iface
	option device_def   mt7663e
	option ifname   rai6
	option network  lan
	option mode     ap
	option disabled 1
	option ieee80211r 0
	option mobility_domain 4096
	option encryption none
	option key      ""

config wifi-iface
	option device mt7663e
	option device_def   mt7663e
	option ifname rai7
	option network 'lan'
	option mode 'ap'
	option isolate '1'
	option ssid PLERY-ADMIN-5G
	option maxassoc '3'
	option encryption 'psk2'
	option key      '12345678'
	option hidden '1'
	option disabled 1
EOF
	fi
}

status_mt7663e() {
    iwconfig rai0
}
