define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, ttl_info;

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
        });
    }

    function refresh_init() {
        var martop;
        martop = (d(window).height() - d('.set_seat').height() - 180) / 2;
        d('.set_seat').css({'top': martop + 'px'});

        f.getMConfig('ttl_config', '', function (data) {
            if (data && !data.errCode) {
                ttl_info = data.ttle[0];
                refresh_ttl();
            }
        });
    }

    function refresh_ttl() {
        if (ttl_info) {
            d("#t_switch").val(ttl_info.enable || "0");
            if (ttl_info.enable == "0" || !ttl_info.enable) {
                d("#t_value").attr("disabled", true);
            } else {
                d("#t_value").val(ttl_info.num || "").removeAttr("disabled");
            }
        }
    }

    et.enableConfig = function () {
        if (d("#t_switch").val() == 0) {
            d("#t_value").attr("disabled", "true").removeClass('borError');
            d('.onError').remove();
        } else {
            d("#t_value").removeAttr("disabled");
        }
    }

    et.set_config = function () {
        if (!g.volide_ok('.shbox')) {
            g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            return;
        }
        var a = { ttle: { enable: d("#t_switch").val(), num: d("#t_switch").val() == "1" ? d("#t_value").val() : "" } };
        ttl_set(a);
    }

    function ttl_set(arg) {
        f.setMConfig('ttl_config', arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
				g.animationWidth(30, gohref);
            }
        })
    }
    function gohref() {
        window.location.href = location.href;
    }
});
