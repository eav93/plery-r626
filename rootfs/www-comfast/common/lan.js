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
        g.volide('.shbox_border', nowLang, device);
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    function refresh_init() {
        var martop;
        martop = (d(window).height() - d('.set_seat').height() - 100) / 2;
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
        if (lan_info) {

            g.setvalue('#lan_ip_id', lan_info.ipaddr);
            g.setvalue('#lan_netmask_id', lan_info.netmask || "255.255.255.0");
            g.setvalue('#dhcp_start_addr', lan_info.start);
            g.setvalue('#dhcp_limit_addr', lan_info.limit);

            if (location.host == lan_info.ipaddr) {
                link_type = 'lan';
            } else {
                link_type = 'wan';
            }

            if (lan_info.leasetime.indexOf("h") > -1) {
                var time = parseInt(lan_info.leasetime.split("h")[0]) * 60;
                g.setvalue('#dhcp_time', time);
            } else {
                g.setvalue('#dhcp_time', lan_info.leasetime / 60);
            }

            g.setvalue('#dhcp_domain', lan_info.domain);
            if (lan_info.ignore == "0" || lan_info.ignore == "") {
                d("#dhcp_id").val("1");
            } else {
                d("#dhcp_id").val("0");
            }
            if (wan_info.workmode == "ap" || wan_info.workmode == "wds" || wan_info.workmode == "wds_c" || wan_info.workmode == "mesh") {
                d("#dhcp_id").val("0");
                d("#dhcp_id").attr("disabled", true);
            }
            et.disabledhcp();
        }
    }

    et.disabledhcp = function () {
        if (d("#dhcp_id").val() == "0") {
            d("#dhcp_start_addr").attr("disabled", true).removeClass("borError");
            d("#dhcp_limit_addr").attr("disabled", true).removeClass("borError");
            d("#dhcp_time").attr("disabled", true).removeClass("borError");
            d("#dhcp_domain").attr("disabled", true).removeClass("borError");
            d(".onError").remove();
        } else {
            d("#dhcp_start_addr").attr("disabled", false);
            d("#dhcp_limit_addr").attr("disabled", false);
            d("#dhcp_time").attr("disabled", false);
            d("#dhcp_domain").attr("disabled", false);
        }
    }

    et.prev = function () {
        location.href = 'index.html';
    }

    et.setmode = function () {
        if (!g.volide_ok('.shbox_border')) {
            return;
        }

        config.lan.ipaddr = d('#lan_ip_id').val();
        config.lan.netmask = g.trim_select(d('#lan_netmask_id').val());
        if (d("#dhcp_id").val() == "1") {
            config.lan.enable = true;
        } else {
            config.lan.enable = false;
        }

        config.lan.start = d("#dhcp_start_addr").val();
        config.lan.limit = d("#dhcp_limit_addr").val();
        config.lan.leasetime = '' + d("#dhcp_time").val() * 60;
        config.lan.domain = d("#dhcp_domain").val();

        set_config(config);
    }

    function set_config(arg) {
        if (setflag) {
            return;
        }
        setflag = '1';
        f.setLanConfig(arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(30,gohref);
            }
        });
    }

    function gohref() {
        if (link_type == 'lan') {
            location.href = 'http://' + d('#lan_ip_id').val() + '/' + device + '/index.html';
        } else {
            location.href = location.href;
        }
    }
});
