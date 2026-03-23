#
# Copyright (C) 2010 OpenWrt.org
#

. /lib/ramips.sh

PART_NAME=firmware
RAMFS_COPY_DATA=/lib/ramips.sh

platform_check_image() {
	return 0
}

platform_nand_pre_upgrade() {
	local board=$(ramips_board_name)

	case "$board" in
	ubnt-erx)
		platform_upgrade_ubnt_erx "$ARGV"
		;;
	esac
}

platform_pre_upgrade() {
	local board=$(ramips_board_name)

	case "$board" in
    	ubnt-erx)
		nand_do_upgrade "$ARGV"
		;;
	esac
}

platform_do_upgrade() {
	local board=$(ramips_board_name)

	case "$board" in
	*)
		default_do_upgrade "$ARGV"
		;;
	esac
}

platform_copy_config() {
	jffs2_copy_config
}

disable_watchdog() {
	killall watchdog
	( ps | grep -v 'grep' | grep '/dev/watchdog' ) && {
		echo 'Could not disable watchdog'
		return 1
	}
}

blink_led() {
	. /etc/diag.sh; set_state upgrade
}

append sysupgrade_pre_upgrade disable_watchdog
append sysupgrade_pre_upgrade blink_led
