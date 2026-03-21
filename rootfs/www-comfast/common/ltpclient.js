define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, lock_web = false, l2tp;

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

        f.getLTPclient(function (data) {
            if (data && data.errCode == 0) {
                l2tp = data.l2tp;
                refresh_remote();
            }
        });
    }

    function refresh_remote() {
        if (l2tp) {
            d("#remote_switch").val(l2tp.enable);
            d("#username").val(l2tp.username || '');
            d('#passwd').val(l2tp.password || '');
            d("#server").val(l2tp.server);

            if (l2tp.enable == "0" || !l2tp.enable) {
                d("#username").attr("disabled", true);
                d("#passwd").attr("disabled", true);
                d("#server").attr("disabled", true);
            }
            if (l2tp.connected && l2tp.connected == 1) {
                d("#pptp_status").html(eval('SHpack.link_status_up')[nowLang])
            } else {
                if(l2tp.enable == "1"){
                    d("#pptp_status").html(eval('SHpack.link_status_linking')[nowLang])
                }else {
                    d("#pptp_status").html(eval('SHpack.no_on')[nowLang])
                }
            }
            if (l2tp.l2tp_client_address) {
                d("#pptp_ip").html(l2tp.l2tp_client_address);
            } else {
                d("#pptp_ip").html(eval('SHpack.unassigned')[nowLang])
            }
        }
    }

    et.remote_change = function () {
        if (d("#remote_switch").val() == "0") {
            d('.borError').val('').removeClass('borError');
            d('.onError').remove();
            d("#username").attr("disabled", true);
            d('#passwd').attr("disabled", true);
            d("#server").attr("disabled", true);
        } else {
            d("#username").attr("disabled", false);
            d("#passwd").attr("disabled", false);
            d("#server").attr("disabled", false);
        }
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
        arg.enable = d("#remote_switch").val();

        if (device.mwan == "1") {
            arg.metric = "110";
        }

        if (arg.enable == 1) {
            arg.username = d("#username").val();
            arg.password = d("#passwd").val();
            arg.server = d("#server").val();
        }
        console.log(arg)
        return arg;
    }

    function set_config(arg) {
        f.setLTPclient(arg, function (data) {
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
