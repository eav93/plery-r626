#!/bin/sh
#
# Copyright (C) 2010-2013 OpenWrt.org
#

RAMIPS_BOARD_NAME=
RAMIPS_MODEL=

wifi_exist=0

hwinfo() {
	local dev
	local hws
	local hwv

	dev=$(find_mtd_part "factory")
	if [ "$wifi_exist" == "1" ]; then
		hws=`dd if=$dev bs=1 skip=57600 count=256 2>/dev/null | hexdump -v -e '1/1 "%c"'| strings`
	else
		hws=`dd if=$dev bs=1 skip=256 count=256 2>/dev/null | hexdump -v -e '1/1 "%c"'| strings`
	fi
	echo "$hws" | cut -f1 -d '|' > /tmp/sysinfo/hwsn

	if [ "$wifi_exist" == "1" ]; then
		dd if=$dev bs=1 skip=57856 count=256 2>/dev/null | hexdump -v -e '1/1 "%c"'| strings > /tmp/sysinfo/hwkey
	else
		dd if=$dev bs=1 skip=512 count=256 2>/dev/null | hexdump -v -e '1/1 "%c"'| strings > /tmp/sysinfo/hwkey
	fi

	lan_mac=$(cat /tmp/sysinfo/mac)
	wlan_mac=$(macaddr_add "$lan_mac" 1)
	echo $wlan_mac > /tmp/sysinfo/wmac
	admin_wlan_mac=$(macaddr_add "$wlan_mac" 2)
	echo $admin_wlan_mac > /tmp/sysinfo/admin_wmac

	if [ "$wifi_exist" == "1" ]; then
		dd if=$dev bs=1 skip=57344 count=6 2>/dev/null | hexdump -v -e '1/1 "%02x"' > /tmp/sysinfo/wifidog_mac
	else
		dd if=$dev bs=1 skip=0 count=6 2>/dev/null | hexdump -v -e '1/1 "%02x"' > /tmp/sysinfo/wifidog_mac
	fi

	dev_configs=$(find_mtd_part "configs")
	[ -n "$dev_configs" ] && echo "mtd $dev_configs" > /tmp/sysinfo/dev_configs
}

ramips_hwinfo() {
	local dev
	local new_board_name
	local new_board_name_uppercase
	local new_model
	local new_version
	local version

	version=`cat /etc/defconfig/$RAMIPS_BOARD_NAME/version`
	echo "$version" > /tmp/sysinfo/hwrev
	dev=$(find_mtd_part "factory")

#	support replace board name and model by uboot, at the same time should modify version descption.
	if [ "$wifi_exist" == "1" ]; then
		new_board_name=`dd if=$dev bs=1 skip=1024 count=256 2>/dev/null | hexdump -v -e '1/1 "%c"'| strings`
		new_model=`dd if=$dev bs=1 skip=1280 count=256 2>/dev/null | hexdump -v -e '1/1 "%c"'| strings`
	else
		new_board_name=`dd if=$dev bs=1 skip=1024 count=256 2>/dev/null | hexdump -v -e '1/1 "%c"'| strings`
		new_model=`dd if=$dev bs=1 skip=1280 count=256 2>/dev/null | hexdump -v -e '1/1 "%c"'| strings`
	fi
#	[ -z "$new_board_name" ] || {
#		echo "$new_board_name" > /tmp/sysinfo/board_name
#		echo "$new_model" > /tmp/sysinfo/model
#		new_version=V${version##*-V}
#		new_board_name_uppercase=`echo "$new_model" | cut -f2 -d ' '`
#		echo "${new_board_name_uppercase}-${new_version}" > /tmp/sysinfo/hwrev
#	}
}

ramips_board_detect() {
	local machine
	local name
	local def_wan
	local port_sum
	local port_list
	local ifname_list
	local vlan_support
	local vlan_min
	local vlan_max
	local vlan_board_type
	local vlan_qinq_support
	local vlan_multiple_port
	local vlan_wireless
	local vlan_switch
	local ssid_vid_min
	local ssid_vid_max
	local ip
	local reboot_time
	local factory_time
	local upgrade_time
	local mlan
	local mwan
	local multi_pppoe_num
	local board_type
	local ac_mode
	local ssid_vid_support

	machine=$(awk 'BEGIN{FS="[ \t]+:[ \t]"} /machine/ {print $2}' /proc/cpuinfo)

	case "$machine" in
	*"COMFAST CF-WR301S")
		name="cf-wr301s"
		;;
	*"CF-AC100" | \
	*"CF-AC101" | \
	*"CF-AC200" |\
	*"CF-AC50" |\
	*"CF-RG215")
		case "$machine" in
			*"CF-AC100")
				name="cf-ac100"
				multi_pppoe_num="2"
				;;
			*"CF-AC101")
				name="cf-ac101"
				multi_pppoe_num="2"
				;;
			*"CF-AC200")
				name="cf-ac200"
				multi_pppoe_num="4"
				;;
			*"CF-AC50")
				name="cf-ac50"
				multi_pppoe_num="2"
				;;
			*"CF-RG215")
				name="cf-rg215"
				multi_pppoe_num="2"
				;;
		esac
		ac_mode=1
		def_wan="switch0"
		port_sum="5"
		port_list="switch0,switch1,switch2,switch3,switch4,"
		ifname_list="eth0.1,eth0.2,eth0.3,eth0.4,eth0.5,"
		ip="172.16.0.1"
		reboot_time="55"
		factory_time="90"
		upgrade_time="180"
		vlan_support=1
		vlan_min="6"
		vlan_max="127"
		vlan_board_type="line"
		vlan_qinq_support="1"
		vlan_multiple_port="1"
		vlan_wireless="0"
		vlan_switch="1"
		board_type="ramips_mt7621"
		mlan=1
		mwan=1
		ssid_vid_min="6"
		ssid_vid_max="127"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_5_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_4_macaddr=$(macaddr_add "$lan_mac" 1)
		def_eth0_3_macaddr=$(macaddr_add "$lan_mac" 2)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 3)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 4)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		echo $def_eth0_3_macaddr > /tmp/sysinfo/defaultmac/eth0.3
		echo $def_eth0_4_macaddr > /tmp/sysinfo/defaultmac/eth0.4
		echo $def_eth0_5_macaddr > /tmp/sysinfo/defaultmac/eth0.5
		;;
	*"CF-E318AC")
		name="cf-e318ac"
		def_wan="switch0"
		port_sum="1"
		port_list="switch1,"
		ifname_list="eth0.1,eth0.2,"
		ip="192.168.10.1"
		reboot_time="80"
		factory_time="80"
		upgrade_time="120"
		board_type="mt7620"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 1)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		;;
	*"CF-E320N")
		name="cf-e320n"
		;;
	*"CF-E330N")
		name="cf-e330n"
		;;
	*"CF-E455AC")
		name="cf-e455ac"
		def_wan="switch0"
		port_sum="2"
		port_list="switch0,switch1,"
		ifname_list="eth0.2,eth0.1,"
		ip="192.168.10.1"
		reboot_time="50"
		factory_time="50"
		upgrade_time="200"
		vlan_support=1
		vlan_min="3"
		vlan_max="15"
		vlan_board_type="port"
		vlan_multiple_port="1"
		vlan_wireless="1"
		vlan_switch="1"
		ssid_vid_min="3"
		ssid_vid_max="15"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 1)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		echo "1" > /tmp/sysinfo/admin_wifi_exist
		;;
	*"CF-E475AC")
		name="cf-e475ac"
		def_wan="switch0"
		port_sum="2"
		port_list="switch0,switch1,"
		ifname_list="eth0.1,eth0.2,"
		ip="192.168.10.1"
		reboot_time="50"
		factory_time="50"
		upgrade_time="200"
		ssid_vid_min="6"
		ssid_vid_max="127"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 1)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		ssid_vid_support=1
		wifi_exist=1
		echo "1" > /tmp/sysinfo/admin_wifi_exist
		;;
	*"CF-E500N")
		name="cf-e500n"
		;;
	*"CF-E510N")
		name="cf-e510n"
		;;
	*"CF-E538AC")
		name="cf-e538ac"
		def_wan="switch4"
		port_sum="2"
		port_list="switch4,switch5,"
		ifname_list="eth0.2,eth0.1,"
		ip="192.168.10.1"
		reboot_time="50"
		factory_time="50"
		upgrade_time="200"
		vlan_support=1
		vlan_min="3"
		vlan_max="15"
		vlan_board_type="port"
		vlan_multiple_port="1"
		vlan_wireless="1"
		vlan_switch="1"
		ssid_vid_min="3"
		ssid_vid_max="15"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 1)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		echo "1" > /tmp/sysinfo/admin_wifi_exist
		ssid_vid_support=1
		;;
	*"CF-WR305N")
		name="cf-wr305n"
		def_wan="switch0"
		port_sum="1"
		port_list="switch4,"
		ifname_list="eth0.1"
		ip="192.168.10.1"
		reboot_time="50"
		factory_time="50"
		upgrade_time="100"
		board_type="ar71xx"
		wan_switch_port="4"
		lan_switch_port="4"
		;;
	*"CF-WR380AC")
		name="cf-wr380ac"
		;;
	
	*"CF-E3V2")
		name="cf-e3v2"
		def_wan="switch4"
		port_sum="3"
		port_list="switch4,switch2,switch3,"
		ifname_list="eth0.2,eth0.1,eth0.1,"
		ip="192.168.0.1"
		reboot_time="90"
		factory_time="90"
		upgrade_time="130"
		board_type="mt7628"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 1)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		echo "1" > /tmp/sysinfo/admin_wifi_exist
		echo "1" > /tmp/sysinfo/mt7628_chip
	;;

	*"CF-PLERY")
		name="cf-plery"
		RAMIPS_MODEL="CF-PLERY-R626"
		def_wan="switch4"
		port_sum="3"
		port_list="switch4,switch3,switch2,"
		ifname_list="eth0.2,eth0.1,eth0.1,"
		ip="192.168.0.1"
		reboot_time="90"
		factory_time="90"
		upgrade_time="180"
		board_type="mt7628"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 1)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		echo "1" > /tmp/sysinfo/admin_wifi_exist
		echo "1" > /tmp/sysinfo/mt7628_chip
	;;
	
	*"CF-A560V2")
		name="cf-a560v2"
		def_wan="switch4"
		mkdir -p "/tmp/sysinfo"
		# ac web
		# ac_mode=0
		board_type="ramips_mt7621"
		# cpu port (swconfig switch0 help)
		switch_cpu="5"
		# vlan prefix
		switch_ifname="eth1"
		port_sum="2"
		port_list="switch4,switch0,"
		ifname_list="eth1.2,eth1.1,"
		ip="192.168.1.200"
		reboot_time="50"
		factory_time="50"
		upgrade_time="200"
		# vlan config
		vlan_support=1
		vlan_min="3"
		vlan_max="4094"
		# web vlan type: port or line
		vlan_board_type="port"
		# multi layer vlan
		vlan_qinq_support="1"
		# multi port vlan
		vlan_multiple_port="1"
		vlan_wireless="1"
		vlan_switch="0"
		ssid_vid_support=1
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 1)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth1.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth1.2
		;;
	*"CF-WR619AC")
		name="cf-wr619ac"
		def_wan="switch4"
		mkdir -p "/tmp/sysinfo"
		# ac web
		# ac_mode=0
		board_type="ramips_mt7621"
		# cpu port (swconfig switch0 help)
		switch_cpu="5"
		# vlan prefix
		switch_ifname="eth1"
		port_sum="4"
		port_list="switch4,switch3,switch2,switch1,"
		ifname_list="eth1.2,eth1.1,eth1.1,eth1.1,"
		ip="192.168.0.1"
		reboot_time="50"
		factory_time="50"
		upgrade_time="200"
		# vlan config
		vlan_support=1
		vlan_min="3"
		vlan_max="4094"
		# web vlan type: port or line
		vlan_board_type="port"
		# multi layer vlan
		vlan_qinq_support="1"
		# multi port vlan
		vlan_multiple_port="1"
		vlan_wireless="1"
		vlan_switch="1"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 1)
		def_eth0_3_macaddr=$(macaddr_add "$lan_mac" 2)
		def_eth0_4_macaddr=$(macaddr_add "$lan_mac" 3)
		def_eth0_5_macaddr=$(macaddr_add "$lan_mac" 4)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth1.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth1.2
		echo $def_eth0_3_macaddr > /tmp/sysinfo/defaultmac/eth1.3
		echo $def_eth0_4_macaddr > /tmp/sysinfo/defaultmac/eth1.4
		echo $def_eth0_5_macaddr > /tmp/sysinfo/defaultmac/eth1.5
		wifi_exist=1
		echo "1" > /tmp/sysinfo/have_combine
		echo 1 >/tmp/sysinfo/router_mode_device
		# mtk 2g wps mode
		echo mtkwps >/tmp/sysinfo/reset_button_mode1
		# mtk 5g wps mode
		echo mtkwps >/tmp/sysinfo/reset_button_mode5
		echo "MEDIATEK MT7621AT" >/tmp/sysinfo/cpuinfo
		;;
	*"CF-N5")
		name="cf-n5"
		def_wan="switch4"
		mkdir -p "/tmp/sysinfo"
		# ac web
		# ac_mode=0
		board_type="ramips_mt7621"
		# cpu port (swconfig switch0 help)
		switch_cpu="5"
		# vlan prefix
		switch_ifname="eth1"
		port_sum="5"
		port_list="switch4,switch3,switch2,switch1,switch0,"
		ifname_list="eth1.2,eth1.1,eth1.1,eth1.1,eth1.1,"
		ip="192.168.0.1"
		reboot_time="50"
		factory_time="50"
		upgrade_time="200"
		# vlan config
		vlan_support=1
		vlan_min="3"
		vlan_max="4094"
		# web vlan type: port or line
		vlan_board_type="port"
		# multi layer vlan
		vlan_qinq_support="1"
		# multi port vlan
		vlan_multiple_port="1"
		vlan_wireless="1"
		vlan_switch="1"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 1)
		def_eth0_3_macaddr=$(macaddr_add "$lan_mac" 2)
		def_eth0_4_macaddr=$(macaddr_add "$lan_mac" 3)
		def_eth0_5_macaddr=$(macaddr_add "$lan_mac" 4)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth1.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth1.2
		echo $def_eth0_3_macaddr > /tmp/sysinfo/defaultmac/eth1.3
		echo $def_eth0_4_macaddr > /tmp/sysinfo/defaultmac/eth1.4
		echo $def_eth0_5_macaddr > /tmp/sysinfo/defaultmac/eth1.5
		wifi_exist=1
		echo 1 >/tmp/sysinfo/router_mode_device
		;;
	*"CF-WR618ACV2")
		name="cf-wr618acv2"
		def_wan="switch0"
		mkdir -p "/tmp/sysinfo"
		ac_mode=1
		board_type="ramips_mt7621"
		port_sum="5"
		port_list="switch0,switch1,switch2,switch3,switch4,"
		ifname_list="eth1,eth0,eth0,eth0,eth0,"
		ip="172.16.0.1"
		reboot_time="50"
		factory_time="50"
		upgrade_time="200"
		vlan_support=1
		vlan_min="6"
		vlan_max="127"
		vlan_board_type="line"
		vlan_qinq_support="1"
		vlan_multiple_port="1"
		vlan_wireless="0"
		vlan_switch="1"
		mlan=1
		mwan=1
		ssid_vid_min="6"
		ssid_vid_max="127"
		multi_pppoe_num="2"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_5_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_4_macaddr=$(macaddr_add "$lan_mac" 1)
		def_eth0_3_macaddr=$(macaddr_add "$lan_mac" 2)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 3)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 4)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		echo $def_eth0_3_macaddr > /tmp/sysinfo/defaultmac/eth0.3
		echo $def_eth0_4_macaddr > /tmp/sysinfo/defaultmac/eth0.4
		echo $def_eth0_5_macaddr > /tmp/sysinfo/defaultmac/eth0.5
		wifi_exist=1
		;;
	*"CF-WR618AC")
		name="cf-wr618ac"
		def_wan="switch0"
		board_type="ramips_mt7621"
		mkdir -p "/tmp/sysinfo"
		echo $name >  /tmp/sysinfo/mt7615e
		ac_mode=1
		port_sum="5"
		port_list="switch0,switch1,switch2,switch3,switch4,"
		ifname_list="eth0.1,eth0.2,eth0.3,eth0.4,eth0.5,"
		ip="172.16.0.1"
		reboot_time="50"
		factory_time="50"
		upgrade_time="200"
		vlan_support=1
		vlan_min="6"
		vlan_max="127"
		vlan_board_type="line"
		vlan_qinq_support="1"
		vlan_multiple_port="1"
		vlan_wireless="0"
		vlan_switch="1"
		mlan=1
		mwan=1
		ssid_vid_min="6"
		ssid_vid_max="127"
		multi_pppoe_num="2"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_5_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_4_macaddr=$(macaddr_add "$lan_mac" 1)
		def_eth0_3_macaddr=$(macaddr_add "$lan_mac" 2)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 3)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 4)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		echo $def_eth0_3_macaddr > /tmp/sysinfo/defaultmac/eth0.3
		echo $def_eth0_4_macaddr > /tmp/sysinfo/defaultmac/eth0.4
		echo $def_eth0_5_macaddr > /tmp/sysinfo/defaultmac/eth0.5
		wifi_exist=1
		;;
	*"CF-WR620N")
		name="cf-wr620n"
		def_wan="switch0"
		port_sum="5"
		port_list="switch0,switch1,switch2,switch3,switch4,"
		ifname_list="eth0.2,eth0.1,eth0.1,eth0.1,eth0.1,"
		ip="172.16.0.1"
		reboot_time="50"
		factory_time="50"
		upgrade_time="200"
		vlan_support=1
		vlan_min="3"
		vlan_max="15"
		vlan_board_type="port"
		vlan_multiple_port="1"
		vlan_wireless="1"
		vlan_switch="1"
		ssid_vid_min="3"
		ssid_vid_max="15"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 1)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		echo "1" > /tmp/sysinfo/admin_wifi_exist
		;;
	*"CF-WR625AC")
		name="cf-wr625ac"
		;;
	*"CF-WR617AC")
		name="cf-wr617ac"
		def_wan="switch4"
		port_sum="4"
		port_list="switch3,switch2,switch1,switch4,"
		ifname_list="eth0.1,eth0.1,eth0.1,eth0.2,"
		ip="192.168.10.1"
		reboot_time="80"
		factory_time="80"
		upgrade_time="120"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 1)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		echo "1" > /tmp/sysinfo/admin_wifi_exist
		echo "1" > /tmp/sysinfo/mt7628_chip
		;;
	*"CF-WR627N")
		name="cf-wr627n"
		def_wan="switch4"
		port_sum="4"
		port_list="switch4,switch3,switch2,switch1,switch0,"
		ifname_list="eth0.2,eth0.1,eth0.1,eth0.1,"
		ip="192.168.10.1"
		reboot_time="80"
		factory_time="80"
		upgrade_time="120"
		lan_mac=$(cat /sys/class/net/eth0/address)
		def_eth0_1_macaddr=$(macaddr_add "$lan_mac" 0)
		def_eth0_2_macaddr=$(macaddr_add "$lan_mac" 1)
		mkdir -p "/tmp/sysinfo/defaultmac"
		echo $def_eth0_1_macaddr > /tmp/sysinfo/defaultmac/eth0.1
		echo $def_eth0_2_macaddr > /tmp/sysinfo/defaultmac/eth0.2
		echo "1" > /tmp/sysinfo/admin_wifi_exist
		echo "1" > /tmp/sysinfo/mt7628_chip
		;;
	*"CF-WR752ACV2")
		name="cf-wr752acv2"
		def_wan="switch0"
		port_sum="1"
		port_list="switch4,"
		ifname_list="eth0.2,eth0.1,"
		ip="192.168.10.1"
		reboot_time="90"
		factory_time="90"
		upgrade_time="130"
		board_type="mt7628"
		wan_switch_port="4"
		lan_switch_port="4"
		lan_mac=$(cat /sys/class/net/eth0/address)
		;;
	*"CF-WR753AC")
		name="cf-wr753ac"
		def_wan="switch0"
		port_sum="1"
		port_list="switch1,"
		ifname_list="eth0.1,eth0.2,"
		ip="192.168.10.1"
		reboot_time="90"
		factory_time="90"
		upgrade_time="130"
		board_type="mt7620"
		lan_mac=$(cat /sys/class/net/eth0/address)
		;;
	*"CF-WR754AC")
		name="cf-wr754ac"
		def_wan="switch0"
		port_sum="2"
		port_list="switch4,switch3,"
		ifname_list="eth0.2,eth0.1,"
		ip="192.168.10.1"
		reboot_time="90"
		factory_time="90"
		upgrade_time="130"
		board_type="mt7628"
		wan_switch_port="4"
		lan_switch_port="4"
		lan_mac=$(cat /sys/class/net/eth0/address)
		;;
	*"CF-WR755AC")
		name="cf-wr755ac"
		def_wan="switch0"
		port_sum="1"
		port_list="switch4,"
		ifname_list="eth0.2,eth0.1,"
		ip="192.168.10.1"
		reboot_time="90"
		factory_time="90"
		upgrade_time="130"
		board_type="mt7628"
		wan_switch_port="4"
		lan_switch_port="4"
		lan_mac=$(cat /sys/class/net/eth0/address)
		;;
	*"JW-WR758AC")
		name="jw-wr758ac"
		def_wan="switch0"
		port_sum="2"
		port_list="switch4,switch3,"
		ifname_list="eth0.2,eth0.1,"
		ip="192.168.10.1"
		reboot_time="90"
		factory_time="90"
		upgrade_time="130"
		board_type="mt7628"
		wan_switch_port="4"
		lan_switch_port="4"
		lan_mac=$(cat /sys/class/net/eth0/address)
		;;
	*"CF-WR758AC")
		name="cf-wr758ac"
		def_wan="switch0"
		port_sum="2"
		port_list="switch4,switch3,"
		ifname_list="eth0.2,eth0.1,"
		ip="192.168.10.1"
		reboot_time="90"
		factory_time="90"
		upgrade_time="130"
		board_type="mt7628"
		wan_switch_port="4"
		lan_switch_port="4"
		lan_mac=$(cat /sys/class/net/eth0/address)
		;;
	*"JW-WR768AC")
		name="jw-wr768ac"
		def_wan="switch0"
		port_sum="2"
		port_list="switch4,switch3,"
		ifname_list="eth0.2,eth0.1,"
		ip="192.168.10.1"
		reboot_time="90"
		factory_time="90"
		upgrade_time="130"
		board_type="mt7628"
		wan_switch_port="4"
		lan_switch_port="4"
		lan_mac=$(cat /sys/class/net/eth0/address)
		;;
	*"CF-AC1200")
		name="cf-ac1200"
		def_wan="switch0"
		port_sum="2"
		port_list="switch4,switch3,"
		ifname_list="eth0.2,eth0.1,"
		ip="192.168.10.1"
		reboot_time="90"
		factory_time="90"
		upgrade_time="130"
		board_type="mt7628"
		wan_switch_port="4"
		lan_switch_port="4"
		lan_mac=$(cat /sys/class/net/eth0/address)
		;;
	*"CF-WR800N")
		name="cf-wr800n"
		;;
	*"Newifi-D2")
		name="newifi-d2"
		;;
	*"11AC NAS Router")
		name="11acnas"
		;;
	*"3G150B")
		name="3g150b"
		;;
	*"3G300M")
		name="3g300m"
		;;
	*"3g-6200n")
		name="3g-6200n"
		;;
	*"3g-6200nl")
		name="3g-6200nl"
		;;
	*"A5-V11")
		name="a5-v11"
		;;
	*"Ai-BR100")
		name="ai-br100"
		;;
	*"Air3GII")
		name="air3gii"
		;;
	*"ALL0239-3G")
		name="all0239-3g"
		;;
	*"ALL0256N (4M)")
		name="all0256n-4M"
		;;
	*"ALL0256N (8M)")
		name="all0256n-8M"
		;;
	*"ALL5002")
		name="all5002"
		;;
	*"ALL5003")
		name="all5003"
		;;
	*"AR670W")
		name="ar670w"
		;;
	*"AR725W")
		name="ar725w"
		;;
	*"ASL26555 (8M)")
		name="asl26555-8M"
		;;
	*"ASL26555 (16M)")
		name="asl26555-16M"
		;;
	*"ATP-52B")
		name="atp-52b"
		;;
	*"AWAPN2403")
		name="awapn2403"
		;;
	*"AWM002 EVB (4M)")
		name="awm002-evb-4M"
		;;
	*"AWM002 EVB (8M)")
		name="awm002-evb-8M"
		;;
	*"AWM003 EVB")
		name="awm003-evb"
		;;
	*"BC2")
		name="bc2"
		;;
	*"BR-6425")
		name="br-6425"
		;;
	*"BR-6475nD")
		name="br-6475nd"
		;;
	*"Broadway")
		name="broadway"
		;;
	*"C20i")
		name="c20i"
		;;
	*"C50")
		name="c50"
		;;
	*"Carambola")
		name="carambola"
		;;
	*"CF-WR800N")
		name="cf-wr800n"
		;;
	*"CS-QR10")
		name="cs-qr10"
		;;
	*"CY-SWR1100")
		name="cy-swr1100"
		;;
	*"D105")
		name="d105"
		;;
	*"D240")
		name="d240"
		;;
	*"DAP-1350")
		name="dap-1350"
		;;
	*"DB-WRT01")
		name="db-wrt01"
		;;
	*"DCH-M225")
		name="dch-m225"
		;;
	*"DCS-930")
		name="dcs-930"
		;;
	*"DCS-930L B1")
		name="dcs-930l-b1"
		;;
	*"Digineo AC1200 Pro")
		name="ac1200pro"
		;;
	*"DIR-300 B1")
		name="dir-300-b1"
		;;
	*"DIR-300 B7")
		name="dir-300-b7"
		;;
	*"DIR-320 B1")
		name="dir-320-b1"
		;;
	*"DIR-600 B1")
		name="dir-600-b1"
		;;
	*"DIR-610 A1")
		name="dir-610-a1"
		;;
	*"DIR-615 D")
		name="dir-615-d"
		;;
	*"DIR-615 H1")
		name="dir-615-h1"
		;;
	*"DIR-620 A1")
		name="dir-620-a1"
		;;
	*"DIR-620 D1")
		name="dir-620-d1"
		;;
	*"DIR-645")
		name="dir-645"
		;;
	*"DIR-810L")
		name="dir-810l"
		;;
	*"DIR-860L B1")
		name="dir-860l-b1"
		;;
	*"Dovado Tiny AC")
		name="tiny-ac"
		;;
	*"DuZun DM06")
		name="duzun-dm06"
		;;
	*"DWR-512 B")
		name="dwr-512-b"
		;;
	*"E1700")
		name="e1700"
		;;
	*"ESR-9753")
		name="esr-9753"
		;;
	*"EX2700")
		name="ex2700";
		;;
	*"F5D8235 v1")
		name="f5d8235-v1"
		;;
	*"F5D8235 v2")
		name="f5d8235-v2"
		;;
	*"F7C027")
		name="f7c027"
		;;
	*"FireWRT")
		name="firewrt"
		;;
	*"Fonera 2.0N")
		name="fonera20n"
		;;
	*"FreeStation5")
		name="freestation5"
		;;
	*"GL-MT300A")
		name="gl-mt300a"
		;;
	*"GL-MT300N")
		name="gl-mt300n"
		;;
	*"GL-MT750")
		name="gl-mt750"
		;;
	*"HC5661")
		name="hc5661"
		;;
	*"HC5761")
		name="hc5761"
		;;
	*"HC5861")
		name="hc5861"
		;;
	*"HG255D")
		name="hg255d"
		;;
	*"HLK-RM04")
		name="hlk-rm04"
		;;
	*"HPM")
		name="hpm"
		;;
	*"HT-TM02")
		name="ht-tm02"
		;;
	*"HW550-3G")
		name="hw550-3g"
		;;
	*"IP2202")
		name="ip2202"
		;;
	*"JHR-N805R")
		name="jhr-n805r"
		;;
	*"JHR-N825R")
		name="jhr-n825r"
		;;
	*"JHR-N926R")
		name="jhr-n926r"
		;;
	*"M3")
		name="m3"
		;;
	*"M4 (4M)")
		name="m4-4M"
		;;
	*"M4 (8M)")
		name="m4-8M"
		;;
	*"MediaTek LinkIt Smart 7688")
		linkit="$(dd bs=1 skip=1024 count=12 if=/dev/mtd2 2> /dev/null)"
		if [ "${linkit}" = "LINKITS7688D" ]; then
			name="linkits7688d"
			RAMIPS_MODEL="${machine} DUO"
		else
			name="linkits7688"
		fi
		;;
	*"Memory 2 Move")
		name="m2m"
		;;
	*"Mercury MAC1200R v2")
		name="mac1200r-v2"
		;;
	*"MicroWRT")
		name="microwrt"
		;;
	*"MiniEMBPlug")
		name="miniembplug"
		;;
	*"MiniEMBWiFi")
		name="miniembwifi"
		;;
	*"MiWiFi Mini")
		name="miwifi-mini"
		;;
	*"MiWiFi Nano")
		name="miwifi-nano"
		;;
	*"MLW221")
		name="mlw221"
		;;
	*"MLWG2")
		name="mlwg2"
		;;
	*"MOFI3500-3GN")
		name="mofi3500-3gn"
		;;
	*"MPR-A1")
		name="mpr-a1"
		;;
	*"MPR-A2")
		name="mpr-a2"
		;;
	*"MR-102N")
		name="mr-102n"
		;;
	*"MR200")
		name="mr200"
		;;
	*"MT7620a + MT7530 evaluation"*)
		name="mt7620a_mt7530"
		;;
	*"MT7620a V22SG"*)
		name="mt7620a_v22sg"
		;;
	*"MediaTek MT7621 RFB (SNOR)")
		name="mt7621-rfb-nor"
		;;
	*"MediaTek MT7621 RFB (NAND)")
		name="mt7621-rfb-nand"
		;;
	*"MediaTek MT7621 RFB (802.11ax,SNOR)")
		name="mt7621-rfb-ax-nor"
		;;
	*"MediaTek MT7621 RFB (802.11ax,NAND)")
		name="mt7621-rfb-ax-nand"
		;;
	*"MediaTek MT7621 Raeth (SNOR)")
		name="mt7621-raeth-nor"
		;;
	*"MediaTek MT7621 Raeth (802.11ax,SNOR)")
		name="mt7621-raeth-ax-nor"
		;;
	*"MT7628AN evaluation"*)
		name="mt7628"
		;;
	*"MT7688 evaluation"*)
		name="mt7688"
		;;
	*"MZK-750DHP")
		name="mzk-750dhp"
		;;
	*"MZK-DP150N")
		name="mzk-dp150n"
		;;
	*"MZK-EX300NP")
		name="mzk-ex300np"
		;;
	*"MZK-EX750NP")
		name="mzk-ex750np"
		;;
	*"MZK-W300NH2"*)
		name="mzk-w300nh2"
		;;
	*"MZK-WDPR"*)
		name="mzk-wdpr"
		;;
	*"NA930")
		name="na930"
		;;
	*"NBG-419N")
		name="nbg-419n"
		;;
	*"NBG-419N v2")
		name="nbg-419n2"
		;;
	*"Newifi-D1")
		name="newifi-d1"
		;;
	*"NCS601W")
		name="ncs601w"
		;;
	*"NixcoreX1 (8M)")
		name="nixcore-x1-8M"
		;;
	*"NixcoreX1 (16M)")
		name="nixcore-x1-16M"
		;;
	*"NW718")
		name="nw718"
		;;
	*"Onion Omega2")
		name="omega2"
		;;
	*"Onion Omega2+")
		name="omega2p"
		;;
	*"OY-0001")
		name="oy-0001"
		;;
	*"PBR-D1")
		name="pbr-d1"
		;;
	*"PBR-M1")
		name="pbr-m1"
		;;
	*"PSG1208")
		name="psg1208"
		;;
	*"PSG1218")
		name="psg1218"
		;;
	*"PSR-680W"*)
		name="psr-680w"
		;;
	*"PWH2004")
		name="pwh2004"
		;;
	*"PX-4885 (4M)")
		name="px-4885-4M"
		;;
	*"PX-4885 (8M)")
		name="px-4885-8M"
		;;
	*"Q7")
		name="zte-q7"
		;;
	*"RB750Gr3")
		name="rb750gr3"
		;;
	*"RE6500")
		name="re6500"
		;;
	*"RN502J")
		name="xdxrn502j"
		;;
	*"RP-N53")
		name="rp-n53"
		;;
	*"RT5350F-OLinuXino")
		name="rt5350f-olinuxino"
		;;
	*"RT5350F-OLinuXino-EVB")
		name="rt5350f-olinuxino-evb"
		;;
	*"RT-G32 B1")
		name="rt-g32-b1"
		;;
	*"RT-N10+")
		name="rt-n10-plus"
		;;
	*"RT-N13U")
		name="rt-n13u"
		;;
	*"RT-N14U")
		name="rt-n14u"
		;;
	*"RT-N15")
		name="rt-n15"
		;;
	*"RT-N56U")
		name="rt-n56u"
		;;
	*"RUT5XX")
		name="rut5xx"
		;;
	*"SamKnows Whitebox 8")
		name="sk-wb8"
		;;
	*"SAP-G3200U3")
		name="sap-g3200u3"
		;;
	*"SL-R7205"*)
		name="sl-r7205"
		;;
	*"TEW-691GR")
		name="tew-691gr"
		;;
	*"TEW-692GR")
		name="tew-692gr"
		;;
	*"TEW-714TRU")
		name="tew-714tru"
		;;
	*"Timecloud")
		name="timecloud"
		;;
	*"UBNT-ERX")
		name="ubnt-erx"
		;;
	*"UR-326N4G")
		name="ur-326n4g"
		;;
	*"UR-336UN")
		name="ur-336un"
		;;
	*"V11ST-FE")
		name="v11st-fe"
		;;
	*"V22RW-2X2")
		name="v22rw-2x2"
		;;
	*"VoCore (8M)")
		name="vocore-8M"
		;;
	*"VoCore (16M)")
		name="vocore-16M"
		;;
	*"VoCore2")
		name="vocore2"
		;;
	*"VR500")
		name="vr500"
		;;
	*"W150M")
		name="w150m"
		;;
	*"W2914NS v2")
		name="w2914nsv2"
		;;
	*"W306R V2.0")
		name="w306r-v20"
		;;
	*"W502U")
		name="w502u"
		;;
	*"WCR-150GN")
		name="wcr-150gn"
		;;
	*"WF-2881")
		name="wf-2881"
		;;
	*"WHR-1166D")
		name="whr-1166d"
		;;
	*"WHR-300HP2")
		name="whr-300hp2"
		;;
	*"WHR-600D")
		name="whr-600d"
		;;
	*"WHR-G300N")
		name="whr-g300n"
		;;
	*"Widora-NEO")
		name="widora-neo"
		;;
	*"WiTi")
                name="witi"
		;;
	*"WIZARD 8800")
		name="wizard8800"
		;;
	*"WizFi630A")
		name="wizfi630a"
		;;
	*"WL-330N")
		name="wl-330n"
		;;
	*"WL-330N3G")
		name="wl-330n3g"
		;;
	*"WL-341 v3")
		name="wl-341v3"
		;;
	*"WL-351 v1 002")
		name="wl-351"
		;;
	*"WL-WN575A3")
		name="wl-wn575a3"
		;;
	*"WLI-TX4-AG300N")
		name="wli-tx4-ag300n"
		;;
	*"WLR-6000")
		name="wlr-6000"
		;;
	*"WMR-300")
		name="wmr-300"
		;;
	*"WN3000RPv3")
		name="wn3000rpv3"
		;;
	*"WNCE2001")
		name="wnce2001"
		;;
	*"WNDR3700v5")
		name="wndr3700v5"
		;;
	*"WR512-3GN (4M)")
		name="wr512-3gn-4M"
		;;
	*"WR512-3GN (8M)")
		name="wr512-3gn-8M"
		;;
	*"WR6202")
		name="wr6202"
		;;
	*"WRH-300CR")
		name="wrh-300cr"
		;;
	*"WRTNODE")
		name="wrtnode"
		;;
	*"WRTnode2R")
		name="wrtnode2r"
		;;
	*"WRTnode2P")
		name="wrtnode2p"
		;;
	*"WSR-1166DHP")
		name="wsr-1166"
		;;
	*"WSR-600DHP")
		name="wsr-600"
		;;
	*"WT1520 (4M)")
		name="wt1520-4M"
		;;
	*"WT1520 (8M)")
		name="wt1520-8M"
		;;
	*"WT3020 (4M)")
		name="wt3020-4M"
		;;
	*"WT3020 (8M)")
		name="wt3020-8M"
		;;
	*"WZR-AGL300NH")
		name="wzr-agl300nh"
		;;
	*"X5")
		name="x5"
		;;
	*"X8")
		name="x8"
		;;
	*"Y1")
		name="y1"
		;;
	*"Y1S")
		name="y1s"
		;;
	*"ZBT-APE522II")
		name="zbt-ape522ii"
		;;
	*"ZBT-CPE102")
		name="zbt-cpe102"
		;;
	*"ZBT-WA05")
		name="zbt-wa05"
		;;
	*"ZBT-WE826")
		name="zbt-we826"
		;;
	*"ZBT-WG2626")
		name="zbt-wg2626"
		;;
	*"ZBT-WG3526")
		name="zbt-wg3526"
		;;
	*"ZBT-WR8305RT")
		name="zbt-wr8305rt"
		;;
	*"ZyXEL Keenetic Omni")
		name="kn_rc"
		;;
	*"ZyXEL Keenetic Omni II")
		name="kn_rf"
		;;
	*"ZyXEL Keenetic Viva")
		name="kng_rc"
		;;
	*"YK1")
		name="youku-yk1"
		;;
	*)
		name="generic"
		;;
	esac

	[ -z "$RAMIPS_BOARD_NAME" ] && RAMIPS_BOARD_NAME="$name"
	[ -z "$RAMIPS_MODEL" ] && RAMIPS_MODEL="$machine"

	[ -e "/tmp/sysinfo/" ] || mkdir -p "/tmp/sysinfo/"

	echo "$RAMIPS_BOARD_NAME" > /tmp/sysinfo/board_name
	echo "$RAMIPS_MODEL" > /tmp/sysinfo/model

	[ -n "$board_type" ] && echo -e "board_type=${board_type}\n" > /tmp/sysinfo/detect_wan_by_port
	[ -n "$ac_mode" ] && echo -e "$ac_mode" > /tmp/sysinfo/ac_mode
	[ -n "$board_type" ] && [ -n "$wan_switch_port" ] && {
		echo -e "board_type=${board_type}\nwan_switch_port=${wan_switch_port}\nlan_switch_port=${lan_switch_port}\n" > /tmp/sysinfo/detect_wan_by_port
	}
	[ -n "$def_wan" ] && [ -n "$port_sum" ] && [ -n "$port_list" ] && [ -n "$ifname_list" ] && {
		[ -n "$switch_cpu" ] && echo "switch_cpu=$switch_cpu" >>/tmp/sysinfo/port_info
		[ -n "$switch_ifname" ] && echo "switch_ifname=$switch_ifname" >>/tmp/sysinfo/port_info
		echo -e "def_wan=${def_wan}\nport_sum=${port_sum}\nport_list=${port_list}\nifname_list=${ifname_list}" >> /tmp/sysinfo/port_info
	}
	[ -n "$ip" ] && [ -n "$reboot_time" ] && [ -n "$factory_time" ] && [ -n "$upgrade_time" ] && {
		echo -e "ip:${ip}\nreboot_time:${reboot_time}\nfactory_time:${factory_time}\nupgrade_time:${upgrade_time}" > /tmp/sysinfo/common_config
	}
	[ -n "$multi_pppoe_num" ] && {
		echo -e "multi_pppoe_num:${multi_pppoe_num}" >> /tmp/sysinfo/common_config
	}
	[ -n "$vlan_support" ] && {
		echo -e "vlan_min=${vlan_min}\nvlan_max=${vlan_max}\nvlan_board_type=${vlan_board_type}\nvlan_qinq_support=${vlan_qinq_support}" > /tmp/sysinfo/vlan
		echo -e "vlan_multiple_port=${vlan_multiple_port}\nvlan_wireless=${vlan_wireless}\nvlan_switch=${vlan_switch}" >> /tmp/sysinfo/vlan
		echo -e "ssid_vid_min=${ssid_vid_min}\nssid_vid_max=${ssid_vid_max}" > /tmp/sysinfo/ssid_vid
	}
	[ -n "$mlan" ] && echo -e "$mlan" > /tmp/sysinfo/mlan
	[ -n "$mwan" ] && echo -e "$mwan" > /tmp/sysinfo/mwan
	[ -n "$lan_mac" ] && echo $lan_mac > /tmp/sysinfo/mac
	[ -n "$ssid_vid_support" ] && touch /tmp/sysinfo/ssid_vid_support


	case $RAMIPS_BOARD_NAME in
	cf-e318ac)
		echo "1" > /tmp/sysinfo/light_type
		echo "1" > /tmp/sysinfo/chip_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "1" > /tmp/sysinfo/ssid_type
		echo "3" > /tmp/sysinfo/led_status_mode
		;;
	cf-e320n)
		echo 30 >> /tmp/sysinfo/txpower
		;;

	cf-e330n | \
	cf-wr620n)
		echo 18 >> /tmp/sysinfo/txpower
		;;
	cf-e538ac)
		echo "1" > /tmp/sysinfo/chip_type
		echo "3" > /tmp/sysinfo/ssid_type
		echo "100" > /tmp/sysinfo/txpower
		echo "100" > /tmp/sysinfo/txpower_5g
		touch /tmp/sysinfo/apcli_up
		;;
	cf-e455ac)
		echo "25" > /tmp/sysinfo/txpower
		echo "25" > /tmp/sysinfo/txpower
		echo "mtk" > /tmp/sysinfo/driver_tpye
		;;
	cf-wr618ac |\
	cf-wr618acv2)
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "100" > /tmp/sysinfo/txpower
		echo "100" > /tmp/sysinfo/txpower_5g
		echo "1" > /tmp/sysinfo/chip_type
		echo "2" > /tmp/sysinfo/ssid_type
		;;

	cf-plery |\
	cf-e3v2)
		touch /tmp/sysinfo/repeater
#echo "1" > /tmp/sysinfo/light_type
		echo "4" > /tmp/sysinfo/led_status_mode
		echo "1" > /tmp/sysinfo/chip_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "3" > /tmp/sysinfo/ssid_type
		echo "100" > /tmp/sysinfo/txpower
		echo "100" > /tmp/sysinfo/txpower_5g
#echo "1" > /tmp/sysinfo/have_combine
		;;

	cf-a560v2)
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "100" > /tmp/sysinfo/txpower
		echo "100" > /tmp/sysinfo/txpower_5g
		echo "1" > /tmp/sysinfo/chip_type
		echo "3" > /tmp/sysinfo/ssid_type
		#echo "1" > /tmp/sysinfo/have_combine
		;;
	cf-wr619ac)
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "100" > /tmp/sysinfo/txpower
		echo "100" > /tmp/sysinfo/txpower_5g
		echo "1" > /tmp/sysinfo/chip_type
		echo "3" > /tmp/sysinfo/ssid_type
		;;
	cf-n5)
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "100" > /tmp/sysinfo/txpower
		echo "100" > /tmp/sysinfo/txpower_5g
		echo "1" > /tmp/sysinfo/chip_type
		echo "3" > /tmp/sysinfo/ssid_type
		;;

	cf-e475ac)
		echo "1" > /tmp/sysinfo/chip_type
		# mtk multi wifi ap(8ssid admin wifi)
		echo "3" > /tmp/sysinfo/ssid_type
		echo "100" > /tmp/sysinfo/txpower
		echo "100" > /tmp/sysinfo/txpower_5g
		touch /tmp/sysinfo/apcli_up
		echo "mtk" > /tmp/sysinfo/driver_tpye
		;;
	#chip_type "1" is mtk project
	#light_type "1" is CF-WR754AC LIGHT, "2" is CF-WR627N LIGHT, "3" is CF-WR755AC
	#mode_switch "1" is CF-WR754AC MODE SWITCH
	#driver_type "mtk" is mtk driver, other is "openwrt"
	#ssid_type "1" is single ssid, "2" is multi ssid
	cf-wr617ac)
		echo "1" > /tmp/sysinfo/chip_type
		echo "2" > /tmp/sysinfo/light_type
		echo "2" > /tmp/sysinfo/ssid_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		;;
	cf-wr627n)
		echo "1" > /tmp/sysinfo/chip_type
		echo "2" > /tmp/sysinfo/light_type
		echo "2" > /tmp/sysinfo/ssid_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		;;
	cf-wr752acv2)
		touch /tmp/sysinfo/repeater
		echo "1" > /tmp/sysinfo/light_type
		echo "1" > /tmp/sysinfo/chip_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "1" > /tmp/sysinfo/ssid_type
		;;
	cf-wr753ac)
		touch /tmp/sysinfo/repeater
		echo "1" > /tmp/sysinfo/light_type
		echo "1" > /tmp/sysinfo/chip_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "1" > /tmp/sysinfo/ssid_type
		;;
	cf-wr754ac)
		touch /tmp/sysinfo/repeater
		echo "1" > /tmp/sysinfo/mode_switch
		echo "1" > /tmp/sysinfo/light_type
		echo "1" > /tmp/sysinfo/chip_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "1" > /tmp/sysinfo/ssid_type
		;;
	cf-wr755ac)
		touch /tmp/sysinfo/repeater
		echo "3" > /tmp/sysinfo/light_type
		echo "1" > /tmp/sysinfo/chip_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "1" > /tmp/sysinfo/ssid_type
		;;
	cf-wr758ac | \
	jw-wr758ac)
		touch /tmp/sysinfo/repeater
		echo "1" > /tmp/sysinfo/light_type
		echo "1" > /tmp/sysinfo/chip_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "1" > /tmp/sysinfo/ssid_type
		echo "1" > /tmp/sysinfo/have_combine
		;;
	jw-wr768ac)
		touch /tmp/sysinfo/repeater
		echo "1" > /tmp/sysinfo/light_type
		echo "1" > /tmp/sysinfo/chip_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "1" > /tmp/sysinfo/ssid_type
		;;
	cf-ac1200)
		touch /tmp/sysinfo/repeater
		echo "1" > /tmp/sysinfo/light_type
		echo "1" > /tmp/sysinfo/chip_type
		echo "mtk" > /tmp/sysinfo/driver_tpye
		echo "1" > /tmp/sysinfo/ssid_type
		;;
	*)
		echo 25 >> /tmp/sysinfo/txpower
		;;
	esac

	ramips_hwinfo
	hwinfo
}

ramips_board_name() {
	local name

	[ -f /tmp/sysinfo/board_name ] && name=$(cat /tmp/sysinfo/board_name)
	[ -z "$name" ] && name="unknown"

	echo "${name%-[0-9]*M}"
}
