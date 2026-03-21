define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    require("upload")(d);

    var device, device_config, reboot_info, lock_web = false;

    var weeks_num = ['1', '2', '3', '4', '5', '6', '0'];

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    function start_model(data) {
        device_config = data;
        nowLang = data.language.language;
        device = d('body').attr('device');
        g.common(nowLang, device);
        g.volide('.shbox_border', nowLang, device);
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    et.prev = function () {
        location.href = 'index.html';
    };

    function refresh_init() {
        if (d(window).height() > 600) {
            var martop;
            martop = (d(window).height() - d('.set_seat').height() - 180) / 2;
            d('.set_seat').css({'top': martop + 'px'});
        }
        f.getMConfig('system_timing_reboot', '', function (data) {
            if (data && data.errCode == 0) {
                reboot_info = data.timing_reboot;

                var timing_weeks = reboot_info.timing_weeks;
                if (timing_weeks != '') {
                    checked_week(timing_weeks.split(','));
                }

                d('#time_reboot').val(reboot_info.timing_time);
                d('#reboot_switch').val(reboot_info.timing_enable);
                show_reboot_box(reboot_info.timing_enable);

                d('#interval_switch').val(reboot_info.interval_enable);
                show_interval_box(reboot_info.interval_enable);
                d('#interval_time').val(reboot_info.interval_time);
            }
        })
    }

    function checked_week(weeks) {
        d.each(weeks, function (n, m) {
            d('#weeks_0_' + m).prop('checked', true).attr('data-value', '1');
        });
        if (d('.week_0').length == d('.week_0:checked').length) {
            d('#weeks_all_0').prop('checked', true).attr('data-value', '1');
        }
    }

    et.reboot = function () {
        g.shconfirm(nowLang, SHpack.reboot[nowLang], 'confirm', {
            onOk: function () {
                f.setReboot(function () {
                    g.loading_box(SHpack['tip'][nowLang]);
                    g.animationWidth(device_config.reboor_time, gopath);
                });
            }
        });
    };

    et.select_all_week = function (evt) {
        if (d(evt).attr('data-value') == '0') {
            d(evt).prop('checked', true).attr('data-value', '1');
            d('.week_0').prop('checked', true).attr('data-value', '1');
        } else if (d(evt).attr('data-value') == '1') {
            d(evt).prop('checked', false).attr('data-value', '0');
            d('.week_0').prop('checked', false).attr('data-value', '0');
        }
    };

    et.select_one_week = function (evt) {
        var weekcheck = d(evt).attr('data-value');
        if (weekcheck == '1') {
            d(evt).prop('checked', false).attr('data-value', '0');
            d('#weeks_all_0').prop('checked', false).attr('data-value', '0');
        } else {
            d(evt).prop('checked', true).attr('data-value', '1');
        }
        if (d('.week_0').length == d('.week_0:checked').length) {
            d('#weeks_all_0').prop('checked', true).attr('data-value', '1');
        }
    };

    et.reboot_switch = function (evt) {
        show_reboot_box(d(evt).val());
    };

    function show_reboot_box(data) {
        if (data == 1) {
            d("#time_box").removeClass('hidden');
        } else {
            d("#time_box").addClass('hidden');
        }
    }

    et.interval_switch = function (evt) {
        show_interval_box(d(evt).val());
    };

    function show_interval_box(data) {
        if (data == 1) {
            d("#interval_box").removeClass('hidden');
        } else {
            d("#interval_box").addClass('hidden');
        }
    }

    et.reboot_config = function () {
        if (!g.volide_ok('.shbox_border')) {
            return;
        }
        var timing_enable = d('#reboot_switch').val()
        if( timing_enable == 1 && d('.week_0:checked').length < 1){
            g.shconfirm(nowLang, SHtips.date_err[nowLang], "error");
            return
        }
        var arg_data;
        if (lock_web) return;
        lock_web = true;
        if (arg_data = set_volide()) {
            d('.closewin').click();
            set_config(arg_data)
        } else {
            lock_web = false;
        }
    };

    function set_volide() {
        var arg = {}, week_arr = [];

        d.each(weeks_num, function (x, y) {
            var week_id = "#weeks_0_" + y;
            if (d(week_id).prop("checked") == true) {
                week_arr.push(y)
            }
        });

        arg.timing_enable = d('#reboot_switch').val();
        arg.timing_weeks = week_arr.join(',');
        arg.timing_time = d('#time_reboot').val();
        arg.interval_enable = d('#interval_switch').val();
        arg.interval_time = d('#interval_time').val();

        return arg;
    }

    function set_config(arg) {
        f.setMConfig('system_timing_reboot', arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
                lock_web = false;
            } else {
                g.shconfirm(nowLang, SHtips.set_ok[nowLang], "success");
                refresh_init();
                setTimeout(reset_lock_web, 500);
            }
        });
    }

    function reset_lock_web() {
        lock_web = false;
    }

    function gopath() {
        window.location.href = 'http://' + location.hostname;
    }
});
