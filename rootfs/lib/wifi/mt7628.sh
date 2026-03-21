#!/bin/sh
append DRIVERS "mt7628"

. /lib/wifi/ralink_common.sh

prepare_mt7628() {
	prepare_ralink_wifi mt7628
}

scan_mt7628() {
	scan_ralink_wifi mt7628 mt7628
}


disable_mt7628() {
	ifconfig apcli0 down > /dev/null 2>&1
	disable_ralink_wifi mt7628
}

enable_mt7628() {
	enable_ralink_wifi mt7628 mt7628
	bridge_state=`cat /tmp/status/workmode`
	apcli_enable=`cat /etc/apclix_enable 2>/dev/null`

    # wifi scan
	[ -f /tmp/sysinfo/apcli_up ] && ifconfig apcli0 up

	if [[ "$bridge_state" == "wds" && "$apcli_enable" == "2" ]];then
	    brctl addif br-lan apcli0
	fi
}

#The region of the US country is 0
#The region of the CN country is 1
detect_mt7628() {
#	detect_ralink_wifi mt7628 mt7628
	ssid2g=PLERY-`ifconfig eth0 | grep HWaddr | cut -c 51- | sed 's/://g'`
	ssid2g_set=`echo $ssid2g | sed 's/[[:space:]]//g'`
	ssid_type=`cat /tmp/sysinfo/ssid_type`
	txpower_2g=$(cat /tmp/sysinfo/txpower)
	board_name=$(cat /tmp/sysinfo/board_name)
	ssid2g_admin="PLERY-ADMIN-2G"
	ssid2g_country="UK"
	region=1

	cd /sys/module/
	[ -d $module ] || return
	[ -e /etc/config/wireless ] && return
	if [ "$ssid_type" == "1" ]; then  # 1 is single
         cat <<EOF
config wifi-device      mt7628
        option type     mt7628
        option vendor   ralink
        option band     2.4G
        option channel  0
	option auotch   2
	option bw   	0
        option hwmode   11bgn
        option country  CN
	option region   1
        option htmode   HT20
	option txpower  100
	option noforward  '0;0;0;0'
	option autoch_skip 12
	option rtsthres 2347
	option fragthres 2346

config wifi-iface
        option device   mt7628
        option ifname   ra0
        option network  lan
        option mode     ap
        option ssid     $ssid2g_set
        option encryption 'psk2+ccmp'
        option key      "12345678"
        option hidden   0
        option wmm      1
        option wds      1
        option disabled 0
	option isolate 	0
        option wps_pushbutton 1

EOF
	elif [ "$ssid_type" == "3" ]; then  # 3 is multi wifi ap(admin wifi)
         cat <<EOF
config wifi-device      mt7628
	option type     mt7628
	option vendor   ralink
	option band     2.4G
	option channel  0
	option auotch   2
	option bw   	1
	option hwmode   11bgn
	option country  ${ssid2g_country}
	option region '${region}'
	option htmode   HT40
	option txpower  ${txpower_2g}
	option noforward  '0;0;0;0;0;0;0;0'
	option autoch_skip 12
	option rtsthres 2347
	option fragthres 2346
	option ht_gi 1
	option rekeymethod 'TIME;TIME;TIME;TIME;TIME;TIME;TIME;TIME'

config wifi-iface
	option device   mt7628
	option device_def   mt7628
	option ifname   ra0
	option network  lan
	option mode     ap
	option ssid     $ssid2g_set
	option encryption 'psk2+ccmp'
	option key      "12345678"
	option hidden   0
	option wmm      1
	option wds      1
	option disabled 0
	option isolate 	0
	option wps_pushbutton 1
	option maxassoc 256

config wifi-iface
	option ifname   ra1
	option network  lan
	option mode     ap
	option ieee80211r 0
	option mobility_domain 4096
	option disabled 1
	option device_def   mt7628
	option encryption none
	option key      ""

config wifi-iface
	option ifname   ra2
	option network  lan
	option mode     ap
	option disabled 1
	option ieee80211r 0
	option mobility_domain 4096
	option device_def   mt7628
	option encryption none
	option key      ""

config wifi-iface
	option ifname   ra3
	option network  lan
	option mode     ap
	option disabled 1
	option ieee80211r 0
	option mobility_domain 4096
	option device_def   mt7628
	option encryption none
	option key      ""

config wifi-iface
	option ifname   ra4
	option network  lan
	option mode     ap
	option disabled 1
	option ieee80211r 0
	option mobility_domain 4096
	option device_def   mt7628
	option encryption none
	option key      ""

config wifi-iface
	option ifname   ra5
	option network  lan
	option mode     ap
	option disabled 1
	option ieee80211r 0
	option mobility_domain 4096
	option device_def   mt7628
	option encryption none
	option key      ""

config wifi-iface
	option ifname   ra6
	option network  lan
	option mode     ap
	option disabled 1
	option ieee80211r 0
	option mobility_domain 4096
	option device_def   mt7628
	option encryption none
	option key      ""

config wifi-iface
	option device mt7628
	option ifname ra7
	option network 'lan'
	option mode 'ap'
	option isolate '1'
	option ssid ${ssid2g_admin}
	option maxassoc '3'
	option encryption 'psk2'
	option key      '12345678'
	option hidden '1'
	option disabled 1
	option device_def   mt7628
EOF
	else # 2 is multi
         cat <<EOF
config wifi-device      mt7628
        option type     mt7628
        option vendor   ralink
        option band     2.4G
        option channel  0
	option auotch   2
	option bw   	0
        option hwmode   11bgn
        option country  CN
	option region   1
        option htmode   HT20
	option txpower  100
	option noforward  '0;0;0;0'
	option autoch_skip 12
	option rtsthres 2347
	option fragthres 2346

config wifi-iface
        option device   mt7628
        option ifname   ra0
        option network  lan
        option mode     ap
        option ssid     $ssid2g_set
        option encryption none
        option key      ""
        option hidden   0
        option wmm      1
        option wds      1
        option disabled 0
	option isolate 	0
        option wps_pushbutton 1
	option maxassoc 0

config wifi-iface
	option ieee80211r 0
	option mobility_domain 4096
        option isolate 0
        option ifname ra1
        option hidden 0
        option wmm 1
        option maxassoc 0
        option wds 1
        option ssid COMFAST
        option encryption null
        option device mt7628
        option network lan
        option mode ap
        option disabled 1

config wifi-iface
	option ieee80211r 0
	option mobility_domain 4096
        option isolate 0
        option ifname ra2
        option hidden 0
        option wmm 1
        option maxassoc 0
        option wds 1
        option ssid COMFAST
        option encryption null
        option device mt7628
        option network lan
        option mode ap
        option disabled 1

config wifi-iface
        option ieee80211r 0
        option mobility_domain 4096
        option device mt7628
        option network lan
        option mode ap
        option ifname ra3
        option hidden 1
        option wmm 1
        option isolate 0
        option maxassoc 0
        option wds 1
        option ssid cluster_yincang
        option encryption psk2
	option key 12345678
        option disabled 0

config wifi-iface
	option ieee80211r 0
	option mobility_domain 4096

config wifi-iface
	option ieee80211r 0
	option mobility_domain 4096

config wifi-iface
	option ieee80211r 0
	option mobility_domain 4096

config wifi-iface
	option ieee80211r 0
	option mobility_domain 4096
EOF
	fi

}


