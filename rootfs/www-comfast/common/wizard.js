define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        g = require("function"),
        nowLang,
        et = {};

    var device;

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    function start_model(data) {
        nowLang = data.language.language;
        device = d('body').attr('device');
        g.common(nowLang, device);
        tips();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    function tips() {
        var topsize;
        if (d(window).height() > (d('.wizards').outerHeight() + 100 )) {
            topsize = (d(window).height() - d('.wizards').outerHeight() - 100) / 2;
            d('.wizards').css({'top': topsize + 'px'})
        }
    }

    et.gostep2 = function () {
        d('.step2').addClass('show').siblings().removeClass('show');
    }
    et.gostep3 = function () {
        d('.step3').addClass('show').siblings().removeClass('show');
    }
    et.guideback = function () {
        var index = d('[class^=step].show').index();
        if (index) {
            var obj = '.step' + index;
            d(obj).addClass('show').siblings().removeClass('show');
        } else {
            history.go(-1);
            location.href = document.referrer;
        }

    };

    et.prev = function () {
        location.href = 'index.html';
    };

    et.skipped = function () {
        window.location.href = 'index.html';
    };

});