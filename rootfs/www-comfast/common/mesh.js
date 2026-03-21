define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('optionwifi'),
        nowLang,
        et = {};

    require("slideControl")(d);

    var device, config, lan_info, radios_info, wan_info, wifis_info;
    var rwinfo, wifi_array = {}, band_num, rep_num, rep_config, link_type = '';

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    function start_model(data) {
        nowLang = data.language.language;
        device = d('body').attr('device');
        g.common(nowLang, device);
        g.volide('.shbox', nowLang, device);
        g.chgTabs('radio_tabs', 'radio_boxs');
        matic();
        page_init();
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    function page_init() {
        d('.select li').on('click tap', function () {
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
                rep_config = data.wwan || '';
                refresh_default();
            }
        })
    }

    et.next = function (evt) {
        ifNext(evt);
    };

    et.nextend = function (evt) {
        ifNext(evt, readSet)
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
    };

    et.skipped = function () {
        window.location.href = 'index.html';
    };

    function ifNext(obj, callback) {
        var require = d(obj).parents('.wizard_box');
        var requires = d(obj).parents('.wizard_box').find('.require');
        var num = require.index() + 2;
        requires.each(function () {
            if (d(this).is(":visible")) {
                d(this).trigger('blur');
            }
        });
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

    function matic() {
        d('#lan_netmask_id').focus(function () {
            var _this = d(this);
            var ip = d('#lan_ip_id').val();
            if (_this.val() == "") {
                if (g.isIpaddr(ip)) {
                    var ipitm = ip.split(".");
                    if (Number(ipitm[0]) >= 1 && Number(ipitm[0]) <= 126) {
                        _this.val('255.0.0.0');
                    } else if (Number(ipitm[0]) >= 128 && Number(ipitm[0]) <= 191) {
                        _this.val('255.255.0.0');
                    } else {
                        _this.val('255.255.255.0');
                    }
                }
            }
        });

        d('#static_netmask_id').focus(function () {
            var _this = d(this);
            var ip = d('#static_ip_id').val();
            if (_this.val() == "") {
                if (g.isIpaddr(ip)) {
                    var ipitm = ip.split(".");
                    if (Number(ipitm[0]) >= 1 && Number(ipitm[0]) <= 126) {
                        _this.val('255.0.0.0');
                    } else if (Number(ipitm[0]) >= 128 && Number(ipitm[0]) <= 191) {
                        _this.val('255.255.0.0');
                    } else {
                        _this.val('255.255.255.0');
                    }
                }
            }
        });

        d('#static_gateway_id').focus(function () {
            var _this = d(this);
            var ip = d('#static_ip_id').val();
            if (_this.val() == "") {
                if (g.isIpaddr(ip)) {
                    var ipitm = ip.split(".");
                    var gate = ipitm[0] + '.' + ipitm[1] + '.' + ipitm[2] + '.1';
                    _this.val(gate);
                }
            }
        });
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

    function getnumber(arg) {
        if (arg == undefined || arg == '') {
            return 0;
        }
        var reg = new RegExp('[0-9]\d*$');
        return reg.exec(arg)[0];
    }

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
        var this_html = '', delradio;
        if (rwinfo.length > 1) {
            g.step('mesh_wizard');
            this_html = "<option value='radio0'>5.8GHz</option><option value='radio1'>2.4GHz</option>";
        } else {
            if (rwinfo[0].flag == '24g') {
                delradio = '58g';
            } else {
                delradio = '24g';
            }
            g.step('mesh_wizard', delradio);

            if (rwinfo[0].flag == '24g') {
                this_html += "<option value='radio0' selected>2.4GHz</option>";
            } else {
                this_html += "<option value='radio0' selected>5.8GHz</option>";
            }
        }
        d("#mesh_band").html(this_html);
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
        if (wan_info.proto == 'pppoe') {
            wan_info.proto = 'dhcp';
        }

        var clickprotoid = "#" + wan_info.proto + "_addr_id";
        g.setvalue('#static_ip_id', wan_info.ipaddr);
        g.setvalue('#static_gateway_id', wan_info.gateway);
        g.setvalue('#static_netmask_id', wan_info.netmask);
        g.setvalue('#static_dns_id', wan_info.dns);
        d(clickprotoid).click();

        g.setvalue('#lan_ip_id', lan_info.ipaddr);
        g.setvalue('#lan_netmask_id', lan_info.netmask);

        if (location.host == lan_info.ipaddr) {
            link_type = 'lan';
        } else {
            link_type = 'wan';
        }

        band_num = getnumber(rep_config.device);

        d('#mesh_band').val('radio' + band_num);

        d.each(rwinfo, function (n, m) {
            var ssid_id = '#ssid_id_' + m.flag, psk_id = '#psk_id_' + m.flag, country = '.country';
            g.setvalue(ssid_id, m.wifis[0].ssid);
            if (m.wifis[0].encryption != "none") {
                g.setvalue(psk_id, m.wifis[0].key);
            }
            if (band_num == n) {
                h.append_channel("#channels_" + m.flag, m.country, m.channel, m.flag, m.htmode, m.no_ht80_with_11a, 1);
                d('#channels_' + m.flag).attr('disabled', true);
                d('#htmode_' + m.flag).attr('disabled', true);
            } else {
                h.append_channel("#channels_" + m.flag, m.country, m.channel, m.flag, m.htmode, m.no_ht80_with_11a, 2);
            }
            h.append_htmode("#htmode_" + m.flag, m.htmode, m.flag, m.no_ht80_with_11a);
            d(country).val(m.country);
        });

        if (rep_config) {
            //if (!rep_config.mesh_id) return;

            g.setvalue('#sta_ssid_id', rep_config.mesh_id);
            if (rep_config.key) {
                g.setvalue('#rep_ssid_pwd', rep_config.key);
            } else {
                g.setvalue('#rep_ssid_pwd', '');
            }

            rep_config.channel = rwinfo[band_num].channel;
            rep_config.radio = rep_config.device;
            rep_config.radio_num = rep_num;

            h.append_channel("#channels_mesh", rwinfo[band_num].country, rwinfo[band_num].channel, rwinfo[band_num].flag, rwinfo[band_num].htmode, rwinfo[band_num].no_ht80_with_11a, 1);
            h.append_htmode("#htmode_mesh", rwinfo[band_num].htmode, rwinfo[band_num].flag, rwinfo[band_num].no_ht80_with_11a);
        } else {
            h.append_channel("#channels_mesh", rwinfo[0].country, rwinfo[0].channel, rwinfo[0].flag, rwinfo[0].htmode, rwinfo[0].no_ht80_with_11a, 1);
            h.append_htmode("#htmode_mesh", rwinfo[0].htmode, rwinfo[0].flag, rwinfo[0].no_ht80_with_11a);
        }
    }

    et.band_mesh = function (evt) {
        band_num = getnumber(d(evt).val());
        h.append_channel("#channels_mesh", d('.country').val(), rwinfo[band_num].channel, rwinfo[band_num].flag, rwinfo[band_num].htmode, rwinfo[band_num].no_ht80_with_11a, 1);
        h.append_htmode("#htmode_mesh", rwinfo[band_num].htmode, rwinfo[band_num].flag, rwinfo[band_num].no_ht80_with_11a);

        d.each(rwinfo, function (n, m) {
            if (band_num == n) {
                h.append_channel("#channels_" + m.flag, d('.country').val(), m.channel, m.flag, m.htmode, m.no_ht80_with_11a, 1);
                h.append_htmode("#htmode_" + m.flag, rwinfo[band_num].htmode, rwinfo[band_num].flag, rwinfo[band_num].no_ht80_with_11a);
                d('#channels_' + m.flag).attr('disabled', true);
                d('#htmode_' + m.flag).attr('disabled', true);
            } else {
                h.append_channel("#channels_" + m.flag, d('.country').val(), m.channel, m.flag, m.htmode, m.no_ht80_with_11a, 2);
                h.append_htmode("#htmode_" + m.flag, m.htmode, m.flag, m.no_ht80_with_11a);
                d('#channels_' + m.flag).attr('disabled', false);
                d('#htmode_' + m.flag).attr('disabled', false);
            }
        });
    };

    et.htmode_mesh = function (evt) {
        h.append_channel("#channels_mesh", d('.country').val(), rwinfo[band_num].channel, rwinfo[band_num].flag, d(evt).val(), rwinfo[band_num].no_ht80_with_11a, 1);
        d.each(rwinfo, function (n, m) {
            if (band_num == n) {
                h.append_channel("#channels_" + m.flag, d('.country').val(), m.channel, m.flag, d(evt).val(), m.no_ht80_with_11a, 1);
                d('#htmode_' + m.flag).val(d(evt).val());
            } else {
                h.append_channel("#channels_" + m.flag, m.country, m.channel, m.flag, m.htmode, m.no_ht80_with_11a, 2);
            }
        });
    };

    et.country_mesh = function (evt) {
        h.append_channel("#channels_mesh", d(evt).val(), d('#channels_mesh').channel, rwinfo[band_num].flag, d('#htmode_mesh').val(), rwinfo[band_num].no_ht80_with_11a, 1);
        h.append_htmode("#htmode_mesh", d('#htmode_mesh').val(), rwinfo[band_num].flag, rwinfo[band_num].no_ht80_with_11a);
        d.each(rwinfo, function (n, m) {
            if (band_num == n) {
                h.append_channel("#channels_" + m.flag, d(evt).val(), m.channel, m.flag, d('#htmode_mesh').val(), m.no_ht80_with_11a, 1);
                h.append_htmode("#htmode_" + m.flag, d('#htmode_mesh').val(), rwinfo[band_num].flag, rwinfo[band_num].no_ht80_with_11a);
            } else {
                h.append_channel("#channels_" + m.flag, d(evt).val(), m.channel, m.flag, d('#htmode_' + m.flag).val(), m.no_ht80_with_11a, 2);
                h.append_htmode("#htmode_" + m.flag, m.htmode, m.flag, m.no_ht80_with_11a);
            }
        });
    };

    et.channels_mesh = function (evt) {
        d.each(rwinfo, function (n, m) {
            if (band_num == n) {
                d('#channels_' + m.flag).val(d(evt).val());
            }
        });
    };

    et.htmode_change = function (evt) {
        d.each(rwinfo, function (n, m) {
            if (m.flag == '58g') {
                h.append_channel("#channels_58g", d('.country').val(), m.channel, m.flag, d(evt).val(), m.no_ht80_with_11a, 1);
            }
        });
    };

    function config_get() {
        var wan_config = {}, lan_config = {}, wwan_config = {};
        wifi_array = [];

        lan_config.ipaddr = d("#lan_ip_id").val();
        lan_config.netmask = g.trim_select(d("#lan_netmask_id").val());
        lan_config.enable = false;

        wan_config.mode = "mesh";
        wan_config.proto = "dhcp";


        wwan_config.mesh_id = d("#sta_ssid_id").val();
        if (d("#rep_ssid_pwd").val() == "" || d("#rep_ssid_pwd").val() == undefined) {
            wwan_config.encryption = "none";
            wwan_config.key = "";
        } else {
            wwan_config.encryption = "psk2";
            wwan_config.key = d("#rep_ssid_pwd").val();
        }
        wwan_config.radio = 'radio' + band_num;
        wwan_config.channel = d('#channels_mesh').val();
        wwan_config.radio_num = parseInt(band_num);

        d.each(rwinfo, function (n, m) {
            if (n == rep_config.radio_num) {
                config.radios[n].channel = rep_config.channel;
            }

            if (m.flag == '24g') {
                config.radios[n].hwmode = "11bgn";
            }
            config.radios[n].htmode = d('#htmode_' + m.flag).val();
            delete(config.radios[n].txpower_level);
            delete(config.radios[n].txpower);

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
                if (x != 0) {
                    m.wifis[x].disabled = "1";
                    if (x != 7) {
                        m.wifis[x].ifname = "";
                        m.wifis[x].device = "";
                    }
                }
                wifi_array.push(y);
            })
        });

        config.lan = lan_config;
        config.wan = wan_config;
        config.wifis = wifi_array;
        config.wwan = wwan_config;
    }

    et.setmode = function () {
        config_get();
        set_config(config);
    };

    function set_config(arg) {
        f.setguide(arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(30,gohref);
            }
        });
    }

    function gohref() {
        if (link_type == 'lan') {
            location.href = 'http://' + d('#lan_ip_id').val() + '/' + device + '/index.html';
        } else {
            location.href = location.href;
        }
    }

});