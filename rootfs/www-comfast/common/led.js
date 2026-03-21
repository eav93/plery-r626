define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, setflag = 0, remote_info;

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

    function refresh_init() {

        var martop;
        martop = (d(window).height() - d('.set_seat').height() - 180) / 2;
        d('.set_seat').css({'top': martop + 'px'});

        f.getledstatus(function (data) {
            if (data.errCode == 0) {
                d('#led_switch').val(data.led.status)
            }
        });
    }

    et.prev = function () {
        location.href = 'index.html';
    };

    et.remote_change = function () {
        if (d("#remote_switch").val() == "0") {
            d('.borError').val('').removeClass('borError');
            d('.onError').remove();
            d("#port_src").attr("disabled", true);
            d("#ip_src").attr("disabled", true);
        } else {
            d("#port_src").attr("disabled", false);
            d("#ip_src").attr("disabled", false);
        }
    };

    et.modify_remote = function () {
        var config = {};
        config.setled = d('#led_switch').val();
        set_config(config);
    };

    function set_config(arg) {
        f.setSConfig("led_status", arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.shconfirm(nowLang, SHtips.set_ok[nowLang], "success");
            }
        })
    }

    function gohref() {
        window.location.href = location.href;
    }

})
