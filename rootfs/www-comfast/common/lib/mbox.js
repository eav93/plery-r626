define(function (require, exports) {
    var e = require("util"),
        m = require("external"),
        g = "mbox_container";

    var packsrc, devinfo = {};

    exports.plugInit = function (arg, callback) {
        m.init();
        k(arg);
        readylanguage(callback);
    };

    exports.replacetext = function (data) {
        document.querySelectorAll('[sh_lang]').forEach(function (obj) {
            var langID = obj.getAttribute('sh_lang');
            var txt = eval('(' + langID + ')');
            var ntxt;
            if (obj.getAttribute('type') === 'text' || obj.getAttribute('type') === 'password') {
                obj.placeholder = txt[data];
                obj.classList.add('placeholder');
                return;
            } else if (obj.innerHTML !== '' && obj.getAttribute('insert') !== null) {
                ntxt = txt[data] + obj.innerHTML;
                obj.innerHTML = ntxt;
                return;
            } else {
                obj.innerHTML = txt[data];
            }
        });
        document.querySelectorAll('[sh_title]').forEach(function (obj) {
            var langID = obj.getAttribute('sh_title');
            var txt = eval('(' + langID + ')');
            obj.setAttribute('title', txt[data]);
        });
        reqtip();
    };

    function k(a) {
        if (!a) { a = {}; }
        var container = document.getElementById(g);
        if (!container) return;
        var handler = n(a);
        container.addEventListener('click', handler);
        container.addEventListener('change', handler);
    }

    function n(a) {
        function isContainer(element) {
            return element ? element.id === g : false;
        }
        return function (c) {
            var el = c.target;
            var tagName = el.tagName.toLowerCase();
            var f;
            if (tagName === 'p' || tagName === 'a' || tagName === 'i' || tagName === 'img' ||
                tagName === 'span' || tagName === 'label' || tagName === 'input' ||
                tagName === 'div' || tagName === 'td') {
                f = el.getAttribute('et');
                if (f && f.indexOf(c.type) === 0) {
                    a[f.split(':')[1]](el);
                }
            } else {
                c.preventDefault();
                f = el.getAttribute('et');
                if (!f) {
                    while (!f && !isContainer(el)) {
                        el = el.parentElement;
                        if (!el) break;
                        f = el ? el.getAttribute('et') : null;
                    }
                }
                if (f && f.indexOf(c.type) === 0) {
                    a[f.split(':')[1]](el);
                }
            }
        };
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
        });
    }

    function export_script(callback) {
        var script = document.createElement('script');
        script.src = packsrc;
        script.onload = function () {
            exports.replacetext(devinfo.language.language);
            if (callback) callback(devinfo);
        };
        document.head.appendChild(script);
    }

    function reqtip() {
        document.querySelectorAll('.place').forEach(function (el) {
            if (el.value != '') {
                if (el.parentElement) {
                    el.parentElement.querySelectorAll('.tip').forEach(function (tip) {
                        tip.classList.add('hide');
                    });
                }
            }
        });
        document.querySelectorAll('.place .tip').forEach(function (tip) {
            tip.addEventListener('click', function () {
                tip.classList.add('hide');
                var input = tip.parentElement.querySelector('input');
                if (input) input.focus();
            });
        });
        document.querySelectorAll('.place input').forEach(function (input) {
            input.addEventListener('focus', function () {
                var tip = input.parentElement.querySelector('.tip');
                if (tip) tip.classList.add('hide');
            });
            input.addEventListener('blur', function () {
                if (input.value === '') {
                    var tip = input.parentElement.querySelector('.tip');
                    if (tip) tip.classList.remove('hide');
                }
            });
        });
    }
});
