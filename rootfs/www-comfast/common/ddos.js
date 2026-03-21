define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, ddos_info;

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    et.prev = function () {
        location.href = 'index.html';
    };
    function start_model(data) {
        nowLang = data.language.language;
        device = d('body').attr('device');
        g.common(nowLang, device);
        page_init();
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    function page_init() {
        d('.select li').on('click', function () {
            if (nowLang == d(this).attr('data-value')) {
                return;
            }
            nowLang = d(this).attr('data-value');
            g.setlanguage(d(this).attr('data-value'));
        });
    }

    function refresh_init() {
        var martop;
        martop = (d(window).height() - d('.set_seat').height() - 120) / 2;
        d('.set_seat').css({'top': martop + 'px'});

        f.getDdosInfo(function (data) {
            if (data.errCode == 0) {
                ddos_info = data.ddos;
                refresh_ddos();
            }
        });
    }

    function refresh_ddos() {
        var enable_ucp, enable_icmp, enable_syn, enable_null, enable_fin, enable_xmas, enable_ping, enable_smurf;
        if (ddos_info) {

            enable_ucp = d('#enable_udp');
            ddos_info.enable_udp_flood ? enable_ucp.attr("checked", true) : enable_ucp.attr("checked", false);

            enable_icmp = d('#enable_icmp');
            ddos_info.enable_icmp_flood ? enable_icmp.attr("checked", true) : enable_icmp.attr("checked", false);

            enable_syn = d('#enable_syn');
            ddos_info.enable_syn_flood ? enable_syn.attr("checked", true) : enable_syn.attr("checked", false);

            enable_null = d('#enable_null');
            ddos_info.enable_null_scan ? enable_null.attr("checked", true) : enable_null.attr("checked", false);

            enable_fin = d('#enable_fin');
            ddos_info.enable_fin_scan ? enable_fin.attr("checked", true) : enable_fin.attr("checked", false);

            enable_xmas = d('#enable_xmas');
            ddos_info.enable_xmas_tree ? enable_xmas.attr("checked", true) : enable_xmas.attr("checked", false);

            enable_ping = d('#enable_ping');
            ddos_info.enable_ping_of_death ? enable_ping.attr("checked", true) : enable_ping.attr("checked", false);

            enable_smurf = d('#enable_smurf');
            ddos_info.enable_smurf ? enable_smurf.attr("checked", true) : enable_smurf.attr("checked", false);

        }
    }

    et.save_ddos = function () {
        var ddos = {};
        var option = {};
        if (d("#enable_udp").is(':checked')) {
            option.enable_udp_flood = 1;
        } else {
            option.enable_udp_flood = 0;
        }
        if (d("#enable_icmp").is(':checked')) {
            option.enable_icmp_flood = 1;
        } else {
            option.enable_icmp_flood = 0;
        }
        if (d("#enable_syn").is(':checked')) {
            option.enable_syn_flood = 1;
        } else {
            option.enable_syn_flood = 0;
        }
        if (d("#enable_null").is(':checked')) {
            option.enable_null_scan = 1;
        } else {
            option.enable_null_scan = 0;
        }
        if (d("#enable_fin").is(':checked')) {
            option.enable_fin_scan = 1;
        } else {
            option.enable_fin_scan = 0;
        }
        if (d("#enable_xmas").is(':checked')) {
            option.enable_xmas_tree = 1;
        } else {
            option.enable_xmas_tree = 0;
        }
        if (d("#enable_ping").is(':checked')) {
            option.enable_ping_of_death = 1;
        } else {
            option.enable_ping_of_death = 0;
        }
        if (d("#enable_smurf").is(':checked')) {
            option.enable_smurf = 1;
        } else {
            option.enable_smurf = 0;
        }
        option.thres_icmp = 1000;
        option.thres_udp = 2000;
        option.thres_syn = 200;
        ddos.ddos = option;
        ddos_set(option);
    }

    function ddos_set(arg) {
        f.setDdosInfo(arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(1,seted);
            }
        });
    }

    function seted() {
        d('.Loadmask').remove();
        d('.Loadbox').remove();
        refresh_init()
    }

});
