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

        f.getRemote(function (data) {
            if (data) {
                remote_info = data;
                refresh_remote();
            }
        });
    }

    function refresh_remote() {
        if (remote_info) {
            d("#remote_switch").val(remote_info.remote.enable);
            d("#port_src").val(remote_info.remote.port);
            d("#ip_src").val(remote_info.remote.ipaddr);

            if (remote_info.remote.enable == "0" || !remote_info.remote.enable) {
                d("#port_src").attr("disabled", true);
                d("#ip_src").attr("disabled", true);
            }
        }
    }

    et.prev = function () {
        location.href = 'index.html';
    }

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
    }

    et.modify_remote = function () {
        if (!g.volide_ok('.shbox_border')) {
            g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            return;
        }
        if (setflag) {
            return
        }
        setflag = 1;
        var config = {};
        config.enable = d("#remote_switch").val();
        config.port = d("#port_src").val();
        config.ipaddr = d("#ip_src").val() || "0.0.0.0";
        set_config(config);
    }

    function set_config(arg) {
        f.setRemote(arg, function (data) {
            if (data.errCode != 0) {
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
