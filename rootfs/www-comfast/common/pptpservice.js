define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, lock_web = false, pptp_info;

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    function start_model(data) {
        nowLang = data.language.language;
        device = d('body').attr('device');
        g.common(nowLang, device);
        g.volide('.shbox', nowLang, device);
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
        })
    }

    et.prev = function () {
        location.href = 'index.html';
    }

    function refresh_init() {

        var martop;
        martop = (d(window).height() - d('.set_seat').height() - 180) / 2;
        d('.set_seat').css({'top': martop + 'px'});

        f.getPPTPservice(function (data) {
            if (data && data.errCode == 0) {
                pptp_info = data.pptpd;
                refresh_remote();
            }
        });
    }

    function refresh_remote() {
        if (pptp_info) {
            if (!pptp_info.enabled) pptp_info.enabled = "0"

            var remoteip = pptp_info.remoteip || '';
            var remoteiparray = remoteip ? remoteip.split("-") : '';
            var remoteip_prefix = remoteiparray ? remoteiparray[0].substring(0, remoteiparray[0].lastIndexOf('.')) : '';
            var remoteipstop = remoteiparray ? (remoteip_prefix + '.' + remoteiparray[1]) : ''

            disabled_all(pptp_info.enabled);
            d("#switch").val(pptp_info.enabled);
            g.setvalue('#localip', pptp_info.localip || '');
            g.setvalue('#startip', remoteiparray[0] || '');
            g.setvalue('#endip', remoteipstop || '');
            g.setvalue('#dns_main', pptp_info.msdns1 || '');
            g.setvalue('#dns_backup', pptp_info.msdns2 || '');
            g.setvalue('#mtu', pptp_info.mtu || '');
            g.setvalue('#mru', pptp_info.mru || '');
        }
    }

    function disabled_all(data) {
        if (data == 1) {
            d('.main-box-body input').attr('disabled', false);
            d('#line').attr('disabled', false);
        } else {
            d('.main-box-body input').attr('disabled', true);
            d('#line').attr('disabled', true);
        }
    }

    et.enableConfig = function (evt) {
        disabled_all(d(evt).val());
    };

    function ip2int(IP) {
        return parseInt(IP.replace(/\d+\.?/ig, function (a) {
            a = parseInt(a);
            return (a > 15 ? "" : "0") + a.toString(16);
        }), 16);
    }

    et.save = function () {
        if (!g.format_volide_ok()) {
            return;
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = set_volide()) {
            d('#closewin').click();
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    function set_volide() {
        var arg = {};
        var remoteipstart, remoteipstop, remoteipnum, remoteip, remoteipstart_prefix, remoteipstop_prefix;
        arg.enabled = d("#switch").val();
        if (device.mwan == "0") {
            // do nothing
        } else {
            arg.metric = "100";
        }
        if (arg.enabled == 1) {
            remoteipstart = d("#startip").val();
            remoteipstop = d("#endip").val();

            if (ip2int(remoteipstart) > ip2int(remoteipstop)) {
                var tmpip = remoteipstart;
                remoteipstart = remoteipstop;
                remoteipstop = tmpip;
            }

            remoteipstart_prefix = remoteipstart.substring(0, remoteipstart.lastIndexOf('.'));
            remoteipstop_prefix = remoteipstop.substring(0, remoteipstop.lastIndexOf('.'));
            if (remoteipstart_prefix != remoteipstop_prefix) {
                g.shconfirm(nowLang, SHtips.pptpd_server_remoteip_not_network[nowLang], "error");
                return null
            }

            remoteipnum = remoteipstop.substring(remoteipstop.lastIndexOf('.'));
            remoteip = remoteipstart + '-' + remoteipnum.substring(1);

            arg.localip = d("#localip").val();
            arg.remoteip = remoteip;
            arg.msdns1 = d("#dns_main").val();
            arg.msdns2 = d("#dns_backup").val();
            arg.mtu = d("#mtu").val();
            arg.mru = d("#mru").val();
        }

        return arg;
    }

    function set_config(arg) {
        f.setPPTPservice(arg, function (data) {
            if (data.errCode != 0) {
                lock_web = false;
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(10,gohref);
            }
        })
    }

    function gohref() {
        window.location.href = location.href;
    }
});
