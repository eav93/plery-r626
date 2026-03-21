define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    require("checkbox")(d);
    require("upload")(d);

    var device,setflag = 0,version_info;

    exports.init = function() {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
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

    et.factory_reset = function () {
        g.shconfirm(nowLang,SHtips.factory_sure[nowLang], 'confirm', {
            onOk: function () {
                f.setReset(function () {
                    g.setting(90, SHpack['tip'][nowLang], godefaul);
                });
            }
        });
    }

    d('#backup_file').change(function () {
        setTimeout(function () {
            d('#backup_file_btn').click();
        },1000)
    })

    et.set_setting = function () {
        if (d("#backup_file").val().match(/\.file$|\.FILE$/i) == null) {
            g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            return false;
        }
        d("#backup_file").upload({
            url: '/cgi-bin/mbox-config?method=SET&section=system_load_config',
            onComplate: function (data) {
                if (data && data.errCode != 0) {
                    g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
                } else {
                    g.setting(90, SHpack['tip'][nowLang], gopath);
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
        form.attr("target", 'backdown_iframe').attr('action','/cgi-bin/mbox-config?method=GET&section=system_config_backup');

        iframe.appendTo("body");
        form.appendTo(iframe);
        form.submit();
    }

    et.system_uploadfile = function () {
        if (d("#firmware_upg").val().match(/\.bin$|\.BIN$/i) == null) {
            g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            return;
        }
        d("#firmware_upg").upload({
            url: '/cgi-bin/mbox-config?method=SET&section=system_upgrade_keep',
            onComplate: function (data) {
                if (data && data.errCode != 0) {
                    g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
                } else {
                    g.setting(180, SHpack['tip'][nowLang], gopath);
                }
            }
        });
        d("#firmware_upg").upload("ajaxSubmit");
    }

    d("#firmware_upg").change(function () {
        d("#firmware_upg_text").html(getFileName(d("#firmware_upg").val()));
    });

    function getFileName(str){
        var reg = /[^\\\/]*[\\\/]+/g;
        str = str.replace(reg,'');
        return str;
    }

    et.set_system_upgrade = function () {
        d("#firmware_upg").upload({
            url: '/cgi-bin/mbox-config?method=SET&section=system_upgrade_keep',
            onComplate: function (data) {
                if (data && data.errCode != 0) {
                    g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
                } else {
                    g.setting(180, SHpublic['tip'][nowLang], gopath);
                }
            }
        });
        d("#firmware_upg").upload("ajaxSubmit");
    }

    et.reboot = function () {
        g.shconfirm(nowLang,SHpack.reboot[nowLang], 'confirm', {
            onOk: function () {
                f.setReboot(function () {
                    g.setting(60, SHpack['tip'][nowLang], gopath);
                });
            }
        });
    };

    function godefaul() {
        window.location.href = 'http://192.168.0.1/login.html';
    }

    function gopath() {
        window.location.href = 'http://'+location.hostname;
    }
})
