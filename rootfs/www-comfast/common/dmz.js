define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, dmz_info;

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

        f.getDmzInfo(function (data) {
            if (data.errCode == 0) {
                dmz_info = data.dmz;
                refresh_dmz();
            }
        });
    }

    function refresh_dmz() {
        if (dmz_info) {
            d("#dmz_switch").val(dmz_info.enable || "0");
            if (dmz_info.enable == "0" || !dmz_info.enable) {
                d("#dmz_ip_src").attr("disabled", true);
            } else {
                d("#dmz_ip_src").val(dmz_info.dest_ip || "").removeAttr("disabled");
            }
        }
    }

    et.enableConfig = function () {
        if (d("#dmz_switch").val() == 0) {
            d("#dmz_ip_src").attr("disabled", "true").removeClass('borError');
            d('.onError').remove();
        } else {
            d("#dmz_ip_src").removeAttr("disabled");
        }
    }

    et.doResetConfig = function () {
        d(".onError").remove();
        d("#dmz_ip_src").val("").removeClass("borError");
        refresh_dmz();
    }

    et.set_config = function () {
        var a = {};
        if (!g.volide_ok('.shbox')) {
            g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            return;
        }
        a.enable = d("#dmz_switch").val();
        if (a.enable == "1") {
            a.dest_ip = d("#dmz_ip_src").val();
        }
        dmz_set(a);
    }

    function dmz_set(arg) {
        f.setDmzInfo(arg, function (data) {
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
