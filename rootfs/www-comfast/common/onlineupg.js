define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    require("checkbox")(d);
    require("upload")(d);

    var device, device_config, ClearTime = 0, installedVersion = '';

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    function start_model(data) {
        device_config = data;
        nowLang = data.language.language;
        device = d('body').attr('device');
        g.common(nowLang, device);
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    et.prev = function () {
        location.href = 'index.html';
    };

    function refresh_init() {
        var martop;
        martop = (d(window).height() - d('.set_seat').height() - 180) / 2;
        d('.set_seat').css({'top': martop + 'px'});

        // Load installed firmware version
        f.getFirmwareInfo(function (data) {
            if (data && data.errCode == 0 && data.firmware) {
                installedVersion = data.firmware.version || '';
                d('#InstalledVersion').html(installedVersion || '-');
            }
        });

        f.getMConfig('ota_status', '', function (data) {
            if (data && data.errCode == 0) {
                initOtaShow(data);
                d('.MCB').MCheckbox();
            }
        });
    }

    function initOtaShow(data) {
        //d("#UpgInfo").show();
        if (!data.upgrade) data.upgrade = {};
        if (!data.fota_status) data.fota_status = {};
        if (!data.upgrage_status) data.upgrage_status = {};
        if (data.upgrade.switch == "1") {//当在线升级为绿色ON时==1
            d("#OnlineSwitch").attr("checked", true);
            d("#ManualDown").hide();
            d("#ClearDown").hide();
            d("#Update").hide();
        } else {//当在线升级为绿色OFF时==0
            d("#OnlineSwitch").attr("checked", false);
            d("#ManualDown").show();
            d("#ClearDown").hide();
            d("#Update").hide();
        }
        show_note(data);
        pollStatus();
    }

    function pollStatus() {
        if (ClearTime) clearTimeout(ClearTime);
        f.getMConfig('ota_status', '', function (data) {
            if (data && data.errCode == 0) {
                show_note(data);
            }
        });
        ClearTime = setTimeout(pollStatus, '3000');
    }

    function show_note(data, flag) {
        if (!data.fota_status) data.fota_status = {};
        if (!data.upgrade) data.upgrade = {};
        if (!data.upgrage_status) data.upgrage_status = {};
        var fota = data.fota_status;
        var ver = fota.fota_version || '';
        var currentInstalled = installedVersion || data.firmware_version || d.trim(d('#InstalledVersion').text()) || '';
        d('#InstalledVersion').html(currentInstalled || '-');
        // New version - only show row when update available
        d('#CurrentVersion').html('');
        d('#NewVersionRow').hide();
        // 5=latest version, 4=network error, 3=new version found (not downloaded), 2=downloading, 1=downloaded ready, 0=idle
        if (fota.fota_status == 5 && ver) {
            d('#UpgTip').html(SHpack.AlreadyNewVersion[nowLang]);
        } else if (fota.fota_status == 4) {
            d('#UpgTip').html(SHpack.NetworkError[nowLang]);
        } else if (fota.fota_status == 2 || fota.fota_status == 3) {
            d('#UpgTip').html(SHpack.CheckNewVersion[nowLang]);
            if (ver) { d('#CurrentVersion').html(ver); d('#NewVersionRow').show(); }
            d("#ManualDown").hide();
            if (data.upgrade.switch != "1") d("#ClearDown").show();
            showProgress(data);
        } else if (fota.fota_status == 1) {
            d('#UpgTip').html(SHpack.NewVersionOK[nowLang]);
            if (ver) { d('#CurrentVersion').html(ver); d('#NewVersionRow').show(); }
            d("#ManualDown").hide();
            d("#ClearDown").hide();
            d("#Update").show();
        } else {
            d('#UpgTip').html('');
            if (data.upgrade.switch != "1") {
                d("#ManualDown").show();
            }
            d("#ClearDown").hide();
            d("#Update").hide();
        }
    }

    function showProgress(data) {
        if (data.upgrage_status.upgrage_status == "ERROR") {
            if (data.upgrade.switch != "1") {
                d('#UpgTip').html(SHpack.NetworkError[nowLang]);
                d("#ManualDown").show();
                d("#ClearDown").hide();
                return;
            } else {
                d('#UpgTip').html(SHpack.NetworkErrorAuto[nowLang]);
            }
        } else {
            d('#UpgTip').html(SHpack.DownloadNote1[nowLang] + data.upgrage_status.upgrage_status + SHpack.DownloadNote2[nowLang]);
        }
    }
	//在线升级按钮OnlineSwitch
    d('.OnlineSwitch').on('click', function () {
        var Param = {};
        var SwitchStatus = d("#OnlineSwitch").attr("checked");
        if (SwitchStatus == "checked") {
            Param.auto_upgrade = "1";
        } else {
            Param.auto_upgrade = "0";
        }

        f.setMConfig('auto_upgrade_switch', Param, function (data) {
            if (data.errCode == 0) {
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(5, gohref);
            }
        });

    });

//检测更新按钮
    et.manual_check = function () {
        var check_arg = {};
        d('#auto_tips').html(SHpack['CheckVersion'][nowLang]);
        check_arg.manual_check = "1";
        d.ajax({
            contentType: "application/json",
            data: JSON.stringify(check_arg),
            dataType: "json",
            success: function (data) {
                show_note(data);
                pollStatus();
            },
            error: function () {
                d('#UpgTip').html(SHpack.NetworkError[nowLang]);
            },
            type: "POST",
            cache: false,
            url: "/cgi-bin/mbox-config?method=GET&section=ota_status"
        })
    }

    et.cancel_down = function () {
        //clearTimeout(ClearTime);
        f.setMConfig('cancel_download', '', function (data) {
            if (data.errCode == 0) {
                //h.ErrorTip(tip_num++, ota_file_not_download);
            } else {
                // g.setting(5, refresh);
            }
        });
    };


    et.online_upgrade = function () {
        f.setMConfig('system_fota_upgrade', '', function (data) {
            if (data.errCode == 0) {
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(device_config.upgrade_time, gohref);
            }
        });
    };

    function gohref() {
        window.location.href = location.href;
    }

    function gopath() {
        window.location.href = 'http://' + location.hostname;
    }
});
