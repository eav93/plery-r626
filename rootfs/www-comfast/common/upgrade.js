define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    require("checkbox")(d);
    require("upload")(d);

    var device, device_config, version_info;

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

        f.getFirmwareInfo(function (data) {
            version_info = data.firmware;
            refresh_setdefault();
        });
    }

    function refresh_setdefault() {
        if (version_info) {
            d('#current_version').text(version_info.version || "");
        }
    }

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

    d("#firmware_upg").change(function () {
        var bin_name = getFileName(d("#firmware_upg").val());

        if (bin_name.length > 60) {
            d("#firmware_upg_text").html(bin_name.slice(0, 14) + "..." + bin_name.slice(bin_name.length - 10, bin_name.length));
        } else {
            d("#firmware_upg_text").html(bin_name);
        }
    });

    function getFileName(str) {
        var reg = /[^\\\/]*[\\\/]+/g;
        str = str.replace(reg, '');
        return str;
    }

    et.system_uploadfile = function () {
        if (d("#firmware_upg").val().match(/\.bin$|\.BIN$/i) == null) {
            g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            return false;
        }

        g.shconfirm(nowLang, SHpack.upgrade_tip[nowLang], 'confirm', {
            onOk: function () {
                g.loading_box(SHpack['tip'][nowLang]);
                var keepSettings = d('#keep_settings').is(':checked');
                var section = keepSettings ? 'system_upgrade_keep' : 'system_upgrade';
                d("#firmware_upg").upload({
                    url: '/cgi-bin/mbox-config?method=SET&section=' + section,
                    onComplate: function (data) {
                        if (data && data.errCode != 0) {
                            g.animationWidth(0, function () {
                                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
                            });
                        } else {
                            g.animationWidth(device_config.upgrade_time, gopath);
                        }
                    }
                });
                d("#firmware_upg").upload("ajaxSubmit");
            }
        });
    };

    function gopath() {
        window.location.href = 'http://' + location.hostname;
    }
});
