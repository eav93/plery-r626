define(function(require, exports) {
	var d = require("jquery"),
		e = require("mbox"),
		f = require("util"),
		g = require("function"),
		nowLang,
		et = {};

	require("checkbox")(d);

	var device, config, lan_info, radios_info, wan_info, wifis_info, scanlist_data, web_lock = false;
	var rwinfo, wifi_array = {},
		scanflag = 0,
		rep_config, link_type = '';

	var combineExist = 0,
		combineStatus = 0;

	exports.init = function() {
		e.plugInit(et, start_model);
	};

	function start_model(data) {
		nowLang = data.language.language;
		device = d('body').attr('device');
		g.common(nowLang, device);
		g.volide('.shbox', nowLang, device);
		g.chgTabs('radio_tabs', 'radio_boxs');
		refresh_init();
		if (device == 'computer') {
			g.setmenuheight();
		}
	}

	function refresh_init() {
		f.getguide(function(data) {
			if (data.errCode == '0') {
				config = d.extend(true, {}, data);
				lan_info = data.lan;
				radios_info = data.radios;
				rwinfo = d.extend(true, [], radios_info);
				wan_info = data.wan;
				wifis_info = data.wifis;
				rep_config = data.wwan || {};

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

	d(".combineSwitch").on("click", function() {
		d('#alone').toggle();
		d('#combine').toggle();
	});

	et.next = function(evt) {
		ifNext(evt);
	};

	et.nextend = function(evt) {
		ifNext(evt, readSet)
	};

	et.prev = function() {
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

	et.skipped = function() {
		window.location.href = 'index.html';
	};

	function ifNext(obj, callback) {
		var require = d(obj).parents('.wizard_box');
		var requires = d(obj).parents('.wizard_box').find('.require');
		var num = require.index() + 2;
		requires.each(function() {
			if (d(this).is(":visible") && d(this).attr('disabled') != 'disabled') {
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
		this_html = '<li class="list clearfix"><label class="left" sh_lang="SHpack.ip_addr">' + SHpack['ip_addr'][nowLang] +
			'</label><span class="right">' + d('#lan_ip_id').val() + '</span></li>';
		this_html += '<li class="list clearfix"><label class="left" sh_lang="SHpack.netmask">' + SHpack['netmask'][nowLang] +
			'</label><span class="right">' + d('#lan_netmask_id').val() + '</span></li>';
		if (d('.w24g').length) {
			this_html += '<li class="list clearfix"><label class="left" sh_lang="SHpack.ssid_name_24g">' + SHpack[
				'ssid_name_24g'][nowLang] + '</label><span class="right">' + d('#ssid_id_24g').val() + '</span></li>';
		}
		if (d('.w58g').length) {
			this_html += '<li class="list clearfix"><label class="left" sh_lang="SHpack.ssid_name_58g">' + SHpack[
				'ssid_name_58g'][nowLang] + '</label><span class="right">' + d('#ssid_id_58g').val() + '</span></li>';
		}
		d('#readSet').html(this_html);
	}

	et.showscan = function() {
		confirmBox({
			message: '.popSSID',
			title: '',
			vBtn: 'none'
		});
		d("#wlanscanbody_id").html('');
		d("#loading_pic").show();
		scanwifis();
	};

	et.refresh = function() {
		d("#loading_pic").show();
		d("#wlanscanbody_id").html('');
		scanwifis();
	};

	et.sel_ssid = function(evt) {
		var list_num = d(evt).parents('.scanlist').find('.list_num').html();
		rep_config.ssid = scanlist_data[list_num].ssid;
		rep_config.iface = d(evt).parents('.scanlist').find('.radio_num').html();
		rep_config.radio_num = d(evt).parents('.scanlist').find('.radio_num').html();
		rep_config.radio = d(evt).parents('.scanlist').find('.radio').html();
		rep_config.channel = d(evt).parents('.scanlist').find('.channel').text();
		rep_config.bssid = scanlist_data[list_num].address;
		// window.WEPflag = ""; 
		if (scanlist_data[list_num].encryption.toUpperCase().indexOf("NONE") > -1 ) {
			rep_config.encryption = "none";
			d("#rep_ssid_pwd").attr("disabled", true);
			sessionStorage.name = rep_config.encryption
		} else if (scanlist_data[list_num].encryption.toUpperCase().indexOf("WEP") > -1 ) { //0大于-1
			rep_config.encryption = "wep";
			d("#rep_ssid_pwd").attr("disabled", false)
			sessionStorage.name = rep_config.encryption
			// window.WEPflag = "wep";
		} else if (scanlist_data[list_num].encryption.toUpperCase().indexOf("WPA2") > -1 ) {
			if (scanlist_data[list_num].encryption.toUpperCase().indexOf("AES") > -1 ) {
				rep_config.encryption = "psk2";
			} else {
				rep_config.encryption = "psk2_tkip";
			}
			d("#rep_ssid_pwd").attr("disabled", false)
			sessionStorage.name = rep_config.encryption
		} else {
			if (scanlist_data[list_num].encryption.toUpperCase().indexOf("AES") > -1 ) {
				rep_config.encryption = "psk";
			} else {
				rep_config.encryption = "psk_tkip";
			}
			d("#rep_ssid_pwd").attr("disabled", false)
			sessionStorage.name = rep_config.encryption
		}
		d('#sta_ssid_id').removeClass('borError').parents('.shbox_border').find('.onError').remove();
		d('#rep_ssid_pwd').val('').removeClass('borError').parents('.shbox_border').find('.onError').remove();
		g.setvalue("#sta_ssid_id", rep_config.ssid);
		d('.close').click();
	};

	function getnumber(arg) {
		var reg = new RegExp('[0-9]\d*$');
		return reg.exec(arg);
	}

	function scanwifis() {
		if (scanflag) {
			return;
		}
		scanflag = 1;
		excessscan();
	}

	function excessscan() {
		var scanarg = {},
			scanlist = '';
		scanarg.ifname = d("#scan_band").val();

		f.getMConfig('wifi_scan', scanarg, function(data) {
			if (data.errCode == 0) {
				scanlist_data = data.scanResult;
				scanlist = buildscanlist(data.scanResult, getnumber(d("#scan_band").val()), d("#scan_band").val());
				d('#wlanscanbody_id').append(scanlist);
			}
			scanflag = 0;
			d('#loading_pic').hide();
		});
	}

	function buildscanlist(data, radio_num, radio) {
		var this_html = '';
		d.each(data, function(n, m) {
			this_html += '<tr class="scanlist">';
			this_html += '<td class="hide list_num">' + n + '</td>';
			this_html += '<td>' + (n + 1) + '</td>';
			if (device == 'mobile') {
				this_html += '<td class="bssid hide">' + m.address + '</td>';
			} else {
				this_html += '<td class="bssid">' + m.address + '</td>';
			}
			this_html += '<td class="radio hide">' + radio + '</td>';
			this_html += '<td class="radio_num hide">' + radio_num + '</td>';
			this_html += '<td class="ssid">' + g.escapeHtml(m.ssid) + '</td>';
			this_html += '<td class="channel">' + m.channel + '</td>';
			if (m.encryption == "none") {
				this_html += '<td class="encryption" ></td>';
			} else {
				this_html += '<td class="encryption"><i class = "iconfont icon-lock"></i></td>';
			}

			if (parseInt(m.quality) > 67) {
				this_html += '<td class="quality"><i class = "iconfont icon-signal_3" title="' + m.quality + '%"></i></td>';
			} else if (parseInt(m.quality) > 33) {
				this_html += '<td class="quality"><i class = "iconfont icon-signal_2" title="' + m.quality + '%"></i></td>';
			} else {
				this_html += '<td class="quality"><i class = "iconfont icon-signal_1" title="' + m.quality + '%"></i></td>';
			}

			if (device == 'mobile') {
				this_html += '<td><button class="icon-lianjie iconfont" et="tap:sel_ssid"></button></td>';
			} else {
				this_html += '<td><button class="icon-lianjie iconfont" et="click:sel_ssid"></button></td>';
			}

			this_html += '</tr>';
		});
		return this_html;
	}

	function ceartrwinfo() {
		var num = wifis_info.length / radios_info.length,
			radioFlag = 0,
			radioHtml = "";

		for (var n = 0; n < rwinfo.length; n++) {
			if (rwinfo[n].hwmode.indexOf('a') > -1) {
				radioFlag += 10;
				rwinfo[n].flag = '58g';
				radioHtml += '<option value="radio' + n + '">5.8GHz</option>';
			} else {
				radioFlag += 1;
				rwinfo[n].flag = '24g';
				radioHtml += '<option value="radio' + n + '">2.4GHz</option>';
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
		d("#scan_band").html(radioHtml);
		g.step('repeater_wizard');
	}

	function refresh_default() {
		if (!lan_info || !wan_info || !wifis_info || !radios_info) {
			return;
		}

		d("#scan_band").val(rep_config.device || "radio0");

		if (wan_info.proto == 'pppoe') {
			wan_info.proto = 'dhcp';
		}
		/*wanstatus start*/
		var clickprotoid = "#" + wan_info.proto + "_addr_id";

		g.setvalue('#static_ip_id', wan_info.ipaddr);
		g.setvalue('#static_gateway_id', wan_info.gateway);
		g.setvalue('#static_netmask_id', wan_info.netmask || "255.255.255.0");
		g.setvalue('#static_dns_id', wan_info.dns);
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
		d.each(rwinfo, function(n, m) {
			var ssid_id = '#ssid_id_' + m.flag,
				psk_id = '#psk_id_' + m.flag,
				country = '.country';
			g.setvalue(ssid_id, m.wifis[0].ssid);
			if (m.wifis[0].encryption != "none") {
				g.setvalue(psk_id, m.wifis[0].key);
			}
			d(country).val(m.country);

			if (n == 0) {
				var ssid_id_combine = '#ssid_id_combine',
					psk_id_combine = '#psk_id_combine';
				g.setvalue(ssid_id_combine, m.wifis[0].ssid);
				if (m.wifis[0].encryption != "none") {
					g.setvalue(psk_id_combine, m.wifis[0].key);
				}
			}
		});
		/*wifistatus end*/

		/*wwantatus start*/
		if (rep_config) {
			if (!rep_config.ssid) return;

			g.setvalue('#sta_ssid_id', rep_config.ssid);
			if (rep_config.key) {
				g.setvalue('#rep_ssid_pwd', rep_config.key);
				d("#rep_ssid_pwd").attr("disabled", false);
			} else {
				g.setvalue('#rep_ssid_pwd', '');
				d("#rep_ssid_pwd").attr("disabled", true);
			}

			rep_config.channel = rwinfo[getnumber(rep_config.device)].channel;
			rep_config.radio = rep_config.device;
			rep_config.radio_num = getnumber(rep_config.device);

			/*            set_radio = rep_config.device;
			 set_radio_num = parseInt(rep_config.device.split("radio")[1]);
			 set_bssid = rep_config.bssid;*/
		}
		/*wwanstatus end*/
	}

	function config_get() {
		var wan_config = {},
			lan_config = {},
			wwan_config = {};
		wifi_array = [];

		lan_config.ipaddr = d("#lan_ip_id").val();
		lan_config.netmask = g.trim_select(d("#lan_netmask_id").val());
		lan_config.enable = true;

		wan_config.mode = "wisp";

		wwan_config.ssid = d("#sta_ssid_id").val();
		wwan_config.encryption = rep_config.encryption;

		if (wwan_config.encryption == "none") {
			wwan_config.key = "";
		} else if (wwan_config.encryption == "wep") {
			wwan_config.wep_key = d("#rep_ssid_pwd").val();
			wwan_config.key = "";
			if (wwan_config.wep_key.length == 5 || 13 == wwan_config.wep_key.length) {
				wwan_config.key_type = "1";
			} else {
				wwan_config.key_type = "0";
			}
		} else {
			wwan_config.key = d("#rep_ssid_pwd").val();
		}

		wwan_config.encryption = wwan_config.encryption.toLowerCase();
		wwan_config.radio = rep_config.radio;
		wwan_config.channel = rep_config.channel;
		wwan_config.bssid = rep_config.bssid;
		wwan_config.radio_num = parseInt(rep_config.radio_num);

		/*if (rep_config.radio_num == '0') {
		 wwan_config.iface = 6;
		 } else {
		 wwan_config.iface = 14;
		 }*/

		d.each(rwinfo, function(n, m) {
			if (n == rep_config.radio_num) {
				config.radios[n].channel = rep_config.channel;
			}

			if (m.flag == '24g') {
				config.radios[n].hwmode = "11bgn";
			}
			delete(config.radios[n].txpower_level);
			delete(config.radios[n].txpower);
			if (d('#combineSwitch').attr("checked") == 'checked') {
				config.combine_wifi.enable = "1";
			} else {
				config.combine_wifi.enable = "0";
			}

			if (config.combine_wifi.enable == "1") {
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


			d.each(m.wifis, function(x, y) {
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

	et.setmode = function() {
		config_get();
		set_config(config);
	};

	function set_config(arg) {
		if (web_lock) {
			return;
		}
		web_lock = true;
		f.setguide(arg, function(data) {
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
			location.href = location.href;
		}
	}

});
