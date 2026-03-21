define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    require("slideControl")(d);

    var device;

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
        g.chgTabs('radio_tabs', 'radio_boxs');
        page_init();
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    function page_init() {
        d('.select li').on('click tap', function () {
            if (nowLang == d(this).attr('data-value')) {
                return;
            }
            nowLang = d(this).attr('data-value');
            g.setlanguage(d(this).attr('data-value'));
        })
    }

    function refresh_init() {
        var radioHtml = '';
        f.getguide(function (data) {
            if (data.errCode == '0') {
                for (var n = 0; n < data.radios.length; n++) {
                    if (data.radios[n].hwmode.indexOf('a') > -1) {
                        radioHtml += '<option value="' + n + '">5.8GHz</option>';
                    } else {
                        radioHtml += '<option value="' + n + '">2.4GHz</option>';
                    }
                }
                d("#radio").html(radioHtml);

                f.getprobeserver(function (data) {
                    if (data && data.errCode == 0 && data.probe.server != '') {
                        var probe_array = data.probe.server.split(':');
                        d('#remote_switch').val(data.probe.enabled)
                        d('#radio').val(data.probe.frequency || 0)
                        d('#probe_addr').val(probe_array[0]);
                        d('#probe_port').val(probe_array[1]);
                    }
                })
            }
        })

    }

    et.saveConfig = function () {

        if (!g.volide_ok('.shbox_border')) {
            return;
        }

        var arg = {};
        var tmp_addr = d('#probe_addr').val();
        var tmp_port = d('#probe_port').val();
        arg.enabled = d('#remote_switch').val();
        arg.frequency = d('#radio').val();
        arg.server = tmp_addr + ':' + tmp_port;
        f.setprobeserver(arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(2, gohref);
            }
        });
    };

    function gohref() {
        location.href = location.href;
    }

});