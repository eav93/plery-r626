#!/bin/ash

. /lib/functions.sh
. /usr/share/libubox/jshn.sh

json_select_array() {
	local _json_no_warning=1

	json_select "$1"
	[ $? = 0 ] && return

	json_add_array "$1"
	json_close_array

	json_select "$1"
}

json_select_object() {
	local _json_no_warning=1

	json_select "$1"
	[ $? = 0 ] && return

	json_add_object "$1"
	json_close_object

	json_select "$1"
}

_ucidef_set_interface() {
	local name="$1"
	local iface="$2"
	local proto="$3"

	json_select_object "$name"
	json_add_string ifname "$iface"

	if ! json_is_a protocol string || [ -n "$proto" ]; then
		case "$proto" in
			static|dhcp|none|pppoe) : ;;
			*)
				case "$name" in
					lan) proto="static" ;;
					wan) proto="dhcp" ;;
					*) proto="none" ;;
				esac
			;;
		esac

		json_add_string protocol "$proto"
	fi

	json_select ..
}

ucidef_set_board_id() {
	json_select_object model
	json_add_string id "$1"
	json_select ..
}

ucidef_set_model_name() {
	json_select_object model
	json_add_string name "$1"
	json_select ..
}

ucidef_set_interface_lan() {
	json_select_object network
	_ucidef_set_interface lan "$@"
	json_select ..
}

ucidef_set_interface_wan() {
	json_select_object network
	_ucidef_set_interface wan "$@"
	json_select ..
}

ucidef_set_interfaces_lan_wan() {
	local lan_if="$1"
	local wan_if="$2"

	json_select_object network
	_ucidef_set_interface lan "$lan_if"
	_ucidef_set_interface wan "$wan_if"
	json_select ..
}

ucidef_set_interface_raw() {
	json_select_object network
	_ucidef_set_interface "$@"
	json_select ..
}

_ucidef_add_switch_port() {
	# inherited: $num $device $need_tag $want_untag $role $index $prev_role
	# inherited: $n_cpu $n_ports $n_vlan $cpu0 $cpu1 $cpu2 $cpu3 $cpu4 $cpu5

	n_ports=$((n_ports + 1))

	json_select_array ports
		json_add_object
			json_add_int num "$num"
			[ -n "$device"     ] && json_add_string  device     "$device"
			[ -n "$need_tag"   ] && json_add_boolean need_tag   "$need_tag"
			[ -n "$want_untag" ] && json_add_boolean want_untag "$want_untag"
			[ -n "$role"       ] && json_add_string  role       "$role"
			[ -n "$index"      ] && json_add_int     index      "$index"
		json_close_object
	json_select ..

	# record pointer to cpu entry for lookup in _ucidef_finish_switch_roles()
	[ -n "$device" ] && {
		export "cpu$n_cpu=$n_ports"
		n_cpu=$((n_cpu + 1))
	}

	# create/append object to role list
	[ -n "$role" ] && {
		json_select_array roles

		if [ "$role" != "$prev_role" ]; then
			json_add_object
				json_add_string role "$role"
				json_add_string ports "$num"
			json_close_object

			prev_role="$role"
			n_vlan=$((n_vlan + 1))
		else
			json_select_object "$n_vlan"
				json_get_var port ports
				json_add_string ports "$port $num"
			json_select ..
		fi

		json_select ..
	}
}

_ucidef_finish_switch_roles() {
	# inherited: $name $n_cpu $n_vlan $cpu0 $cpu1 $cpu2 $cpu3 $cpu4 $cpu5
	local index role roles num device need_tag want_untag port ports

	json_select switch
		json_select "$name"
			json_get_keys roles roles
		json_select ..
	json_select ..

	for index in $roles; do
		eval "port=\$cpu$(((index - 1) % n_cpu))"

		json_select switch
			json_select "$name"
				json_select ports
					json_select "$port"
						json_get_vars num device need_tag want_untag
					json_select ..
				json_select ..

				if [ $n_vlan -gt $n_cpu -o ${need_tag:-0} -eq 1 ]; then
					num="${num}t"
					device="${device}.${index}"
					switch=$name
				fi

				json_select roles
					json_select "$index"
						json_get_vars role ports
						json_add_string ports "$ports $num"
						json_add_string device "$device"
						json_add_string switch "$switch"
					json_select ..
				json_select ..
			json_select ..
		json_select ..

		json_select_object network
			local devices

			json_select_object "$role"
				# attach previous interfaces (for multi-switch devices)
				json_get_var devices ifname
				if ! list_contains devices "$device"; then
					devices="${devices:+$devices }$device"
				fi
			json_select ..

			_ucidef_set_interface "$role" "$devices"
		json_select ..
	done
}

ucidef_add_switch() {
	local name="$1"; shift
	local reset="$1"; shift
	local enable="$1"; shift
	local port num role device index need_tag prev_role
	local cpu0 cpu1 cpu2 cpu3 cpu4 cpu5
	local n_cpu=0 n_vlan=0 n_ports=0

	json_select_object switch
		json_select_object "$name"
			json_add_boolean enable "$enable"
			json_add_boolean reset "$reset"

			for port in "$@"; do
				case "$port" in
					[0-9]*@*)
						num="${port%%@*}"
						device="${port##*@}"
						need_tag=0
						want_untag=0
						[ "${num%t}" != "$num" ] && {
							num="${num%t}"
							need_tag=1
						}
						[ "${num%u}" != "$num" ] && {
							num="${num%u}"
							want_untag=1
						}
					;;
					[0-9]*:*:[0-9]*)
						num="${port%%:*}"
						index="${port##*:}"
						role="${port#[0-9]*:}"; role="${role%:*}"
					;;
					[0-9]*:*)
						num="${port%%:*}"
						role="${port##*:}"
					;;
				esac

				if [ -n "$num" ] && [ -n "$device$role" ]; then
					_ucidef_add_switch_port
				fi

				unset num device role index need_tag want_untag
			done
		json_select ..
	json_select ..

	_ucidef_finish_switch_roles
}

# switch0 lan/wan ports device
# switch0 lan "0 5t" "eth1.1"
ucidef_add_switch_vlan() {
	local name="$1"; shift
	local role="$1"; shift
	local ports="$1"; shift
	local device="$1"; shift

	json_select_object switch
		json_select_object "$name"
		json_select_array roles
			json_add_object
			[ -n "$role"       ] && json_add_string  role       "$role"
			[ -n "$ports"      ] && json_add_string  ports      "$ports"
			[ -n "$device"     ] && json_add_string  device     "$device"
			json_close_object
		json_select ..
		json_select ..
	json_select ..
}

ucidef_add_switch_attr() {
	local name="$1"
	local key="$2"
	local val="$3"

	json_select_object switch
		json_select_object "$name"

		case "$val" in
			true|false) [ "$val" != "true" ]; json_add_boolean "$key" $? ;;
			[0-9]) json_add_int "$key" "$val" ;;
			*) json_add_string "$key" "$val" ;;
		esac

		json_select ..
	json_select ..
}

ucidef_add_switch_port_attr() {
	local name="$1"
	local port="$2"
	local key="$3"
	local val="$4"
	local ports i num

	json_select_object switch
	json_select_object "$name"

	json_get_keys ports ports
	json_select_array ports

	for i in $ports; do
		json_select "$i"
		json_get_var num num

		if [ -n "$num" ] && [ $num -eq $port ]; then
			json_select_object attr

			case "$val" in
				true|false) [ "$val" != "true" ]; json_add_boolean "$key" $? ;;
				[0-9]) json_add_int "$key" "$val" ;;
				*) json_add_string "$key" "$val" ;;
			esac

			json_select ..
		fi

		json_select ..
	done

	json_select ..
	json_select ..
	json_select ..
}

ucidef_set_interface_macaddr() {
	local network="$1"
	local macaddr="$2"

	json_select_object network

	json_select "$network"
	[ $? -eq 0 ] || {
		json_select ..
		return
	}

	json_add_string macaddr "$macaddr"
	json_select ..

	json_select ..
}

ucidef_set_interface_def_macaddr() {
	local lan_mac=$1
	local wan_mac=$2
	local wlan0_mac=$3
	local sta_mac=$4
	
	json_select_object network
	json_select lan
	[ $? -eq 0 ] || {
		json_select ..
		return
	}

	json_add_string def_lan_macaddr $1
	json_add_string def_wan_macaddr $2
	json_add_string def_wlan0_macaddr $3
	json_add_string def_wlan1_macaddr $4
	json_add_string def_wlan2_macaddr $5
	json_add_string def_wlan3_macaddr $6
	json_add_string def_wlan4_macaddr $7
	json_add_string def_wlan5_macaddr $8
	json_add_string def_wlan6_macaddr $9
	json_add_string def_wlan7_macaddr $10
	json_add_string def_sta_macaddr $9
	json_add_string def_wlan8_macaddr $11
	json_add_string def_wlan9_macaddr $12
	json_add_string def_wlan10_macaddr $13
	json_add_string def_wlan11_macaddr $14
	json_add_string def_wlan12_macaddr $15
	json_add_string def_wlan13_macaddr $16
	json_add_string def_wlan14_macaddr $17
	json_add_string def_wlan15_macaddr $18
	
	json_select ..
	
	json_select ..

		uci -q batch <<EOF
set network.def_lan_macaddr='$1'
set network.def_wan_macaddr='$2'
set network.def_wlan0_macaddr='$3'
set network.def_sta_macaddr='$4'
set network.def_wlan1_macaddr='$5'
set network.def_wlan2_macaddr='$6'
set network.def_wlan3_macaddr='$7'
set network.def_wlan4_macaddr='$8'
set network.def_wlan5_macaddr='$9'
set network.def_wlan6_macaddr='$10'
set network.def_wlan7_macaddr='$11'
set network.def_wlan8_macaddr='$12'
set network.def_wlan9_macaddr='$13'
set network.def_wlan10_macaddr='$14'
set network.def_wlan11_macaddr='$15'
set network.def_wlan12_macaddr='$16'
set network.def_wlan13_macaddr='$17'
set network.def_wlan14_macaddr='$18'
set network.def_wlan15_macaddr='$19'
EOF
}

ucidef_set_interface_def_macaddr_lan_wan() {
	local lan_mac=$1
	local wan_mac=$2

	json_select_object network
	json_select lan
	[ $? -eq 0 ] || {
		json_select ..
		return
	}

	json_add_string def_lan_macaddr $1
	json_add_string def_wan_macaddr $2

	json_select ..

	json_select ..

		uci -q batch <<EOF
set network.def_lan_macaddr='$1'
set network.def_wan_macaddr='$2'
EOF
}

ucidef_set_wireless_macaddr() {
	local ifname=$1
	local mac=$2

	uci -q batch <<EOF
set wireless.$ifname.macaddr='$mac'
EOF

	case $ifname in
	radio0)
		uci -q batch <<EOF
set wireless.@wifi-iface[0].macaddr='$mac'
set wireless.@wifi-iface[1].macaddr='$3'
set wireless.@wifi-iface[2].macaddr='$4'
set wireless.@wifi-iface[3].macaddr='$5'
set wireless.@wifi-iface[4].macaddr='$6'
set wireless.@wifi-iface[5].macaddr='$7'
set wireless.@wifi-iface[6].macaddr='$8'
set wireless.@wifi-iface[7].macaddr='$9'
EOF
		;;
	radio1)
		uci -q batch <<EOF
set wireless.@wifi-iface[8].macaddr='$mac'
set wireless.@wifi-iface[9].macaddr='$3'
set wireless.@wifi-iface[10].macaddr='$4'
set wireless.@wifi-iface[11].macaddr='$5'
set wireless.@wifi-iface[12].macaddr='$6'
set wireless.@wifi-iface[13].macaddr='$7'
set wireless.@wifi-iface[14].macaddr='$8'
set wireless.@wifi-iface[15].macaddr='$9'
EOF
		;;
	esac
}

ucidef_add_atm_bridge() {
	local vpi="$1"
	local vci="$2"
	local encaps="$3"
	local payload="$4"

	json_select_object dsl
		json_select_object atmbridge
			json_add_int vpi "$vpi"
			json_add_int vci "$vci"
			json_add_string encaps "$encaps"
			json_add_string payload "$payload"
		json_select ..
	json_select ..
}

ucidef_add_adsl_modem() {
	local annex="$1"
	local firmware="$2"

	json_select_object dsl
		json_select_object modem
			json_add_string type "adsl"
			json_add_string annex "$annex"
			json_add_string firmware "$firmware"
		json_select ..
	json_select ..
}

ucidef_add_vdsl_modem() {
	local annex="$1"
	local tone="$2"
	local xfer_mode="$3"

	json_select_object dsl
		json_select_object modem
			json_add_string type "vdsl"
			json_add_string annex "$annex"
			json_add_string tone "$tone"
			json_add_string xfer_mode "$xfer_mode"
		json_select ..
	json_select ..
}

ucidef_set_led_netdev() {
	local cfg="led_$1"
	local name="$2"
	local sysfs="$3"
	local dev="$4"
	local mode="${5:-link tx rx}"

	json_select_object led

	json_select_object "$1"
	json_add_string name "$name"
	json_add_string type netdev
	json_add_string sysfs "$sysfs"
	json_add_string device "$dev"
	json_add_string mode "$mode"
	json_select ..

	json_select ..
}

ucidef_set_led_usbdev() {
	local cfg="led_$1"
	local name="$2"
	local sysfs="$3"
	local dev="$4"

	json_select_object led

	json_select_object "$1"
	json_add_string name "$name"
	json_add_string type usb
	json_add_string sysfs "$sysfs"
	json_add_string device "$dev"
	json_select ..

	json_select ..
}

ucidef_set_led_usbport() {
	local obj="$1"
	local name="$2"
	local sysfs="$3"
	shift
	shift
	shift

	json_select_object led

	json_select_object "$obj"
	json_add_string name "$name"
	json_add_string type usbport
	json_add_string sysfs "$sysfs"
	json_select_array ports
		for port in "$@"; do
			json_add_string port "$port"
		done
	json_select ..
	json_select ..

	json_select ..
}

ucidef_set_led_wlan() {
	local cfg="led_$1"
	local name="$2"
	local sysfs="$3"
	local trigger="$4"

	json_select_object led

	json_select_object "$1"
	json_add_string name "$name"
	json_add_string type trigger
	json_add_string sysfs "$sysfs"
	json_add_string trigger "$trigger"
	json_select ..

	json_select ..
}

ucidef_set_led_switch() {
	local cfg="led_$1"
	local name="$2"
	local sysfs="$3"
	local trigger="$4"
	local port_mask="$5"
	local speed_mask="$6"

	json_select_object led

	json_select_object "$1"
	json_add_string name "$name"
	json_add_string type switch
	json_add_string sysfs "$sysfs"
	json_add_string trigger "$trigger"
	json_add_string port_mask "$port_mask"
	json_add_string speed_mask "$speed_mask"
	json_select ..

	json_select ..
}

ucidef_set_led_portstate() {
	local cfg="led_$1"
	local name="$2"
	local sysfs="$3"
	local port_state="$4"

	json_select_object led

	json_select_object "$1"
	json_add_string name "$name"
	json_add_string type portstate
	json_add_string sysfs "$sysfs"
	json_add_string trigger port_state
	json_add_string port_state "$port_state"
	json_select ..

	json_select ..
}

ucidef_set_led_default() {
	local cfg="led_$1"
	local name="$2"
	local sysfs="$3"
	local default="$4"

	json_select_object led

	json_select_object "$1"
	json_add_string name "$name"
	json_add_string sysfs "$sysfs"
	json_add_string default "$default"
	json_select ..

	json_select ..
}

ucidef_set_led_gpio() {
	local cfg="led_$1"
	local name="$2"
	local sysfs="$3"
	local gpio="$4"
	local inverted="$5"

	echo "$cfg	-- $name -- $sysfs -- $gpio -- $inverted"  > /dev/console

	json_select_object led

	json_select_object "$1"
	json_add_string type gpio
	json_add_string name "$name"
	json_add_string sysfs "$sysfs"
	json_add_string trigger "$trigger"
	json_add_int gpio "$gpio"
	json_add_boolean inverted "$inverted"
	json_select ..

	json_select ..
}

ucidef_set_led_ide() {
	local cfg="led_$1"
	local name="$2"
	local sysfs="$3"

	json_select_object led

	json_select_object "$1"
	json_add_string name "$name"
	json_add_string sysfs "$sysfs"
	json_add_string trigger ide-disk
	json_select ..

	json_select ..
}

__ucidef_set_led_timer() {
	local cfg="led_$1"
	local name="$2"
	local sysfs="$3"
	local trigger="$4"
	local delayon="$5"
	local delayoff="$6"

	json_select_object led

	json_select_object "$1"
	json_add_string type "$trigger"
	json_add_string name "$name"
	json_add_string sysfs "$sysfs"
	json_add_int delayon "$delayon"
	json_add_int delayoff "$delayoff"
	json_select ..

	json_select ..
}

ucidef_set_led_oneshot() {
	__ucidef_set_led_timer $1 $2 $3 "oneshot" $4 $5
}

ucidef_set_led_timer() {
	__ucidef_set_led_timer $1 $2 $3 "timer" $4 $5
}

ucidef_set_led_rssi() {
	local cfg="led_$1"
	local name="$2"
	local sysfs="$3"
	local iface="$4"
	local minq="$5"
	local maxq="$6"
	local offset="$7"
	local factor="$8"

	json_select_object led

	json_select_object "$1"
	json_add_string type rssi
	json_add_string name "$name"
	json_add_string iface "$iface"
	json_add_string sysfs "$sysfs"
	json_add_string minq "$minq"
	json_add_string maxq "$maxq"
	json_add_string offset "$offset"
	json_add_string factor "$factor"
	json_select ..

	json_select ..
}

ucidef_set_rssimon() {
	local dev="$1"
	local refresh="$2"
	local threshold="$3"
	local disabled="$4"

	json_select_object rssimon

	json_select_object "$dev"
	json_add_string dev "$dev"
	[ -n "$refresh" ] && json_add_int refresh "$refresh"
	[ -n "$threshold" ] && json_add_int threshold "$threshold"
	[ -n "$disabled" ] && json_add_boolean disabled "$disabled"
	json_select ..

	json_select ..

}

ucidef_set_wps_led() {
	local sysfs="$1"

	json_select_object wps

	json_select_object "wps_status"
	json_add_string sysfs "$sysfs"
	json_select ..

	json_select ..
}

ucidef_set_repeater_led() {
	local connected="$1"
	local disconnect="$2"

	json_select_object repeater

	json_select_object "repeater_status"
	json_add_string connected "$connected"
	json_add_string disconnect "$disconnect"
	json_select ..

	json_select ..
}


ucidef_add_gpio_switch() {
	local cfg="$1"
	local name="$2"
	local pin="$3"
	local default="${4:-0}"
echo  "$cfg -- $name -- $pin --$default " > /dev/console

	json_select_object gpioswitch
		json_select_object "$cfg"
			json_add_string name "$name"
			json_add_int pin "$pin"
			json_add_int default "$default"
		json_select ..
	json_select ..
}

ucidef_set_led_hotplug() {
	local name="$2"
	local sysfs="$3"
	local dev="$4"
	local mode="${5:-link tx rx}"

	json_select_object ledhotplug

	json_select_object "$1"
	json_add_string name "$name"
	json_add_string type netdev
	json_add_string sysfs "$sysfs"
	json_add_string device "$dev"
	json_add_string mode "$mode"
	json_select ..

	json_select ..
}

ucidef_set_hostname() {
	local hostname="$1"

	json_select_object system
		json_add_string hostname "$hostname"
	json_select ..
}

ucidef_set_ntpserver() {
	local server

	json_select_object system
		json_select_array ntpserver
			for server in "$@"; do
				json_add_string "" "$server"
			done
		json_select ..
	json_select ..
}

board_config_update() {
	json_init
	[ -f ${CFG} ] && json_load "$(cat ${CFG})"

	# auto-initialize model id and name if applicable
	if ! json_is_a model object; then
		json_select_object model
			[ -f "/tmp/sysinfo/board_name" ] && \
				json_add_string id "$(cat /tmp/sysinfo/board_name)"
			[ -f "/tmp/sysinfo/model" ] && \
				json_add_string name "$(cat /tmp/sysinfo/model)"
		json_select ..
	fi
}

board_config_flush() {
	json_dump -i > /tmp/.board.json
	mv /tmp/.board.json ${CFG}
}
