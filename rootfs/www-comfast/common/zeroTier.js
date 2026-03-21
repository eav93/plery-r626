define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('optionwifi'),
        nowLang,
        et = {};

    require("checkbox")(d);

    var device, zerotier = {}

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
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    function refresh_init() {
        var martop;
        martop = (d(window).height() - d('.set_seat').height() - 180) / 2;
        d('.set_seat').css({ 'top': martop + 'px' });
        d('.MCB').MCheckbox();

        f.getMConfig('zerotier_get', '', function (data) {
            if (data && !data.errCode) {
                zerotier = data.zerotier[0]
                refresh_zt()
            }
        });
    }

    function refresh_zt() {
        d("#zt_switch").val(zerotier.enabled || "0")
        d("#zt_value").val(zerotier.join || "")
        d("#zt_nat").val(zerotier.nat || "0")
        d("#zt_port").val(zerotier.port || "9993")
        d("#zt_key").val(zerotier.secret || "")
        d("#zt_config").val(zerotier.copy_config_path || "0")
        et.enableConfig()
    }

    et.enableConfig = function () {
        if (d("#zt_switch").val() == 0) {
            d("#zt_value").attr("disabled", "true").removeClass('borError');
            d("#zt_nat").attr("disabled", "true")
            d('.onError').remove();
        } else {
            d("#zt_value").removeAttr("disabled");
            d("#zt_nat").removeAttr("disabled");
        }
    }


    d('.adv_box').on('click', function () {
        var advbox = d(this).attr('data-value');
        d('.' + advbox).toggleClass('hide');
        if (device == 'computer') {
            g.setmenuheight();
        }
    });

    et.set_config = function () {
        if (!g.volide_ok('.shbox')) {
            g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            return;
        }
        var a = {
            zerotier: {
                enabled: d("#zt_switch").val(),
                join: d("#zt_value").val(),
                nat: d("#zt_nat").val(),
                port: d("#zt_port").val(),
                copy_config_path: d("#zt_config").val()
            }
        }
        if(d("#zt_key").val() != '' && d("#zt_key").val() != zerotier.secret) a.zerotier.secret = d("#zt_key").val()
        zt_set(a);
    }

    function zt_set(arg) {
        f.setMConfig('zerotier_set', arg, function (data) {
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
