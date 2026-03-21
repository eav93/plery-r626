define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    require("upload")(d);

    var device, device_config;

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    function start_model(data) {
        device_config = data;
        nowLang = data.language.language;
        device = d('body').attr('device');
        g.common(nowLang, device);
        page_init();
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    et.prev = function () {
        location.href = 'index.html';
    };

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
    
        f.get_hb_status(function (data) {
            if (data.errCode == 0) {
                d('#hb_switch').val(data.heart_beat.hb_enable)
            }
        });
    }

    et.factory_reset = function () {
        g.shconfirm(nowLang, SHtips.factory_sure[nowLang], 'confirm', {
            onOk: function () {
                g.loading_box(SHpack['tip'][nowLang]);
                f.setReset(function (data) {
                    if (data && data.errCode != 0) {
                        g.animationWidth(0, function () {
                            g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
                        });
                    } else {
                        g.animationWidth(device_config.reset_time, godefault);
                    }
                });
            }
        });
    };

    d('#backup_file').change(function () {
        setTimeout(function () {
            d('#backup_file_btn').click();
        }, 1000)
    });

    et.hb_change = function () {
        var config = {};
        config.hb_enable = d('#hb_switch').val();
        set_config(config);
    };

    function set_config(arg) {
        f.setSConfig("heart_beat", arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.shconfirm(nowLang, SHtips.set_ok[nowLang], "success");
            }
        })
    }

    et.set_setting = function () {
        if (d("#backup_file").val().match(/\.file$|\.FILE$/i) == null) {
            g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            return false;
        }
        g.loading_box(SHpack['tip'][nowLang]);
        d("#backup_file").upload({
            url: '/cgi-bin/mbox-config?method=SET&section=system_load_config',
            onComplate: function (data) {
                if (data && data.errCode != 0) {
                    g.animationWidth(0, function () {
                        g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
                    });
                } else {
                    g.animationWidth(device_config.reset_time, gopath);
                }
            }
        });
        d("#backup_file").upload("ajaxSubmit");
    };

    et.get_setting = function () {
        setSystemConfig();
    };

    function setSystemConfig() {
        var iframe = d('<iframe style="position:absolute;top:-9999px" ></iframe>').attr('name', 'backdown_iframe');
        var form = d('<form method="post" style="display:none;" enctype="multipart/form-data" />').attr('name', 'backdown_form');
        form.attr("target", 'backdown_iframe').attr('action', '/cgi-bin/mbox-config?method=GET&section=system_config_backup');

        iframe.appendTo("body");
        form.appendTo(iframe);
        form.submit();
    }

    function godefault() {
        window.location.href = 'http://192.168.0.1/login.html';
    }

    function gopath() {
        window.location.href = 'http://' + location.hostname;
    }

})
