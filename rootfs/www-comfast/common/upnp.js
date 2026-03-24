define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, upnp_list = [], upnp_enabled = 0;

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
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    function refresh_init() {
        f.getMConfig('upnp_config', '', function (data) {
            if (data && data.errCode == 0) {
                upnp_enabled = data.enable_upnp || data.enabled || '0';
                updateSwitch();
            }
        });

        f.getMConfig('upnp_list', '', function (data) {
            if (data && data.errCode == 0) {
                upnp_list = data.upnp_list || data.list || [];
                if (!Array.isArray(upnp_list)) upnp_list = [];
                refresh_list();
            }
        });
    }

    function updateSwitch() {
        if (upnp_enabled == '1') {
            d('#switch').removeClass('switchclose').addClass('switchopen');
        } else {
            d('#switch').removeClass('switchopen').addClass('switchclose');
        }
    }

    function refresh_list() {
        if (!upnp_list.length) {
            d("#port_table").html('');
            return;
        }

        list_show();
    }

    function list_show() {
        var html = '';
        for (var i = 0; i < upnp_list.length; i++) {
            var item = upnp_list[i];
            html += '<tr>';
            html += '<td>' + (i + 1) + '</td>';
            html += '<td>' + (item.proto || item.protocol || '-') + '</td>';
            html += '<td>' + (item.lanaddr || item.lan_addr || item.intaddr || '-') + '</td>';
            html += '<td>' + (item.wanport || item.wan_port || item.extport || '-') + '</td>';
            html += '<td>' + (item.lanport || item.lan_port || item.intport || '-') + '</td>';
            html += '<td>' + (item.desc || item.description || '-') + '</td>';
            html += '</tr>';
        }
        d("#port_table").html(html);
    }

    et.changestatus = function () {
        var config = {};
        if (upnp_enabled == '1') {
            upnp_enabled = '0';
        } else {
            upnp_enabled = '1';
        }
        config.enable_upnp = upnp_enabled;

        f.setMConfig('upnp_config', config, function (data) {
            if (data && data.errCode == 0) {
                updateSwitch();
                g.shconfirm(nowLang, SHtips.set_ok[nowLang], "success");
            } else {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
                // revert
                upnp_enabled = upnp_enabled == '1' ? '0' : '1';
                updateSwitch();
            }
        });
    };
});
