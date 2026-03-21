#!/bin/sh
[ -e /lib/functions.sh ] && . /lib/functions.sh || . ./functions.sh

download=0
qos_enabled=0
qos_enabled_limit=0

rule_num=0
rule_num_count=0

ip=0
downrate=0
uprate=0
share=0

add_tc_class_main()
{
	local iface=$1
	tc qdisc del dev $iface root
	tc qdisc add dev $iface root handle 1: htb r2q 1
}

add_limit()
{
	local name=$1
	local enable

	config_get enable $1 enable
	[ x"$enable" == "x1" ] || return

	config_get ip $1 ip
	config_get downrate $1 downrate
	config_get uprate $1 uprate
	config_get share $1 share
	let downrate_id=$rule_num+1
	let uprate_id=2*$downrate_id+2

	[ "$downrate" -gt 0 ] && {
		tc class add dev br-lan parent 1: classid 1:$downrate_id htb rate ${downrate}kbit ceil ${downrate}kbit prio 2
		tc filter add dev br-lan parent 1: protocol ip u32 match ip dst $ip flowid 1:$downrate_id
	}

	[ "$uprate" -gt 0 ] && {
		tc class add dev br-lan parent 1: classid 1:$uprate_id htb rate ${uprate}kbit ceil ${uprate}kbit prio 2
		tc filter add dev br-lan parent 1: protocol ip u32 match ip src $ip flowid 1:$uprate_id
	}

	let rule_num=rule_num+1
}

start_interface()
{
	qos_enabled=`uci -q get common.qos.enable`
	qos_enabled_limit=`uci -q get common.qos.enable_limit`
	rule_num_count=`uci get common.limitlist.list | awk -F"," '{print $1}'`
	if [ "$qos_enabled" != "1" ] && [ "$qos_enabled_limit" != "1" ];then
		exit 0
	fi

	if [ -z "$rule_num_count" ] || [ "$rule_num_count" -eq "0" ]; then
		exit 0
	fi

	add_tc_class_main $1

	config_load common
	config_foreach add_limit rule
}

case "$1" in
	"all")
		start_interface "br-lan"
	;;
	"stop")
		qos_enabled=`uci -q get common.qos.enable`
		qos_enabled_limit=`uci -q get common.qos.enable_limit`
		[ -z "$qos_enabled" ] && [ -z "$qos_enabled_limit" ] && exit 0

		for iface in $(tc qdisc show | grep -E '(htb)' | awk '{print $5}'); do
			tc qdisc del dev "$iface" ingress 2>&- >&-
			tc qdisc del dev "$iface" root 2>&- >&-
		done
	;;
esac
