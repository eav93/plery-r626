define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device;

    exports.init = function() {
        e.plugInit(et, start_model);
    };
    et.prev = function () {
        location.href = 'index.html';
    };

    function start_model(data) {
        nowLang = data.language.language;
        device = d('body').attr('device');
        g.common(nowLang, device);
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    function refresh_init() {
        f.getSystemLog(function (data) {
            if (data && data.errCode == 0) {
                if (data.systemlog.systemlog == "") {
                    return;
                }
                modify_log(data.systemlog.systemlog);
                d("#btn-log").removeAttr("disabled");
            }
        });
    }

    function modify_log(logs) {
        var list_arry, this_html = "";

        list_arry = logs.split("\n");

        d.each(list_arry, function (n, m) {
            var reg1 = /^((.*?\s){5}.*?)/, reg2 = /^((.*?\s){7}.*?)/;
            var m_str, time, level, log;
            m_str = m.replace(/\s+/g, ' ');
            time = m_str.match(reg1);
            level = m_str.match(reg2)[0].replace(reg1, '').split(' ')[0].split('.')[1];
            log = m_str.replace(reg2, '');
            if (log == '') {
                return true;
            }
            if (n % 2 == 1) {
                this_html += '<tr class="table_role_s">';
            } else {
                this_html += '<tr class="table_role_m">';
            }

            this_html += '<td style="text-align: center;width: 200px">' + format_time(time[0]) + '</td>';
            this_html += '<td style="text-align: center;width: 120px">' + check_level(level) + '</td>';
            this_html += '<td style="text-align: left;">' + log + '</td></tr>';
        });
        d("#log_tab").html(this_html);
    }

    function format_time(time) {
        var null_index = 0;
        var time_arr = time.split(' ');

        if (time_arr[2] == "") {
            null_index = 1;
        }
        time = time_arr[(4 + null_index)] + "/" + check_mounth(time_arr[1]) + "/" + time_arr[(2 + null_index)] + " " + time_arr[(3 + null_index)];
        return time;
    }

    function check_mounth(month) {
        var list = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var index;
        for (index = 0; index < list.length; index++) {
            if (month == list[index]) {
                return (index + 1);
            }
        }
    }

    function check_level(level) {
        var level_obj = {'err':'Error','debug':'Debug','info':'Info','notice':'Notice','warn':'Warning','crit':'Crit','emerg':'Emerg','alert':'Alert'};

        if(level_obj[level] == undefined){
            return '<span class ="info">Info</span>';
        }else {
            return '<span class =' + level + '>' + level_obj[level] + '</span>';
        }
    }

    et.log_now = function () {
        d("#btn-log").attr("disabled", true);
        refresh_init();
    }

})
