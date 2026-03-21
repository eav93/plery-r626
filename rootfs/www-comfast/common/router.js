define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('optionwifi'),
        nowLang,
        et = {};

    require("checkbox")(d);

    var device, config, lan_info, radios_info, wan_info, wifis_info, web_lock = false;
    var rwinfo, wifi_array = {}, link_type = '';

    var combineExist = 0, combineStatus = 0;

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

                combineExist = data.combine_wifi.have_combine || 0;
                combineStatus = data.combine_wifi.enable;

                if (combineExist == "1") {
                    d("#combineExist").show();
                    if (combineStatus == "1") {
                        d("#combineSwitch").attr("checked", true);
                        d("#combine").show();
                    } else if (combineStatus == "0") {
                        d("#combineSwitch").attr("checked", false);
                        d("#alone").show();
                    }
                } else {
                    d("#alone").show();
                }
                ceartrwinfo();
                refresh_default();
                d('.MCB').MCheckbox();
            }
        })
    }

    d(".combineSwitch").on("click", function () {
        d('#alone').toggle();
        d('#combine').toggle();
    });

    et.next = function (evt) {
        ifNext(evt);
    };

    et.nextend = function (evt) {
        ifNext(evt, readSet);
    };

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

    et.country_combine = function (evt) {
        var now_country = d(evt).val();
        d('.country_combine').val(now_country);
        d.each(rwinfo, function (n, m) {
            h.append_channel("#channels_combine_" + m.flag, now_country, "auto", m.flag, d('#bandwidth_combine_' + m.flag).val(), m.no_ht80_with_11a, 0);
        })
    };

    et.htmode_combine = function (evt) {
        d.each(rwinfo, function (n, m) {
            if (m.flag == '58g') {
                h.append_channel("#channels_combine_" + m.flag, d('.country_combine').val(), "auto", m.flag, d(evt).val(), m.no_ht80_with_11a, 0);
            }
        })
    };

    function ceartrwinfo() {
        var num = wifis_info.length / radios_info.length, radioFlag = 0;

        for (var n = 0; n < rwinfo.length; n++) {
            if (rwinfo[n].hwmode.indexOf('a') > -1) {
                radioFlag += 10;
                rwinfo[n].flag = '58g';
            } else {
                radioFlag += 1;
                rwinfo[n].flag = '24g';
            }
            rwinfo[n].wifis = [];
            for (var i = 0; i < wifis_info.length; i++) {
                if (wifis_info[i].device == 'radio' + n) {
                    for (var j = 0; j < num; j++) {
                        if (wifis_info[i + j]) {
                            rwinfo[n].wifis.push(wifis_info[i + j]);
                        }
                    }
                    break;
                }
            }
        }

        if (radioFlag == 10) {
            d("#wifi_24g").remove()
        } else if (radioFlag == 1) {
            d("#wifi_58g").remove()
        }

        g.step('router_wizard');
    }

    function refresh_default() {

        /*wanstatus start*/
        var clickprotoid = "#" + wan_info.proto + "_addr_id";

        if (wan_info.mtu != "") {
            g.setvalue('#mtu', wan_info.mtu);
        } else {
            g.setvalue('#mtu', '1492');
        }
        g.setvalue('#pppoe_user_id', wan_info.username);
        g.setvalue('#pppoe_pwd_id', wan_info.password);
        g.setvalue('#pppoe_server_id', wan_info.service);
        g.setvalue('#static_ip_id', wan_info.ipaddr);
        g.setvalue('#static_gateway_id', wan_info.gateway);
        g.setvalue('#static_netmask_id', wan_info.netmask || "255.255.255.0");
        g.setvalue('#static_dns_id', wan_info.dns.split(" ")[0]);
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
            var ssid_id = '#ssid_id_' + m.flag, psk_id = '#psk_id_' + m.flag;

            d(".country").val(m.country);

            d(".country_combine").val(m.country);

            g.setvalue(ssid_id, m.wifis[0].ssid);
            if (m.wifis[0].encryption != "none") {
                g.setvalue(psk_id, m.wifis[0].key);
            }
            h.append_channel("#channels_" + m.flag, m.country, m.channel, m.flag, m.htmode, m.no_ht80_with_11a, 0);
            h.append_htmode("#bandwidth_" + m.flag, m.htmode, m.flag, m.no_ht80_with_11a);

            h.append_channel("#channels_combine_" + m.flag, m.country, m.channel, m.flag, m.htmode, m.no_ht80_with_11a, 0);
            h.append_htmode("#bandwidth_combine_" + m.flag, m.htmode, m.flag, m.no_ht80_with_11a);
            if (n == 0) {
                var ssid_id_combine = '#ssid_id_combine', psk_id_combine = '#psk_id_combine',
                    country_combine = '#country_combine';
                g.setvalue(ssid_id_combine, m.wifis[0].ssid);
                if (m.wifis[0].encryption != "none") {
                    g.setvalue(psk_id_combine, m.wifis[0].key);
                }
                d(country_combine).val(m.country);
            }

        });
        /*wifistatus end*/

    }

    function config_get() {
        var data_config = {"lan": {}, "wan": {}, "radios": {}, "wifis": {}, "combine_wifi": {}};

        wifi_array = [];
        data_config.lan.ipaddr = d("#lan_ip_id").val();
        data_config.lan.netmask = g.trim_select(d("#lan_netmask_id").val());
        data_config.lan.enable = true;

        data_config.wan.mode = "router";
        if (d("input[name='addr_ip']:checked").val() == "pppoe") {
            data_config.wan.proto = "pppoe";
            data_config.wan.username = d("#pppoe_user_id").val();
            data_config.wan.password = d("#pppoe_pwd_id").val();
            data_config.wan.mtu = d('#mtu').val();
            data_config.wan.service = d("#pppoe_server_id").val();
        } else if (d("input[name='addr_ip']:checked").val() == "static") {
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
        } else if (d("input[name='addr_ip']:checked").val() == "dhcp") {
            data_config.wan.proto = "dhcp";
        }


        if (d('#combineSwitch').attr("checked") == 'checked') {
            data_config.combine_wifi.enable = "1";
        } else {
            data_config.combine_wifi.enable = "0";
        }

        d.each(rwinfo, function (n, m) {

            if (m.flag == '24g') {
                config.radios[n].hwmode = "11bgn";
            }
            delete (config.radios[n].txpower_level);
            delete (config.radios[n].txpower);

            if (data_config.combine_wifi.enable == "1") {
                /*get radios_config*/
                config.radios[n].country = d('.country_combine').val();
                config.radios[n].htmode = d('#bandwidth_combine_' + m.flag).val();
                config.radios[n].channel = d('#channels_combine_' + m.flag).val();

                /*get wifi_config*/
                m.wifis[0].ssid = d('#ssid_id_combine').val();

                if (d('#psk_id_combine').val() == "" || d('#psk_id_combine').val() == undefined) {
                    m.wifis[0].encryption = "none";
                    m.wifis[0].key = '';
                } else {
                    m.wifis[0].encryption = "psk2";
                    m.wifis[0].key = d('#psk_id_combine').val();
                }
            } else {
                /*get radios_config*/
                config.radios[n].country = d('.country').val();
                config.radios[n].htmode = d('#bandwidth_' + m.flag).val();
                config.radios[n].channel = d('#channels_' + m.flag).val();

                /*get wifi_config*/
                m.wifis[0].ssid = d('#ssid_id_' + m.flag).val();

                if (d('#psk_id_' + m.flag).val() == "" || d('#psk_id_' + m.flag).val() == undefined) {
                    m.wifis[0].encryption = "none";
                    m.wifis[0].key = '';
                } else {
                    m.wifis[0].encryption = "psk2";
                    m.wifis[0].key = d('#psk_id_' + m.flag).val();
                }
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
