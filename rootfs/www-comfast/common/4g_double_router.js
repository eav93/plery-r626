define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('optionwifi'),
        nowLang,
        et = {};

    var device, config, lan_info, radios_info, wan_info, wifis_info, web_lock = false;
    var rwinfo, wifi_array = {}, link_type = '';

    exports.init = function () {
        e.plugInit(et, start_model);
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
        d('.select li').on('click', function () {
            if (nowLang == d(this).attr('data-value')) {
                return;
            }
            nowLang = d(this).attr('data-value');
            g.setlanguage(d(this).attr('data-value'));
        })
    }

    function refresh_init() {
        f.getguide(function (data) {
            if (data.errCode == '0') {
                config = d.extend(true, {}, data);
                lan_info = data.lan;
                radios_info = data.radios;
                rwinfo = d.extend(true, [], radios_info);
                wan_info = data.wan;
                wifis_info = data.wifis;
                if (data.lan.ignore == '0' || data.lan.ignore == '') {
                    config.lan.enable = true;
                } else {
                    config.lan.enable = false;
                }
                refresh_default();
            }
        })
    }

    et.next = function (evt) {
        ifNext(evt);
    }

    et.nextend = function (evt) {
        ifNext(evt, readSet);
    }

    et.prev = function () {
        var i = 0;
        if (d('.shstep ul').children(".active").length) {
            i = d('.shstep ul').children(".active").length;
        }
        if (i > 1) {
            showPics(i - 1);
        } else {
            history.go(-1);
            location.href = document.referrer;
        }
    }

    et.skipped = function () {
        window.location.href = 'index.html';
    }

    function ifNext(obj, callback) {
        var require = d(obj).parents('.wizard_box');
        var requires = d(obj).parents('.wizard_box').find('.require');
        var num = require.index() + 2;
        requires.each(function () {
            if (d(this).is(":visible")) {
                d(this).trigger('blur');
            }
        })
        var errobj = d(require).find('.borError:visible');
        if (errobj.length == 0) {
            showPics(num, callback)
        } else {
            d(errobj[0]).trigger('blur').focus();
        }
    }

    function showPics(nIndex, func) {
        var steps = d('.wizard_box');
        var totle = d('.shstep li').length;
        d('.shstep li').removeClass('active');
        d('.shstep li:last-child').removeClass('complete');
        d('.shstep li:lt(' + nIndex + ')').addClass('active');
        steps.eq(nIndex - 1).removeClass('hide').siblings('.wizard_box').addClass('hide');
        steps.find('input').removeClass('borError');
        steps.find(".onError").remove();
        if (func) func();
        if (nIndex == totle) {
            d('.shstep li:last-child').addClass('complete');
        }
    }

    function readSet() {
        var this_html;
        this_html = '<li class="list clearfix"><label class="left" sh_lang="SHpack.ip_addr">' + SHpack['ip_addr'][nowLang] + '</label><span class="right">' + d('#lan_ip_id').val() + '</span></li>';
        this_html += '<li class="list clearfix"><label class="left" sh_lang="SHpack.netmask">' + SHpack['netmask'][nowLang] + '</label><span class="right">' + d('#lan_netmask_id').val() + '</span></li>';
        if (d('.w24g').length) {
            this_html += '<li class="list clearfix"><label class="left" sh_lang="SHpack.ssid_name_24g">' + SHpack['ssid_name_24g'][nowLang] + '</label><span class="right">' + d('#ssid_id_24g').val() + '</span></li>';
        }
        if (d('.w58g').length) {
            this_html += '<li class="list clearfix"><label class="left" sh_lang="SHpack.ssid_name_58g">' + SHpack['ssid_name_58g'][nowLang] + '</label><span class="right">' + d('#ssid_id_58g').val() + '</span></li>';
        }
        d('#readSet').html(this_html);
    }

    et.apn_detect = function (evt) {
        if (d(evt).val() == '0') {
            d('#apn_msg').removeClass('hidden');
        } else {
            d('#apn_msg').addClass('hidden');
        }
    };

    et.country_channel = function (evt) {
        var now_country = d(evt).val();
        d('.country').val(now_country);
        d.each(rwinfo, function (n, m) {
            h.append_channel("#channels_" + m.flag, now_country, "auto", m.flag, d('#bandwidth_' + m.flag).val(), m.no_ht80_with_11a, 0);
        })
    };

    et.htmode_channel = function (evt) {
        d.each(rwinfo, function (n, m) {
            if (m.flag == '58g') {
                h.append_channel("#channels_" + m.flag, d('.country').val(), "auto", m.flag, d(evt).val(), m.no_ht80_with_11a, 0);
            }
        })
    };

    function wifi_group_radio() {
        var num;
        var i = 0;
        for (var n = 0; n < radios_info.length; n++) {
            num = wifis_info.length / radios_info.length;
            wifi_array[n] = [];
            for (; num > 0; num--) {
                wifi_array[n].push(wifis_info[i]);
                i++;
            }
        }
    }

    function showstep() {
        var delradio;
        if (rwinfo.length > 1) {
            g.step('router_wizard');
        } else {
            if (rwinfo[0].flag == '24g') {
                delradio = '58g';
            } else {
                delradio = '24g';
            }
            g.step('router_wizard', delradio);
        }
    }

    function ceartrwinfo() {
        wifi_group_radio();
        d.each(rwinfo, function (n, m) {
            if (m.hwmode.indexOf('a') > -1) {
                rwinfo[n].flag = '58g';
            } else {
                rwinfo[n].flag = '24g';
            }
            d.each(wifi_array, function (x, y) {
                if (y[0].device == 'radio' + n) {
                    rwinfo[n].wifis = y;
                }
            })
        });
        showstep();
    }

    function refresh_default() {
        if (!lan_info || !wan_info || !wifis_info || !radios_info) {
            return;
        }
        ceartrwinfo();

        /*wanstatus start*/
        var TempProto;

        if (wan_info.proto == 'qmi' || wan_info.proto == 'ppp_quectel') {
            TempProto = "card"
        } else {
            TempProto = wan_info.proto;
        }

        var clickprotoid = "#" + TempProto + "_addr_id";

        if (wan_info.mtu != "") {
            g.setvalue('#mtu', wan_info.mtu);
        } else {
            g.setvalue('#mtu', '1492');
        }

        if (TempProto == 'pppoe') {
            g.setvalue('#pppoe_user_id', wan_info.username);
            g.setvalue('#pppoe_pwd_id', wan_info.password);
            g.setvalue('#pppoe_server_id', wan_info.service);
        } else if (TempProto == 'static') {
            g.setvalue('#static_ip_id', wan_info.ipaddr);
            g.setvalue('#static_netmask_id', wan_info.netmask || '255.255.255.0');
            g.setvalue('#static_gateway_id', wan_info.gateway);
            g.setvalue('#static_dns_id', wan_info.dns.split(" ")[0]);
        } else if (TempProto == "card") {
            d("#lte_protocol").val(wan_info.proto);
            if(wan_info.apn_detect === '0'){
                d('#apn_msg').removeClass('hidden');
                d("#apn_detect").val(wan_info.apn_detect);
                d("#lte_apn").val(wan_info.apn);
                d("#lte_username").val(wan_info.username);
                d("#lte_password").val(wan_info.password);
            }
        }

        d(clickprotoid).click();
        /*wanstatus end*/

        /*lanstatus start*/
        g.setvalue('#lan_ip_id', lan_info.ipaddr);
        g.setvalue('#lan_netmask_id', lan_info.netmask || "255.255.255.0");
        /*lanstatus end*/

        if (location.host == lan_info.ipaddr) {
            link_type = 'lan';
        } else {
            link_type = 'wan';
        }

        /*wifistatus start*/
        d.each(rwinfo, function (n, m) {
            var ssid_id = '#ssid_id_' + m.flag, psk_id = '#psk_id_' + m.flag, country = '#country_' + m.flag;

            g.setvalue(ssid_id, m.wifis[0].ssid);
            if (m.wifis[0].encryption != "none") {
                g.setvalue(psk_id, m.wifis[0].key);
            }
            h.append_channel("#channels_" + m.flag, m.country, m.channel, m.flag, m.htmode, m.no_ht80_with_11a, 0);
            h.append_htmode("#bandwidth_" + m.flag, m.htmode, m.flag, m.no_ht80_with_11a);
            d(country).val(m.country);

        });
        /*wifistatus end*/

    }

    function config_get() {
        var data_config = {"lan": {}, "wan": {}, "radios": {}, "wifis": {}};

        wifi_array = [];
        data_config.lan.ipaddr = d("#lan_ip_id").val();
        data_config.lan.netmask = g.trim_select(d("#lan_netmask_id").val());
        data_config.lan.enable = true;

        data_config.wan.mode = "router";

        var TempProto = d("input[name='addr_ip']:checked").val();

        if (TempProto == "pppoe") {
            data_config.wan.proto = "pppoe";
            data_config.wan.username = d("#pppoe_user_id").val();
            data_config.wan.password = d("#pppoe_pwd_id").val();
            data_config.wan.mtu = d('#mtu').val();
            data_config.wan.service = d("#pppoe_server_id").val();
        } else if (TempProto == "static") {
            data_config.wan.proto = "static";
            data_config.wan.ipaddr = d("#static_ip_id").val();
            data_config.wan.gateway = d("#static_gateway_id").val();
            data_config.wan.netmask = g.trim_select(d("#static_netmask_id").val());
            data_config.wan.dns = d("#static_dns_id").val();
            if (data_config.wan.ipaddr == data_config.wan.gateway) {
                g.shconfirm(nowLang, SHtips.gatewayandip[nowLang], "error");
                return false;
            }
            if (data_config.wan.ipaddr == data_config.wan.dns) {
                g.shconfirm(nowLang, SHtips.dnsandip[nowLang], "error");
                return false;
            }
        } else if (TempProto == "dhcp") {
            data_config.wan.proto = "dhcp";
        } else if (TempProto == "card") {
            data_config.wan.proto = d("#lte_protocol").val();
            data_config.wan.apn_detect = d('#apn_detect').val();
            if (data_config.wan.apn_detect === '0') {
                data_config.wan.apn = d("#lte_apn").val();
                data_config.wan.username = d("#lte_username").val();
                data_config.wan.password = d("#lte_password").val();
            }
        }

        d.each(rwinfo, function (n, m) {
            /*get radios_config*/
            config.radios[n].country = d('.country').val();
            config.radios[n].htmode = d('#bandwidth_' + m.flag).val();
            config.radios[n].channel = d('#channels_' + m.flag).val();

            if (m.flag == '24g') {
                config.radios[n].hwmode = "11bgn";
            }
            delete (config.radios[n].txpower_level);
            delete (config.radios[n].txpower);

            /*get wifi_config*/
            m.wifis[0].ssid = d('#ssid_id_' + m.flag).val();

            if (d('#psk_id_' + m.flag).val() == "" || d('#psk_id_' + m.flag).val() == undefined) {
                m.wifis[0].encryption = "none";
                m.wifis[0].key = '';
            } else {
                m.wifis[0].encryption = "psk2";
                m.wifis[0].key = d('#psk_id_' + m.flag).val();
            }
            d.each(m.wifis, function (x, y) {
                wifi_array.push(y);
            })
        });
        data_config.radios = config.radios;
        data_config.wifis = wifi_array;
        return data_config;
    }

    et.setmode = function () {
        var data_config;
        if (data_config = config_get()) {
            set_config(data_config);
        }
    };

    function set_config(arg) {
        if (web_lock) {
            return;
        }
        web_lock = true;
        f.setguide(arg, function (data) {
            if (data.errCode != 0) {
                web_lock = false;
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(30, gohref);
            }
        });
    }

    function gohref() {
        if (link_type == 'lan') {
            location.href = 'http://' + d('#lan_ip_id').val() + '/' + device + '/index.html';
        } else {
            if (d('#static_ip_id').val() != '') {
                location.href = 'http://' + d('#static_ip_id').val() + '/' + device + '/index.html';
            } else {
                location.href = location.href;
            }
        }
    }
});