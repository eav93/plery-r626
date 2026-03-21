define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, config, lan_info, radios_info, wan_info, wifis_info, setflag = 0, link_type = '';

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    function start_model(data) {
        nowLang = data.language.language;
        device = d('body').attr('device');
        g.common(nowLang, device);
        g.chgTabs('radio_tabs', 'radio_boxs');
        g.volide('.shbox_border', nowLang, device);
        matic();
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    function refresh_init() {
        var martop;
        martop = (d(window).height() - d('.set_seat').height() - 160) / 2;
        d('.set_seat').css({'top': martop + 'px'});

        f.getguide(function (data) {
            if (data.errCode == 0) {
                config = d.extend(true, {}, data);
                lan_info = data.lan;
                radios_info = data.radios;
                wan_info = data.wan;
                wifis_info = data.wifis;
                refresh_guide();
            }
        });
    }

    function refresh_guide() {
        if (wan_info) {
            var clickprotoid = "#" + wan_info.proto + "_addr_id";

            if (wan_info.mtu != "") {
                g.setvalue('#mtu', wan_info.mtu);
            } else {
                g.setvalue('#mtu', '1492');
            }

            if (location.host == lan_info.ipaddr) {
                link_type = 'lan';
            } else {
                link_type = 'wan';
            }

            g.setvalue('#pppoe_user_id', wan_info.username);
            g.setvalue('#pppoe_pwd_id', wan_info.password);
            g.setvalue('#pppoe_server_id', wan_info.service);
            g.setvalue('#static_ip_id', wan_info.ipaddr);
            g.setvalue('#static_gateway_id', wan_info.gateway);
            g.setvalue('#static_netmask_id', wan_info.netmask || "255.255.255.0");
            g.setvalue('#static_dns_id', wan_info.dns.split(" ")[0]);
            d(clickprotoid).click();
        }
    }

    function matic() {
        d('#static_gateway_id').focus(function () {
            var _this = d(this);
            var ip = d('#static_ip_id').val();
            if (_this.val() == "") {
                if (g.isIpaddr(ip)) {
                    var ipitm = ip.split(".");
                    var gate = ipitm[0] + '.' + ipitm[1] + '.' + ipitm[2] + '.1';
                    _this.val(gate);
                }
            }
        });
    }

    et.prev = function () {
        location.href = 'index.html';
    }

    et.disabledhcp = function () {
        if (d("#dhcp_id").val() == "0") {
            d("#dhcp_start_addr").attr("disabled", true);
            d("#dhcp_limit_addr").attr("disabled", true);
            d("#dhcp_time").attr("disabled", true);
            d("#dhcp_domain").attr("disabled", true);
            d("#dns_id").attr("disabled", true);
        } else {
            d("#dhcp_start_addr").attr("disabled", false);
            d("#dhcp_limit_addr").attr("disabled", false);
            d("#dhcp_time").attr("disabled", false);
            d("#dhcp_domain").attr("disabled", false);
            d("#dns_id").attr("disabled", false);
        }
    }

    function config_get() {
        var wan_config = {};

        wan_config.iface = 'wan';
        wan_config.proto = d("input[name='addr_ip']:checked").val();

        if (wan_config.proto == "dhcp") {
            wan_config.dns = "";
        } else if (wan_config.proto == "pppoe") {
            wan_config.username = d('#pppoe_user_id').val();
            wan_config.password = d('#pppoe_pwd_id').val();
            wan_config.mtu = d('#mtu').val();
            wan_config.service = d('#pppoe_server_id').val();
            wan_config.dns = "";
        } else if (wan_config.proto == "static") {
            wan_config.ipaddr = d('#static_ip_id').val();
            wan_config.netmask = g.trim_select(d('#static_netmask_id').val());
            wan_config.gateway = d('#static_gateway_id').val();
            wan_config.dns = d('#static_dns_id').val();
            if (wan_config.ipaddr == wan_config.gateway) {
                g.shconfirm(nowLang, SHtips.gatewayandip[nowLang], "error");
                return false;
            }
            if (wan_config.ipaddr == wan_config.dns) {
                g.shconfirm(nowLang, SHtips.dnsandip[nowLang], "error");
                return false;
            }
        }
        return wan_config;
    }

    et.setmode = function () {
        var arg;
        if (!g.volide_ok('.shbox_border')) {
            return;
        }
        if (config.wan.workmode.toUpperCase() == "AP") {
            g.shconfirm(nowLang, SHtips.notsetting[nowLang], "confirm");
            return;
        }
        if (arg = config_get()) {
            set_config(arg);
        }
    }

    function set_config(arg) {
        if (setflag) {
            return;
        }
        setflag = '1';
        f.setMConfig("wan_config", arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(30,gohref);
            }
        });
    }

    function gohref() {
        if (link_type == 'wan' && d('#static_ip_id').val() != '') {
            location.href = 'http://' + d('#static_ip_id').val() + '/' + device + '/index.html';
        } else {
            window.location.href = 'http://' + location.hostname + '/' + device + '/index.html';
        }
    }
})
