define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        h = require('optionwifi'),
        nowLang,
        et = {};

    require("checkbox")(d);

    var device, config, lan_info, radios_info, wan_info, wifis_info, wwan_info;
    var rwinfo, wifi_array = {}, rep_config = {}, wifilength, web_lock = false;

    var combineExist = 0, combineStatus = 0;

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    function start_model(data) {
        nowLang = data.language.language;
        device = d('body').attr('device');
        g.common(nowLang, device);
        g.chgTabs('wire_tabs', 'wire_boxs');
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    function refresh_init() {
        f.getguide(function (data) {
            if (data.errCode == '0') {
                config = d.extend(true, {}, data);
                if (data.lan.ignore == '0' || data.lan.ignore == '') {
                    config.lan.enable = true;
                } else {
                    config.lan.enable = false;
                }
                lan_info = data.lan;
                radios_info = data.radios;
                rwinfo = d.extend(true, [], radios_info);
                wan_info = data.wan;
                wifis_info = data.wifis;
                wwan_info = data.wwan;
                // if (!(wan_info.workmode == "wisp" || wan_info.workmode == "wds")) {
                //     d('[id^=wifi_manger_]').removeClass('hide')
                // }

                combineExist = data.combine_wifi.have_combine || 0;
                combineStatus = data.combine_wifi.enable;

                ceartrwinfo();

                if (combineExist == "1") {
                    d("#combineExist").show();
                    if (combineStatus == "1") {
                        d("#combineSwitch").attr("checked", true);
                        d("#combine").show();
                    } else if (combineStatus == "0") {
                        d("#combineSwitch").attr("checked", false);
                        d("#alone").show();
                    }
                    refreshAlone();
                    refreshCombine();
                } else {
                    d("#alone").show();
                    refreshAlone();
                }

                disble_channel();
                d('.MCB').MCheckbox();
            }
        })
    }

    function disble_channel() {
        if (wwan_info && (wan_info.workmode == "wds" || wan_info.workmode == "wisp" || wan_info.workmode == "wds_c" || wan_info.workmode == "mesh")) {
            var used_num = getnumber(wwan_info.device);
            d('.country').attr('disabled', true);
            d('.country_combine').attr('disabled', true);
            d('#bandwidth_' + rwinfo[used_num].flag).attr('disabled', true);
            d('#hwmode_' + rwinfo[used_num].flag).attr('disabled', true);
            d('#channels_' + rwinfo[used_num].flag).attr('disabled', true);
            d('#bandwidth_combine_' + rwinfo[used_num].flag).attr('disabled', true);
            d('#hwmode_combine_' + rwinfo[used_num].flag).attr('disabled', true);
            d('#channels_combine_' + rwinfo[used_num].flag).attr('disabled', true);
        }
    }

    et.prev = function () {
        location.href = 'index.html';
    };

    et.skipped = function () {
        window.location.href = 'index.html';
    };

    et.checkssid = function (evt) {
        if (d(evt).hasClass('show_ssid')) {
            d(evt).attr('data-value', '1').removeClass('show_ssid').addClass('hidden_ssid');
        } else {
            d(evt).attr('data-value', '0').removeClass('hidden_ssid').addClass('show_ssid');
        }
    };

    function getnumber(arg) {
        if (arg == undefined || arg == '') {
            return 0;
        }
        var reg = new RegExp('[0-9]\d*$');
        return reg.exec(arg)[0];
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
            d('#wifi_58g').addClass('show');
            d("#wifi_24g").remove()
        } else if (radioFlag == 1) {
            d('#wifi_24g').addClass('show');
            d("#wifi_58g").remove()
        } else {
            d('#wifi_24g').addClass('show');
        }

        if (radioFlag != 11) {
            d(".double_wifi").removeClass("double_wifi");
            d('.wire_tabs').remove();
        }

        g.step('router_wizard');
    }

    function defaultwifihtml(o, wifiband, s) {
        var maxnum = s, obj = o + wifiband;
        if (!maxnum) {
            maxnum = 8;
        }
        addwifi(obj, wifiband, maxnum);
        delwifi(obj);
    }

    function defaultcombine(o, wifiband, s) {
        var maxnum = s, obj = o + wifiband;
        if (!maxnum) {
            maxnum = 8;
        }
        addWifiCombine(obj, wifiband, maxnum);
        delwifi(obj);
    }

    //add wifilist
    function addwifi(o, wifiband, maxnum) {
        var n;
        d('#' + o).on('click', '.wifi_add', function () {
            var obj = d('.' + o).children();
            if (!wifilength) {
                wifilength = obj.length;
            }
            n = obj.length;
            if (n > maxnum) return;
            var $html = [];
            $html += wifihtml(o, wifiband, wifilength);
            d('.' + o).find('.manger').before($html);
            d('#disabled_' + wifiband + '_' + wifilength).MCheckbox();
            wifilength++;
            n++;
            if (device == 'computer') {
                g.setmenuheight();
            }
            g.volide('.alone_wifi', nowLang, device);
        })
    }

    //add wifilist
    function addWifiCombine(o, wifiband, maxnum) {
        var n;
        d('.' + o).on('click', '.wifi_add', function () {
            var obj = d('.' + o).children();
            if (!wifilength) {
                wifilength = obj.length;
            }
            n = obj.length;
            if (n >= maxnum) return;
            var $html = [];
            $html += wifihtml(o, wifiband, wifilength);
            d('.' + o).find('.manger').before($html);
            d('#disabled_' + wifiband + '_' + wifilength).MCheckbox();
            wifilength++;
            n++;
            if (device == 'computer') {
                g.setmenuheight();
            }
            g.volide('#combine', nowLang, device);
        })
    }

    function wifihtml(e, n, i) {
        let this_html = ''
        if (device == "computer") {
            return '<li class="clearfix wifi_box row ' + e + '_' + i + '"  id="wifi_' + n + '_' + i + '"><div class="col-xs-4"><div class="row"><label class="col-xs-5"><div class="row">' + SHpack['ssid'][nowLang] + '</div></label><span class="col-xs-7"><input class="text require isSSID nullSSID " type="text" id="ssid_' + n + '_' + i + '"></span></div></div>' +
            '<div class="col-xs-4"><div class="row"><label class="col-xs-5"><div class="row" sh_lang="SHpack.ssid_psk">' + SHpack['ssid_psk'][nowLang] + '</div></label><span class="col-xs-7"><input class="text require isSSIDPwd" type="text" id="passwd_' + n + '_' + i + '"></span></div></div>' +
            '<div class="col-xs-4" style="text-align: center;"><div class="row"><div class="col-xs-4 hide-xs"><div class="row"><input type="checkbox" id="disabled_' + n + '_' + i + '" class="MCB" checked="checked" data-value="true" style="display: none;"></div></div><div class="col-xs-4 col-sm-4"><div class="row"><label id="hidden_' + n + '_' + i + '" et="click:checkssid" class="iconfont show_ssid"></label></div></div><div class="col-xs-4 col-sm-8 wifi_del"><div class="row"><i class="iconfont icon-wifidel"></i></div></div></div></div></li>';
        } else {
            // return '<li class="clearfix wifi_box row ' + e + '_' + i + '"  id="wifi_' + n + '_' + i + '"><div class="col-xs-5"><div class="row"><label class="col-xs-6"><div class="row">' + SHpack['ssid'][nowLang] + '</div></label><span class="col-xs-6"><input class="text require isSSID nullSSID " type="text" id="ssid_' + n + '_' + i + '"></span></div></div>' +
            // '<div class="col-xs-5"><div class="row"><label class="col-xs-6"><div class="row" sh_lang="SHpack.ssid_psk">' + SHpack['ssid_psk'][nowLang] + '</div></label><span class="col-xs-6"><input class="text require isSSIDPwd" type="text" id="passwd_' + n + '_' + i + '"></span></div></div>' +
            // '<div class="col-xs-2" style="text-align: center;height: 32px; line-height: 32px;overflow-x: auto;"><div class="row" style="display: flex;width: 100px"><div class="col-xs-10"><div class="row"><input type="checkbox" id="disabled_' + n + '_' + i + '" class="MCB" checked="checked" data-value="true" style="display: none;"></div></div><div class="col-xs-4 col-sm-6"><div class="row"><label id="hidden_' + n + '_' + i + '" et="click:checkssid" class="iconfont show_ssid"></label></div></div><div class="col-xs-4 col-sm-6 wifi_del"><div class="row"><i class="iconfont icon-wifidel"></i></div></div></div></div></li>';

            let this_html = ''
            this_html += '<div class="wifi_box flex-center ' + e + '_' + i + '" id="wifi_' + n + '_' + i + '">'
                this_html += '<div class="left">'
                this_html += '<div class="flex-start">'
                this_html += '<span class="text-width">' + SHpack['ssid'][nowLang] + '</span>'
                this_html += '<div class="inputDiv"><input class="text require isSSID nullSSID " type="text" id="ssid_' + n + '_' + i + '"></div>'
                this_html += '<div class="flex-center">'
                this_html += '<input type="checkbox" id="disabled_' + n + '_' + i + '" class="MCB" checked="checked" data-value="true" style="display: none;">'
                this_html += '</div>'
                this_html += '</div>'
                this_html += '<div class="flex-start">'
                this_html += '<span class="text-width">' + SHpack['ssid_psk'][nowLang] + '</span>'
                this_html += '<div class="inputDiv"><input class="text require isSSIDPwd" type="text" id="passwd_' + n + '_' + i + '"></div>'
                this_html += '<label id="hidden_' + n + '_' + i + '" et="click:checkssid" class="iconfont show_ssid"></label>'    
                this_html += '</div>'
                this_html += '</div>'                
                this_html += '<div class="d-right flex-center">'
                this_html += '<li class="iconfont wifi_del icon-wifidel"></li>'
                this_html += '</div>'
                this_html += '</div>'
                return this_html
        }
        
    }

    //del wifilist
    function delwifi(o) {
        var n;
        d('#' + o).on('click', '.wifi_del', function (event) {
            var obj = d("[id^='" + o + "']");
            if (!wifilength) {
                wifilength = obj.length;
            }
            n = obj.length;
            d(this).parents('.wifi_box').slideUp(500, function () {
                n--;
                d(this).remove();
            });
            if (device == 'computer') {
                g.setmenuheight();
            }
        })
    }

    function refreshAlone() {
        var wifi_list_id, ssid_id, passwd_id, disabled_id, hidden_id, rekey_id, wds_id, isolate_id, hwmode_id, wmm_id,
            maxnum_id, wlength, shortgi_id, frag_id, rts_id, txpower_id, country_id, txpower;

        /*wifistatus start*/
        d.each(rwinfo, function (n, m) {
            d('#checkbox_' + m.flag).attr('checked', false);
            var ssid_html, handle_html, this_html = '';
            if (wwan_info) {
                if (wwan_info.device == "radio0") {
                    rep_config.wwan_num = 6;
                    rep_config.radio_num = 0;
                } else if (wwan_info.device == "radio1") {
                    rep_config.wwan_num = 14;
                    rep_config.radio_num = 1;
                }
                wlength = m.wifis.length - 2;
            } else {
                wlength = m.wifis.length - 1;
            }
            defaultwifihtml('wifi_', m.flag);

            hwmode_id = 'hwmode_' + m.flag;
            shortgi_id = '#shortgi_' + m.flag;
            frag_id = '#frag_' + m.flag;
            rts_id = '#rts_' + m.flag;
            txpower_id = '#txpower_' + m.flag;
            country_id = '.country';

            txpower = m.txpower_level;
            if (m.shortgi == "1") {
                d(shortgi_id).attr("checked", true);
            } else if (m.shortgi == "0") {
                d(shortgi_id).attr("checked", false);
            }
            d(frag_id).val(m.frag);
            d(rts_id).val(m.rts);

            if (m.flag == '24g') {
                d(hwmode_id).val(m.hwmode)
            }

            if (txpower != '' || String(txpower) == '0') {
                d(txpower_id).val(txpower);
            } else {
                d(txpower_id).val(1000);
            }

            h.append_channel("#channels_" + m.flag, m.country, m.channel, m.flag, m.htmode, m.no_ht80_with_11a, 0);
            h.append_htmode("#bandwidth_" + m.flag, m.htmode, m.flag, m.no_ht80_with_11a);
            d(country_id).val(m.country);

            d.each(m.wifis, function (x, y) {
                rekey_id = '#rekey_' + m.flag;
                wds_id = '#wds_' + m.flag;
                isolate_id = '#isolate_' + m.flag;
                wmm_id = '#wmm_' + m.flag;
                maxnum_id = '#maxassoc_' + m.flag;

                if (x < wlength) {
                    if (y.device != '' && y.encryption != '' && !(y.ssid == '' && y.mesh_id == '') && y.ifname.indexOf("vif-sta0") < 0) {
                        wifi_list_id = 'wifi_' + m.flag + '_' + x;
                        ssid_id = 'ssid_' + m.flag + '_' + x;
                        passwd_id = 'passwd_' + m.flag + '_' + x;
                        disabled_id = 'disabled_' + m.flag + '_' + x;
                        hidden_id = 'hidden_' + m.flag + '_' + x;

                        ssid_html = buildssidhtml(x, ssid_id);
                        handle_html = buildhandlehtml(x, disabled_id, hidden_id);
                        this_html = buildlisthtml(ssid_html, handle_html, wifi_list_id, passwd_id, disabled_id, hidden_id, x);
                        d('#wifi_manger_' + m.flag).before(this_html);

                        if (y.mode == 'ap') {
                            d('#' + ssid_id).val(y.ssid);
                            d('#' + ssid_id).attr("data-network", y.network || "lan");
                        } else {
                            d('#' + ssid_id).val(y.mesh_id);
                            d('#' + ssid_id).attr("data-network", y.network || "lan");
                        }

                        if (y.disabled == "0") {
                            d('#' + disabled_id).attr("checked", true);
                        } else if (y.disabled == "1") {
                            d('#' + disabled_id).attr("checked", false);
                        }

                        if (y.wpa_group_rekey == "0" && x == 0) {
                            d(rekey_id).attr("checked", false);
                        } else if (y.wpa_group_rekey != "0" && x == 0) {
                            d(rekey_id).attr("checked", true);
                        }

                        if (y.wds == "1" && x == 0) {
                            d(wds_id).attr("checked", true);
                        } else if (y.wds == "0" && x == 0) {
                            d(wds_id).attr("checked", false);
                        }

                        if (y.isolate == "1" && x == 0) {
                            d(isolate_id).attr("checked", true);
                        } else if (y.isolate == "0" && x == 0) {
                            d(isolate_id).attr("checked", false);
                        }

                        if (y.wmm == "1" && x == 0) {
                            d(wmm_id).attr("checked", true);
                        } else if (y.wmm == "0" && x == 0) {
                            d(wmm_id).attr("checked", false);
                        }

                        if (x == 0) {
                            d(maxnum_id).val(y.maxassoc);
                        }

                        if (y.encryption != "none") {
                            d('#' + passwd_id).val(y.key);
                        }

                        if (y.hidden == "0") {
                            d('#' + hidden_id).attr("data-value", '0').addClass('show_ssid')
                        } else {
                            d('#' + hidden_id).attr("data-value", '1').addClass('hidden_ssid')
                        }
                    }
                } else {
                    if (y.device == '') {
                        d("#wifi_manger_" + m.flag).html("");
                        return false;
                    }
                    ssid_id = '#ssid_manger_' + m.flag;
                    passwd_id = '#passwd_manger_' + m.flag;
                    disabled_id = '#disabled_manger_' + m.flag;
                    hidden_id = '#hidden_manger_' + m.flag;

                    d(ssid_id).val(y.ssid);
                    if (y.encryption != "none") {
                        d(passwd_id).val(y.key);
                    }

                    if (y.disabled == "1") {
                        d(disabled_id).prop("checked", false);
                    } else if (y.disabled == "0") {
                        d(disabled_id).prop("checked", true).attr("checked", "checked");
                    }

                    d(hidden_id).attr("checked", true);
                }
            });
        });
        /*wifistatus end*/
        g.volide('.alone_wifi', nowLang, device);
    }

    function refreshCombine() {
        var wifi_list_id, ssid_id, passwd_id, disabled_id, hidden_id, rekey_id, wds_id, isolate_id, hwmode_id, wmm_id,
            maxnum_id, wlength, shortgi_id, frag_id, rts_id, txpower_id, country_id, txpower;

        /*wifistatus start*/
        d.each(rwinfo, function (n, m) {
            d('#checkbox_combine').attr('checked', false);
            var ssid_html, handle_html, this_html = '';
            if (n == 0) {
                if (wwan_info) {
                    if (wwan_info.device == "radio0") {
                        rep_config.wwan_num = 6;
                        rep_config.radio_num = 0;
                    } else if (wwan_info.device == "radio1") {
                        rep_config.wwan_num = 14;
                        rep_config.radio_num = 1;
                    }
                    wlength = m.wifis.length - 2;
                } else {
                    wlength = m.wifis.length - 1;
                    
                }
            }
            defaultcombine('wifi_', "combine");

            hwmode_id = '#hwmode_combine';
            shortgi_id = '#shortgi_combine';
            frag_id = '#frag_combine';
            rts_id = '#rts_combine';
            txpower_id = '#txpower_combine';
            country_id = '.country_combine';

            txpower = m.txpower_level;
            if (m.shortgi == "1") {
                d(shortgi_id).attr("checked", true);
            } else if (m.shortgi == "0") {
                d(shortgi_id).attr("checked", false);
            }
            d(frag_id).val(m.frag);
            d(rts_id).val(m.rts);

            if (m.flag == '24g') {
                d(hwmode_id).val(m.hwmode)
            }

            if (txpower != '' || String(txpower) == '0') {
                d(txpower_id).val(txpower);
            } else {
                d(txpower_id).val(1000);
            }

            h.append_channel("#channels_combine_" + m.flag, m.country, m.channel, m.flag, m.htmode, m.no_ht80_with_11a, 0);
            h.append_htmode("#bandwidth_combine_" + m.flag, m.htmode, m.flag, m.no_ht80_with_11a);
            d(country_id).val(m.country);

            if (n == 0) {
                d.each(m.wifis, function (x, y) {
                    rekey_id = '#rekey_combine';
                    wds_id = '#wds_combine';
                    isolate_id = '#isolate_combine';
                    wmm_id = '#wmm_combine';
                    maxnum_id = '#maxassoc_combine';

                    if (x < wlength) {
                        if (y.device != '' && y.encryption != '' && !(y.ssid == '' && y.mesh_id == '') && y.ifname.indexOf("vif-sta0") < 0) {
                            wifi_list_id = 'wifi_combine_' + x;
                            ssid_id = 'ssid_combine_' + x;
                            passwd_id = 'passwd_combine_' + x;
                            disabled_id = 'disabled_combine_' + x;
                            hidden_id = 'hidden_combine_' + x;

                            ssid_html = buildssidhtml(x, ssid_id);
                            handle_html = buildhandlehtml(x, disabled_id, hidden_id);
                            this_html = buildlisthtml(ssid_html, handle_html, wifi_list_id, passwd_id, disabled_id, hidden_id, x);
                            d('#wifi_manger_combine').before(this_html);

                            if (y.mode == 'ap') {
                                d('#' + ssid_id).val(y.ssid);
                                d('#' + ssid_id).attr("data-network", y.network || "lan");
                            } else {
                                d('#' + ssid_id).val(y.mesh_id);
                                d('#' + ssid_id).attr("data-network", y.network || "lan");
                            }
                            if (y.disabled == "0") {
                                d('#' + disabled_id).attr("checked", true);
                            } else if (y.disabled == "1") {
                                d('#' + disabled_id).attr("checked", false);
                            }

                            if (y.wpa_group_rekey == "0" && x == 0) {
                                d(rekey_id).attr("checked", false);
                            } else if (y.wpa_group_rekey != "0" && x == 0) {
                                d(rekey_id).attr("checked", true);
                            }

                            if (y.wds == "1" && x == 0) {
                                d(wds_id).attr("checked", true);
                            } else if (y.wds == "0" && x == 0) {
                                d(wds_id).attr("checked", false);
                            }

                            if (y.isolate == "1" && x == 0) {
                                d(isolate_id).attr("checked", true);
                            } else if (y.isolate == "0" && x == 0) {
                                d(isolate_id).attr("checked", false);
                            }

                            if (y.wmm == "1" && x == 0) {
                                d(wmm_id).attr("checked", true);
                            } else if (y.wmm == "0" && x == 0) {
                                d(wmm_id).attr("checked", false);
                            }

                            if (x == 0) {
                                d(maxnum_id).val(y.maxassoc);
                            }

                            if (y.encryption != "none") {
                                d('#' + passwd_id).val(y.key);
                            }

                            if (y.hidden == "0") {
                                d('#' + hidden_id).attr("data-value", '0').addClass('show_ssid')
                            } else {
                                d('#' + hidden_id).attr("data-value", '1').addClass('hidden_ssid')
                            }
                        }
                    } else {
                        if (y.device == '') {
                            d("#wifi_manger_combine").html("");
                            return false;
                        }
                        ssid_id = '#ssid_manger_combine';
                        passwd_id = '#passwd_manger_combine';
                        disabled_id = '#disabled_manger_combine';
                        hidden_id = '#hidden_manger_combine';

                        d(ssid_id).val(y.ssid);
                        if (y.encryption != "none") {
                            d(passwd_id).val(y.key);
                        }

                        if (y.disabled == "1") {
                            d(disabled_id).prop("checked", false);
                        } else if (y.disabled == "0") {
                            d(disabled_id).prop("checked", true).attr("checked", "checked");
                        }

                        d(hidden_id).attr("checked", true);
                    }
                });
            }
        });
        /*wifistatus end*/
        g.volide('.wifi_box_combine', nowLang, device);
    }

    function buildssidhtml(i, ssid) {
        if (i == 0) {
            return '<input class="text require isSSID nullSSID" type="text" id="' + ssid + '">';
        } else {
            return '<input class="text require nullSSID isSSID" type="text" id="' + ssid + '">';
        }
    }

    function buildhandlehtml(i, disabledid, hiddenid) {
        if(device == "computer") {
            if (i == 0) {
                return '<div class="col-xs-4 hide-xs"><div class="row"><input type="checkbox" id="' + disabledid + '" class="MCB"></div></div><div class="col-xs-4 col-sm-4"><div class="row" style="text-align: center"><label id="' + hiddenid + '" et="click:checkssid" class="iconfont"></label></div></div><div class="col-xs-4 col-sm-8 wifi_add"><div class="row"><i class="iconfont icon-wifiadd"></i></div></div>';
            } else {
                return '<div class="col-xs-4 hide-xs"><div class="row"><input type="checkbox" id="' + disabledid + '" class="MCB"></div></div><div class="col-xs-4 col-sm-4"><div class="row" style="text-align: center"><label id="' + hiddenid + '" et="click:checkssid"  class="iconfont"></label></div></div><div class="col-xs-4 col-sm-8 wifi_del"><div class="row"><i class="iconfont icon-wifidel"></i></div></div>';
            }
        } else {
            if (i == 0) {
                return '<div class="col-xs-10"><div class="row"><input type="checkbox" id="' + disabledid + '" class="MCB"></div></div><div class="col-xs-4 col-sm-6"><div class="row" style="text-align: center"><label id="' + hiddenid + '" et="click:checkssid" class="iconfont"></label></div></div><div class="col-xs-4 col-sm-6 wifi_add"><div class="row"><i class="iconfont icon-wifiadd"></i></div></div>';
            } else {
                return '<div class="col-xs-10"><div class="row"><input type="checkbox" id="' + disabledid + '" class="MCB"></div></div><div class="col-xs-4 col-sm-6"><div class="row" style="text-align: center"><label id="' + hiddenid + '" et="click:checkssid" class="iconfont"></label></div></div><div class="col-xs-4 col-sm-6 wifi_del"><div class="row"><i class="iconfont icon-wifidel"></i></div></div>';
            }
        }
        
    }

    function buildlisthtml(ssid_html, handle_html, wifi_list_id, passwd_id, disabledid, hidden_id, index) {
        var this_html = '';
        if(device == "computer") {
            if (wan_info.workmode != "wds" && wan_info.workmode != "wisp") {
                this_html += '<li class="clearfix wifi_box row ' + wifi_list_id + '" id="' + wifi_list_id + '">';
                this_html += '<div class="col-xs-4"><div class="row"><label class="col-xs-5"><div class="row">' + SHpack['ssid'][nowLang] + '</div></label>';
                this_html += '<span class="col-xs-7">' + ssid_html + '</span></div></div>';
                this_html += '<div class="col-xs-4"><div class="row"><label class="col-xs-5"><div class="row" sh_lang="SHpack.ssid_psk">' + SHpack['ssid_psk'][nowLang] + '</div></label>';
                this_html += '<span class="col-xs-7"><input class="text require isSSIDPwd" type="text" id="' + passwd_id + '"></span></div></div>';
                this_html += '<div class="col-xs-4" style="text-align: center;height: 32px; line-height: 32px;"><div class="row">' + handle_html + '</div></li>';
            } else {
                this_html += '<li class="clearfix wifi_box row ' + wifi_list_id + '" id="' + wifi_list_id + '">';
                this_html += '<div class="col-xs-6"><div class="row"><label class="col-xs-3 "><div class="row">' + SHpack['ssid'][nowLang] + '</div></label>';
                this_html += '<span class="col-xs-9">' + ssid_html + '</span></div></div>';
                this_html += '<div class="col-xs-6"><div class="row"><label class="col-xs-4"><div class="row" sh_lang="SHpack.ssid_psk">' + SHpack['ssid_psk'][nowLang] + '</div></label>';
                this_html += '<span class="col-xs-8"><input class="text require isSSIDPwd" type="text" id="' + passwd_id + '"></span></div></div>';
                this_html += '<div class="col-xs-4 hidden" style="text-align: center;height: 32px; line-height: 32px;"><div class="row">' + handle_html + '</div></li>';
            }
        } else {
            if (wan_info.workmode != "wds" && wan_info.workmode != "wisp") {
                // this_html += '<li class="clearfix wifi_box row ' + wifi_list_id + '" id="' + wifi_list_id + '">';
                // this_html += '<div class="col-xs-5"><div class="row"><label class="col-xs-6"><div class="row">' + SHpack['ssid'][nowLang] + '</div></label>';
                // this_html += '<span class="col-xs-6">' + ssid_html + '</span></div></div>';
                // this_html += '<div class="col-xs-5"><div class="row"><label class="col-xs-6"><div class="row" sh_lang="SHpack.ssid_psk">' + SHpack['ssid_psk'][nowLang] + '</div></label>';
                // this_html += '<span class="col-xs-6"><input class="text require isSSIDPwd" type="text" id="' + passwd_id + '"></span></div></div>';
                // this_html += '<div class="col-xs-2" style="text-align: center;height: 32px; line-height: 32px;overflow-x: auto;"><div class="row" style="display: flex;width: 100px">' + handle_html + '</div></li>';

                this_html += '<div class="wifi_box flex-center ' + wifi_list_id + '" id="' + wifi_list_id + '">'
                this_html += '<div class="left">'
                this_html += '<div class="flex-start">'
                this_html += '<span class="text-width">' + SHpack['ssid'][nowLang] + '</span>'
                this_html += '<div class="inputDiv">' + ssid_html + '</div>'
                this_html += '<div class="flex-center">'
                this_html += '<input type="checkbox" id="' + disabledid + '" class="MCB">'
                this_html += '</div>'
                this_html += '</div>'
                this_html += '<div class="flex-start">'
                this_html += '<span class="text-width">' + SHpack['ssid_psk'][nowLang] + '</span>'
                this_html += '<div class="inputDiv"><input class="text require isSSIDPwd" type="text" id="' + passwd_id + '"></div>'
                this_html += '<label id="' + hidden_id + '" et="click:checkssid" class="iconfont"></label>'    
                this_html += '</div>'
                this_html += '</div>'                
                this_html += '<div class="d-right flex-center">'
                this_html += '<li class="iconfont ' + (index == 0 ? 'wifi_add icon-wifiadd' : 'wifi_del icon-wifidel') + '"></li>'
                this_html += '</div>'
                this_html += '</div>'
                                
            } else {
                

                this_html += '<div class="wifi_box flex-center ' + wifi_list_id + '" id="' + wifi_list_id + '">'
                this_html += '<div class="left">'
                this_html += '<div class="flex-start">'
                this_html += '<span class="text-width">' + SHpack['ssid'][nowLang] + '</span>'
                this_html += '<div class="inputDiv">' + ssid_html + '</div>'
                
                this_html += '</div>'
                this_html += '<div class="flex-start">'
                this_html += '<span class="text-width">' + SHpack['ssid_psk'][nowLang] + '</span>'
                this_html += '<div class="inputDiv"><input class="text require isSSIDPwd" type="text" id="' + passwd_id + '"></div>'
                this_html += '</div>'
                this_html += '</div>' 
                this_html += '</div>'
            }
        }
        return this_html;
    }

    function manager_iface(radio_num, disabled, ssid, passwd, wlannum, meshmode) {
        return new_iface(radio_num, disabled, "lan", ssid, passwd, "1", wlannum, "", "3", "", "", "1", meshmode);
    }

    function disable_iface(wlannum) {
        return new_iface(-1, "1", "", "", "", "", "", "", "", "", "", "", "", "0");
    }

    function new_iface(radio_num, disabled, network, ssid, passwd, hidden, wlannum, wmm, maxassoc, isolate, rekey, wds, meshmode, openorclose) {
        var radioname = "radio" + radio_num;
        if (wlannum === '') {
            var wlanname = "";
        } else {
            var wlanname = "wlan" + wlannum;
        }

        var iface_config = {};
        iface_config.encryption = "";
        iface_config.key = "";

        if (radio_num > -1) {
            iface_config.device = radioname;
            iface_config.network = network || 'lan';
            iface_config.mode = 'ap';
        } else {
            iface_config.device = "";
            iface_config.network = "";
            iface_config.mode = '';
        }

        if (rekey == 0) {
            iface_config.wpa_group_rekey = "0";
            iface_config.wpa_pair_rekey = "0";
            iface_config.wpa_master_rekey = "0";
            iface_config.disassoc_low_ack = "0";
        }

        (hidden == "" && !openorclose) ? iface_config.hidden = '' : iface_config.hidden = hidden;
        (wmm == "" && !openorclose) ? iface_config.wmm = '' : iface_config.wmm = wmm;
        if (iface_config.mode == 'mesh') {
            (ssid == "" && !openorclose) ? iface_config.mesh_id = '' : iface_config.mesh_id = ssid;
            iface_config.ssid = '';
        } else {
            (ssid == "" && !openorclose) ? iface_config.ssid = '' : iface_config.ssid = ssid;
            iface_config.mesh_id = '';
        }

        (ssid == "") ? iface_config.disabled = '1' : iface_config.disabled = disabled;
        (isolate == "" && !openorclose) ? iface_config.isolate = '' : iface_config.isolate = isolate;
        (maxassoc == "" && !openorclose) ? iface_config.maxassoc = '' : iface_config.maxassoc = maxassoc;
        (wds == "" && !openorclose) ? iface_config.wds = '' : iface_config.wds = wds;
        (wlanname == "" && !openorclose) ? iface_config.ifname = '' : iface_config.ifname = wlanname;
        if (radio_num > -1) {
            if (passwd != "") {
                iface_config.encryption = "psk2+ccmp";
                iface_config.key = passwd;
            } else {
                iface_config.encryption = "none";
                iface_config.key = '';
            }
        }
        return iface_config;
    }

    d('.adv_box').on('click', function () {
        var advbox = d(this).attr('data-value');
        d('.' + advbox).toggleClass('hide');
        if (device == 'computer') {
            g.setmenuheight();
        }
    });

    d(".combineSwitch").on("click", function () {
        d('#alone').toggle();
        d('#combine').toggle();
    });

    et.combineFun = function () {
        var config;
        if (!g.volide_wifi_ok('.combineWifi')) {
            g.shconfirm(nowLang, SHtips.parame_error[nowLang], "error");
            return;
        }

        if (web_lock) {
            return;
        }

        if (config = configCombine()) {
            web_lock = true;
            set_config(config);
        } else {
            web_lock = false;
        }
    };

    function configCombine() {
        var oThis, listsinfo, listlength, hidden, network, disabled, rekey, wds, meshmode, wmm, disabled_manger,
            isolate,
            maxassoc, adminflag;
        wifi_array = [];

        d.each(rwinfo, function (n, m) {
            /*get radios_config*/
            config.radios[n].country = d('#country_combine').val();
            config.radios[n].htmode = d('#bandwidth_combine_' + m.flag).val();
            config.radios[n].channel = d('#channels_combine_' + m.flag).val();
            config.radios[n].frag = d('#frag_combine').val();
            config.radios[n].rts = d('#rts_combine').val();
            config.radios[n].txpower_level = d('#txpower_combine').val();
            delete(config.radios[n].txpower);

            if (m.flag == '24g') {
                adminflag = '2g';
                if (d('#hwmode_combine').val() == "11g") {
                    config.radios[n].htmode = "NOHT";
                }
            } else {
                adminflag = '5g';
            }

            if (d('#shortgi_combine').attr("checked") == 'checked') {
                config.radios[n].shortgi = "1";
            } else {
                config.radios[n].shortgi = "0";
            }

            /*get wifi_config*/
            if (d('#rekey_combine').attr("checked") == 'checked') {
                rekey = "1";
            } else {
                rekey = "0";
            }

            if (d('#wds_combine').attr("checked") == 'checked') {
                wds = "1";
            } else {
                wds = "0";
            }

            if (d('#wmm_combine').attr("checked") == 'checked') {
                wmm = "1";
            } else {
                wmm = "0";
            }
            if (d('#isolate_combine').attr("checked") == 'checked') {
                isolate = "1";
            } else {
                isolate = "0";
            }
            maxassoc = d('#maxassoc_combine').val();
            listsinfo = d("[id^='wifi_combine_']");
            listlength = listsinfo.length;

            for (var i = 0; i < listlength; i++) {
                oThis = d(listsinfo[i]);
                hidden = oThis.find('[id^="hidden_combine_"]').attr('data-value') || '0';

                if (oThis.find('[id^="disabled_combine_"]').attr("checked") == 'checked') {
                    disabled = "0";
                } else {
                    disabled = "1";
                }

                m.wifis[i] = new_iface(n, disabled, oThis.find('[id^="ssid_combine_"]').attr("data-network"),
                    oThis.find('[id^="ssid_combine_"]').val(), oThis.find('[id^="passwd_combine_"]').val(),
                    hidden, 8 * n + i, wmm, maxassoc, isolate, rekey, wds, meshmode);
            }

            for (i = listlength; i < m.wifis.length - 1; i++) {
                //后面没使用的ssid 置空
                m.wifis[i] = disable_iface(8 * n + i);
            }

            if (wwan_info) {
                disabled_manger = "1";
            } else {
                if (d('#disabled_manger_combine').attr("checked") == 'checked') {
                    disabled_manger = "0";
                } else {
                    disabled_manger = "1";
                }
            }

            if (m.wifis[m.wifis.length - 1].device != "") {
                m.wifis[m.wifis.length - 1] = manager_iface(n, disabled_manger, d('#ssid_manger_combine').val(), d('#passwd_manger_combine').val(), '_admin_' + adminflag, 'ap');
            }

            d.each(m.wifis, function (x, y) {
                wifi_array.push(y);
            })
        });
        config.wifis = wifi_array;
        config.combine_wifi = {};
        config.combine_wifi.enable = "1";
        return config;
    }

    et.setmode = function () {
        var config;

        if (!g.volide_wifi_ok('.wificont')) {
            g.shconfirm(nowLang, SHtips.parame_error[nowLang], "error");
            return;
        }

        if (web_lock) {
            return;
        }

        if (config = config_get()) {
            web_lock = true;
            set_config(config);
        } else {
            web_lock = false;
        }
    };

    function config_get() {
        var oThis, listsinfo, listlength, hidden, network, disabled, rekey, wds, meshmode, wmm, disabled_manger,
            isolate,
            maxassoc, adminflag;
        wifi_array = [];

        d.each(rwinfo, function (n, m) {
            /*get radios_config*/
            config.radios[n].country = d('.country').val();
            config.radios[n].htmode = d('#bandwidth_' + m.flag).val();
            config.radios[n].channel = d('#channels_' + m.flag).val();
            config.radios[n].frag = d('#frag_' + m.flag).val();
            config.radios[n].rts = d('#rts_' + m.flag).val();
            config.radios[n].txpower_level = d('#txpower_' + m.flag).val();
            delete(config.radios[n].txpower);

            if (m.flag == '24g') {
                adminflag = '2g';
                if (d('#hwmode_' + m.flag).val() == "11g") {
                    config.radios[n].htmode = "NOHT";
                }
            } else {
                adminflag = '5g';
            }

            if (d('#shortgi_' + m.flag).attr("checked") == 'checked') {
                config.radios[n].shortgi = "1";
            } else {
                config.radios[n].shortgi = "0";
            }

            /*get wifi_config*/
            if (d('#rekey_' + m.flag).attr("checked") == 'checked') {
                rekey = "1";
            } else {
                rekey = "0";
            }

            if (d('#wds_' + m.flag).attr("checked") == 'checked') {
                wds = "1";
            } else {
                wds = "0";
            }

            if (d('#wmm_' + m.flag).attr("checked") == 'checked') {
                wmm = "1";
            } else {
                wmm = "0";
            }
            if (d('#isolate_' + m.flag).attr("checked") == 'checked') {
                isolate = "1";
            } else {
                isolate = "0";
            }
            maxassoc = d('#maxassoc_' + m.flag).val();
            listsinfo = d("[id^='wifi_" + m.flag + "_']");
            listlength = listsinfo.length;

            for (var i = 0; i < listlength; i++) {
                oThis = d(listsinfo[i]);
                hidden = oThis.find('[id^="hidden_' + m.flag + '_"]').attr('data-value') || '0';

                if (oThis.find('[id^="disabled_' + m.flag + '_"]').attr("checked") == 'checked') {
                    disabled = "0";
                } else {
                    disabled = "1";
                }

                m.wifis[i] = new_iface(n, disabled, oThis.find('[id^="ssid_' + m.flag + '_"]').attr("data-network"),
                    oThis.find('[id^="ssid_' + m.flag + '_"]').val(), oThis.find('[id^="passwd_' + m.flag + '_"]').val(),
                    hidden, 8 * n + i, wmm, maxassoc, isolate, rekey, wds, meshmode);
            }

            for (i = listlength; i < m.wifis.length - 1; i++) {
                //后面没使用的ssid 置空
                m.wifis[i] = disable_iface(8 * n + i);
            }

            if (wwan_info) {
                disabled_manger = "1";
            } else {
                if (d('#disabled_manger_' + m.flag).attr("checked") == 'checked') {
                    disabled_manger = "0";
                } else {
                    disabled_manger = "1";
                }
            }

            if (m.wifis[m.wifis.length - 1].device != "") {
                m.wifis[m.wifis.length - 1] = manager_iface(n, disabled_manger, d('#ssid_manger_' + m.flag).val(), d('#passwd_manger_' + m.flag).val(), '_admin_' + adminflag, 'ap');
            }

            d.each(m.wifis, function (x, y) {
                wifi_array.push(y);
            })
        });
        config.wifis = wifi_array;
        config.combine_wifi = {};
        config.combine_wifi.enable = "0";
        return config;
    }

    function set_config(arg) {
        f.setguide(arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(35, gohref);
            }
        });
    }

    function gohref() {
        window.location.href = 'http://' + location.hostname + '/' + device + '/index.html';
    }
});
