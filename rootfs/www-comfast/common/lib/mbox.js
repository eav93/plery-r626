define(function (require, exports) {
    var d = require("jquery"),
        e = require("util"),
        m = require("external"),
        g = "mbox_container";

    var packsrc, devinfo = {};

    exports.plugInit = function (arg, callback) {
        m.init();
        k(arg);
        readylanguage(callback);
    };

    exports.replacetext = function (data) {
        d("[sh_lang]").each(function (index, obj) {
            var langID = d(obj).attr('sh_lang');
            var txt = eval('(' + langID + ')');
            var ntxt;
            if (d(obj).attr('type') == 'text' || d(obj).attr('type') == 'password') {
                d(obj).attr('placeholder', txt[data]).addClass('placeholder');
                return;
            } else if (d(obj).html() != '' && typeof(d(obj).attr('insert')) != 'undefined') {
                ntxt = txt[data] + d(obj).html();
                d(obj).empty().html(ntxt);
                return;
            } else {
                d(obj).html(txt[data]);
            }
        });
        d("[sh_title]").each(function (index, obj) {
            var langID = d(obj).attr('sh_title');
            var txt = eval('(' + langID + ')');
            d(obj).attr('title', txt[data]);
        });
        reqtip();
    };

    function k(a) {
        if (!a) {
            a = {}
        }
        d("#" + g).on("click change tap", n(a));
    }

    function n(a) {
        function b(a) {
            if (a) {
                return d(a).attr("id") === g
            }
            return false
        }

        return function (c) {
            var e = d(c.target),
                f,
                tagNameTest = e[0].tagName.toLowerCase();
            if (e && ((tagNameTest === "p") || (tagNameTest === "a") || (tagNameTest === "i") || (tagNameTest === "img") || (tagNameTest === "span") || (tagNameTest === "label") || (tagNameTest === "input") || (tagNameTest === "div") || (tagNameTest === "td"))) {
                f = e.attr("et");
                if (f && f.indexOf(c.type) === 0) {
                    a[f.split(":")[1]](e)
                }
            } else {
                c.preventDefault();
                f = e.attr("et");
                if (!f) {
                    while (!f && !b(e)) {
                        e = e.parent();
                        f = e.attr("et")
                    }
                }
                if (f && f.indexOf(c.type) === 0) {
                    a[f.split(":")[1]](e)
                }
            }
        }
    }

    function readylanguage(callback) {
        e.getSConfig("language", "", function (data) {
            if (data.errCode == '0') {
                devinfo.language = {};
                devinfo.language.language = data.language.language;
                devinfo.changed = data.language.changed;
                devinfo.upgrade_time = data.capability.upg_t;
                devinfo.ip = data.capability.ip;
                devinfo.reboor_time = data.capability.r_t;
                devinfo.reset_time = data.capability.f_t;
            } else {
                devinfo.language = 'cn';
            }
            packsrc = '/js/language.js';
            export_script(callback);
        })
    }

    function export_script(callback) {
        d.getScript(packsrc, function (data) {
            exports.replacetext(devinfo.language.language);
            if (callback) callback(devinfo);
        })
    }

    function reqtip() {
        d('.place').each(function () {
            if (d(this).val() != '') {
                d(this).siblings('.tip').addClass('hide');
            }
        });
        d('.place .tip').on('click', function () {
            d(this).addClass('hide');
            d(this).siblings('input').focus();
        });
        d('.place input').focus(function () {
            d(this).siblings('.tip').addClass('hide');
        });
        d('.place input').blur(function () {
            if (d(this).val() == '') {
                d(this).siblings('.tip').removeClass('hide');
            }
        })
    }
});