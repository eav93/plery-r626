define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, ntptime_info, remote_info;

    exports.init = function () {
        e.plugInit(et, start_model);
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
        d('.set_seat').css({'top': martop + 'px'});
        f.getMConfig('ntp_timezone', '', function (data) {
            if (data && !data.errCode) {
                ntptime_info = data.ntp;
                refresh_ntptime();
            }
        });
    }

    et.prev = function () {
        location.href = 'index.html';
    };

    function refresh_ntptime() {
        var servername;
        if (ntptime_info) {
            d("#localtime").val(ntptime_info.timestr);
            d("#ntp_switch").val(ntptime_info.ntp_client_enabled);
            ntp_switch(ntptime_info.ntp_client_enabled);
            d("#timezone").val(ntptime_info.zonename || "63");
            servername = ntptime_info.ntp_servername.split(" ")[0];
            d("#servername").val(servername || "");
        }
    }

    et.change_ntpswitch = function () {
        ntp_switch(d("#ntp_switch").val());
    };

    function ntp_switch(data){
        if (data == "0") {
            d("#ntp_box").addClass("hidden");
        } else {
            d("#ntp_box").removeClass("hidden");
        }
        d(".onError").remove();
        d('input').removeClass('borError');
    }

    et.cptime = function () {
        if (d('#ntp_switch').val() == 1) {
            refresh_init();
        } else {
            var date = new Date();
            var time = "";
            time += date.getFullYear();
            time += "-";
            if ((date.getMonth() + 1) < 10) {
                time += "0";
            }
            time += (date.getMonth() + 1);
            time += "-";
            if (date.getDate() < 10) {
                time += "0";
            }
            time += date.getDate();
            time += " ";
            if (date.getHours() < 10) {
                time += "0";
            }
            time += date.getHours();
            time += ":";
            if (date.getMinutes() < 10) {
                time += "0";
            }
            time += date.getMinutes();
            time += ":";
            if (date.getSeconds() < 10) {
                time += "0";
            }
            time += date.getSeconds();
            d("#localtime").val(time);
        }
    };

    et.saveConfig = function () {

        if (!g.volide_ok('.shbox_border')) {
            return;
        }

        var arg = {};

        arg.timestr = d("#localtime").val();
        arg.timezone = d("#timezone").find("option:selected").attr("data-value");
        arg.zonename = d("#timezone").val();
        arg.ntp_client_enabled = d("#ntp_switch").val();

        arg.ntp_servername = d("#servername").val();

        set_config(arg);
    };

    function set_config(arg) {
        f.setMConfig('ntp_timezone', arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.shconfirm(nowLang, SHtips.set_ok[nowLang], "success");
            }
        })
    }
})
