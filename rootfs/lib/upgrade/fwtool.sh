fwtool_pre_upgrade() {
	fwtool -q -i /dev/null "$1"
}

fwtool_check_image() {
	return 0
}
