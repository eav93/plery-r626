define(function(require, exports) {
	var d = require("jquery"),
		e = require("mbox"),
		f = require("util"),
		g = require("validate");

	/*WEP_config*/
	window.WEPflag = '';

	var nowLang, menu_html = '';
	var this_url = location.pathname;

	function applyRuntimeLanguage(lang) {
		var htmlLang = 'en';
		if (lang === 'ru') {
			htmlLang = 'ru';
		} else if (lang === 'cn') {
			htmlLang = 'zh-CN';
		}

		d('html').attr('lang', htmlLang).attr('translate', 'no').addClass('notranslate');
		d('body').attr('translate', 'no').addClass('notranslate');

		if (!d('meta[name="google"]').length) {
			d('<meta>', {name: 'google', content: 'notranslate'}).appendTo('head');
		}
	}

	/* common init */
	exports.login_init = function(data, device) {
		nowLang = data;
		applyRuntimeLanguage(nowLang);
		document.title = SHpack.global_title[nowLang];
        click_href()
		d('#login_out').on('click', function() {
			if (d('#sixmodel').length > 0) {
				location.replace(window.location.protocol + '//' + window.location.host);
			}
			f.loginout(function(data) {
				if (data.errCode == 0) {
					location.replace(window.location.protocol + '//' + window.location.host);
					return;
				}
			})
		});
	};

	function click_href() {
		d.ajax({
			type: 'GET',
			dataType: 'json',
			url: '/js/href.json',
			cache: false,
			success: function(data) {
				if (data.href != '') {
					d('#logo_herf').attr('href', data.href);
				}
			}
		})
	}

	/* common init */
	exports.common = function(data, device) {
		nowLang = data;
		applyRuntimeLanguage(nowLang);
		document.title = SHpack.global_title[nowLang];
		click_href()
		d('#login_out').on('click', function() {
			if (d('#sixmodel').length > 0) {
				location.replace(window.location.protocol + '//' + window.location.host);
			}
			f.loginout(function(data) {
				if (data.errCode == 0) {
					location.replace(window.location.protocol + '//' + window.location.host);
					return;
				}
			})
		});
		getmenu(device);
	};

	function get_config(a, b) {
		d.ajax({
			type: 'GET',
			dataType: 'json',
			cache: false,
			async: false,
			url: '/js/menu.json',
			success: a,
			error: b
		})
	}

	function getmenu(device) {
		var workmode;
		get_config(function(config) {
			f.getguide(function(data) {
				workmode = data.wan.workmode || 'router';
				pathmenu(config.menu, device, workmode, data.wan.proto);
				d('#subMenu .navigation').append(menu_html);
				menueffect();
			});
		});
	}

	function pathmenu(arg, device, workmode, proto) {
		var sh_lang;
		var pageflag = location.href.split('/').pop();
		d.each(arg, function (n, m) {
			sh_lang = eval(m.name);

			if (workmode == "ap" || workmode == "wds" || device == 'mobile') {
				if (m.id == 'iplimit') {
					return;
				}
			}

			if (m.childs && m.childs.length > 0) {
				menu_html += '<li class="item-has-children" id="menu_' + m.id + '">';
				menu_html += '<a class="iconfont"><i class="' + m.icon + '"></i><span  sh_lang="' + m.name + '">' + sh_lang[
					nowLang] + '</span></a>';
				var childsstring = JSON.stringify(m.childs);
				if (childsstring.indexOf(pageflag) > -1) {
					menu_html += '<ul class="sub-menu">';
				} else {
					menu_html += '<ul class="sub-menu" style="display: none;">';
				}
				d.each(m.childs, function (x, y) {
					sh_lang = eval(y.name);
					if ((y.id.indexOf('remote') > -1 || y.id.indexOf('wan') > -1 || y.id.indexOf('dns') > -1) && workmode !=
						'router') {
						return;
					}

					if ((y.id == 'vlan' || y.id == 'ssidvlan') && (workmode != 'router' && workmode != 'wisp')) {
						return;
					}
					if (y.id == 'band' && proto != 'qmi') {
						return;
					}

					if ( (y.id.indexOf('last') > -1 || y.id.indexOf('upnp') > -1 || m.id.indexOf('remote') > -1) && device == 'mobile') {
						return;
					}

					if (y.childs && y.childs.length > 0) {
						menu_html += '<li class="item-has-children" id="menu_' + y.id + '">';
						menu_html += '<a sh_lang="' + y.name + '"><span>' + sh_lang[
							nowLang] + '</span></a>';
						var childsLast = JSON.stringify(y.childs);
						if (childsLast.indexOf(pageflag) > -1) {
							menu_html += '<ul class="sub-menu">';
						} else {
							menu_html += '<ul class="sub-menu" style="display: none;">';
						}

						d.each(y.childs, function (z, x) {
							// if (x.id.indexOf('pptpuser') > -1 && device == 'mobile') {
							// 	return;
							// }
							sh_lang = eval(x.name);
							if (this_url.indexOf(x.urls) > -1) {
								menu_html += '<li id="menu_' + x.id + '"><a class="active" href="' + x.urls + '"  sh_lang="' + x.name +
									'">' + sh_lang[nowLang] + '</a></li>'
							} else {
								menu_html += '<li id="menu_' + x.id + '"><a href="' + x.urls + '"  sh_lang="' + x.name + '">' + sh_lang[
									nowLang] + '</a></li>'
							}
						})
						menu_html += '</ul>';

					} else {
						if (this_url.indexOf(y.urls) > -1) {
							menu_html += '<li id="menu_' + y.id + '"><a class="active" href="' + y.urls + '"  sh_lang="' + y.name +
								'">' + sh_lang[nowLang] + '</a></li>'
						} else {
							menu_html += '<li id="menu_' + y.id + '"><a href="' + y.urls + '"  sh_lang="' + y.name + '">' + sh_lang[
								nowLang] + '</a></li>'
						}
					}
					// sh_lang = eval(y.name);
					// 	if (this_url.indexOf(y.urls) > -1) {
					// 		menu_html += '<li id="menu_' + y.id + '"><a class="active" href="' + y.urls + '"  sh_lang="' + y.name +
					// 			'">' + sh_lang[nowLang] + '</a></li>'
					// 	} else {
					// 		menu_html += '<li id="menu_' + y.id + '"><a href="' + y.urls + '"  sh_lang="' + y.name + '">' + sh_lang[
					// 			nowLang] + '</a></li>'
					// 	}


				});
				menu_html += '</ul>';
			} else {
				menu_html += '<li id="menu_' + m.id + '">';
				if (this_url.indexOf(m.urls) > -1) {
					menu_html += '<a class="active" href="' + m.urls + '"><i class="' + m.icon + '"></i>' +
						'<span sh_lang="' + m.name + '">' + sh_lang[nowLang] + '</span></a>';
				} else {
					menu_html += '<a href="' + m.urls + '"><i class="' + m.icon + '"></i>' +
						'<span sh_lang="' + m.name + '">' + sh_lang[nowLang] + '</span></a>';
				}
			}
			menu_html += '</li>';
		});
	}

	function menueffect() {
		var $header_menu = d('.header_menu'),
			$main_content = d('.main_content'),
			$header = d('header');
		$header_menu.on('click', function(event) {
			event.preventDefault();
			$header_menu.toggleClass('is-clicked');
			$header.toggleClass('menu_open');
			$main_content.toggleClass('menu_open').one(
				'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',
				function() {
					d('body').toggleClass('overflow-hidden');
				});
			d('.nav').toggleClass('menu_open');

			if (d('html').hasClass('no-csstransitions')) {
				d('body').toggleClass('overflow-hidden');
			}
		});
		$main_content.on('click', function(event) {
			if (!d(event.target).is('.header_menu, .header_menu span')) {
				$header_menu.removeClass('is-clicked');
				$header.removeClass('menu_open');
				$main_content.removeClass('menu_open').one(
					'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',
					function() {
						d('body').removeClass('overflow-hidden');
					});
				d('.nav').removeClass('menu_open');
				if (d('html').hasClass('no-csstransitions')) {
					d('body').removeClass('overflow-hidden');
				}

			}
		});
		d('.subMenu').on('click', '.item-has-children > a', function(event) {
			event.preventDefault();
			d(this).next('.sub-menu').slideToggle(200).end().parent('.item-has-children').siblings('.item-has-children').children(
				'a').next('.sub-menu').slideUp(200);
		});
	}

	exports.step = function(model, opt) {
		var not_radio, remove_div;
		if (!model) {
			return;
		}
		var $html = [],
			$arr;
		get_config(function(data) {
			$arr = data[model];
			if (opt) {
				not_radio = 'wf' + opt;
				remove_div = 'w' + opt;
				d.each($arr, function(n, m) {
					if (m == not_radio) {
						$arr.splice(n, 1);
					}
				});
				d('.' + remove_div).remove();
			}
			$html += '<ul>';
			for (var i = 0; i < $arr.length; i++) {
				if (i == 0) {
					$html += '<li class="active"><span>' + (parseInt(i) + 1) + '</span><em sh_lang="SHpack.' + [$arr[i]] + '">' +
						SHpack[$arr[i]][nowLang] + '</em></li>'
				} else if (i == ($arr.length - 1)) {
					$html += '<li><span><i class="iconfont icon-gou"></i></span><em sh_lang="SHpack.' + [$arr[i]] + '">' + SHpack[
						$arr[i]][nowLang] + '</em></li>'
				} else {
					$html += '<li><span>' + (parseInt(i) + 1) + '</span><em sh_lang="SHpack.' + [$arr[i]] + '">' + SHpack[$arr[i]]
						[nowLang] + '</em></li>'
				}
			}
			d('.shstep').html($html);
		})
	}

	exports.isEnglish = function(data) {
		return g.isEnglish(data);
	};

	exports.checkChar = function(data) {
		return g.checkChar(data);
	};

	exports.special = function(data) {
		return g.special(data);
	};

	exports.isIpaddr = function(data) {
		return g.isIpaddr(data);
	};

	exports.login = function(user, pass, callback) {
		var my = new Object;
		my.username = user;
		my.password = pass;
		d.post("/cgi-bin/login", JSON.stringify(my), function(a) {
			callback(a.errCode)
		})
	};

	exports.setvalue = function(obj, data) {
		if (data != '' && data != undefined) {
			d(obj).val(data).siblings('.tip').addClass('hide');
		} else {
			data = '';
			d(obj).val(data)
		}
	};

	exports.shconfirm = function(nowLang, popHtml, type, options) {
		var this_obj = {};
		//按钮类型
		this_obj.btnEnum = {
			ok: parseInt("0001", 2), //确定按钮
			cancel: parseInt("0010", 2), //取消按钮
			okcancel: parseInt("0011", 2) //确定&&取消
		};
		//触发事件类型
		this_obj.eventEnum = {
			ok: 1,
			cancel: 2,
			close: 3
		};

		//弹窗类型
		this_obj.typeEnum = {
			success: "success",
			error: "error",
			confirm: "confirm",
			warning: "warning",
			custom: "custom"
		};

		var btnType = this_obj.btnEnum;
		var eventType = this_obj.eventEnum;

		var popType = {
			success: {
				title: SHpack['success_title'][nowLang],
				icon: '<i class="iconcorrect"></i>',
				btn: btnType.ok
			},
			error: {
				title: SHpack['error_title'][nowLang],
				icon: '<i class="iconerror"></i>',
				btn: btnType.ok
			},
			confirm: {
				title: SHpack['confirm_title'][nowLang],
				icon: '<i class="iconwarning"></i>',
				btn: btnType.okcancel
			},
			custom: {
				icon: '',
				btn: btnType.okcancel
			}
		};

		var itype = type ? type instanceof Object ? type : popType[type] || {} : {}; //格式化输入的参数:弹窗类型
		var config = d.extend(true, {
			//属性
			title: "&nbsp", //自定义的标题
			btn: btnType.ok, //按钮,默认单按钮
			//事件
			onOk: d.noop, //点击确定的按钮回调
			onCancel: d.noop, //点击取消的按钮回调
			onClose: d.noop //弹窗关闭的回调,返回触发事件
		}, itype, options);

		var $txt = d("<span>").html(popHtml); //弹窗文本dom
		var $tt = d("<span>").addClass("tt").text(config.title); //标题
		var $icon = config.icon;

		var btn = config.btn; //按钮组生成参数

		var popId = creatPopId(); //弹窗索引

		var $box = d("<div>").addClass("mo_Confirm"); //弹窗插件容器
		var $layer = d("<div>").addClass("xc_layer"); //遮罩层
		var $popBox = d("<div>").addClass("popBox"); //弹窗盒子
		var $ttBox = d("<div>").addClass("ttBox"); //弹窗顶部区域
		var $contBox = d("<div>").addClass("contBox"); //弹窗内容主体区
		var $icobox = d("<div>").addClass("icobox").append($icon); //弹窗图标主体区
		var $txtBox = d("<div>").addClass("txtBox").append($txt); //弹窗图标主体区
		var $btnArea = d("<div>").addClass("btnArea"); //按钮区域


		var $ok = d("<a>").addClass("sgBtn").addClass("ok").text(SHpack['confirm'][nowLang]); //确定按钮
		var $cancel = d("<a>").addClass("sgBtn").addClass("cancel").text(SHpack['cancel'][nowLang]); //取消按钮
		var $clsBtn = d("<i>").addClass("iconclose"); //关闭按钮
		var btns = {
			ok: $ok,
			cancel: $cancel
		};

		init();

		function init() {
			creatDom();
			bind();
		}

		function creatDom() {
			$popBox.append(
				$ttBox.append(
					$clsBtn
				).append(
					$tt
				)
			).append(
				$contBox.append($icobox).append($txtBox)
			).append(
				$btnArea.append(creatBtnGroup(btn))
			);
			$box.attr("id", popId).append($layer).append($popBox);
			d("body").append($box);
		}

		function bind() {
			//点击确认按钮
			$ok.click(doOk);

			//回车键触发确认按钮事件
			d(window).bind("keydown", function(e) {
				if (e.keyCode == 13) {
					if (d("#" + popId).length == 1) {
						doOk();
					}
				}
			});

			$cancel.click(doCancel);
			$clsBtn.click(doClose);
		}

		function doOk() {
			d("#" + popId).animate({
				opacity: '0'
			}, 500, function() {
				config.onOk();
				d(this).remove()
			});
			config.onClose(eventType.ok);
		}

		function doCancel() {
			d("#" + popId).animate({
				opacity: '0'
			}, 500, function() {
				config.onCancel();
				d("#" + popId).remove();
			});

			config.onClose(eventType.cancel);
		}

		function doClose() {
			d("#" + popId).animate({
				opacity: '0'
			}, 500, function() {
				config.onClose(eventType.close);
				d(this).remove();
			});
			d(window).unbind("keydown");
		}

		function creatBtnGroup(tp) {
			if (btn == 3) {
				var $bgp = d("<div>").addClass("btnGroup");
				d.each(btns, function(i, n) {
					if (btnType[i] == (tp & btnType[i])) {
						$bgp.append(n);
					}
				});
			} else {
				var $bgp = $ok;
			}
			return $bgp;
		}

		function creatPopId() {
			var i = "pop_" + (new Date()).getTime() + parseInt(Math.random() * 100000); //弹窗索引
			if (d("#" + i).length > 0) {
				return creatPopId();
			} else {
				return i;
			}
		}
	};

	exports.loading_box = function(tiptxt) {
		var $Loadmask = (!d('.Loadmask').length) ? d('<div>').addClass('Loadmask') : d('.Loadmask');
		$Loadmask.appendTo('body');

		var $Loadbox = d('<div>').addClass('Loadbox');
		var $maxbox = d('<div>').addClass('maxbox');
		var $progressbox = d('<div>').addClass('progressbox');
		var $txtbox = d('<div>').addClass('txtbox').html(tiptxt);

		$Loadbox.append(
			$maxbox.append($progressbox, $txtbox)
		).appendTo('body');

		d('.maxbox').css({
			left: (d(window).width() - d('.maxbox').innerWidth()) / 2,
			top: (d(window).height() - d('.maxbox').innerHeight()) / 2
		});
	};

	exports.animationWidth = function(times, callback) {
		var w = d('.maxbox').innerWidth();
		times = times * 1000;
		d('.progressbox').animate({
			width: w
		}, times, callback);
	};

	exports.chgTabnet = function(tabnav, tabbox) {
		d('body').on('click', '.' + tabnav + ' .hasclick', function(event) {
			event.stopPropagation();
			var oThis = d(this);
			var oIndex = oThis.index();
			var tabCon = d('.' + tabbox + '');

			oThis.addClass('active').siblings().removeClass('active');
			tabCon.children().eq(oIndex).addClass('show').siblings().removeClass('show');
		})
	}

	exports.chgTabs = function(tabnav, tabbox) {
		d('body').on('click', '.' + tabnav + ' li', function(event) {
			event.stopPropagation();
			var oThis = d(this);
			var oIndex = oThis.index();
			var tabCon = d('.' + tabbox).children();

			//$('.' + tabs).siblings('.tabContent').find(".onError").remove();
			//$('.' + tabs).siblings('.tabContent').find('input').removeClass('borError');
			oThis.addClass('active').siblings().removeClass('active');
			oThis.find('input[type="radio"]').prop('checked', true).end().siblings().find('input[type="radio"]').prop(
				'checked', false);
			tabCon.eq(oIndex).addClass('show').siblings().removeClass('show');
		})
	}

	exports.setlanguage = function(arg) {
		var this_data = {
			"language": arg
		};
		f.setlanguage(this_data, function(data) {
			if (data.errCode == '0') {
				applyRuntimeLanguage(arg);
				e.replacetext(arg);
				//location.replace(location);
				//e.replacetext(arg);
			}
		})
	};

	exports.format_volide_ok = function (obj) {
        if (!obj || obj == undefined) {
            obj = 'body'
        }
        var requires = d(obj).find('.require');
        for (var i = 0; i < requires.length; i++) {
            var _this = requires[i];
            if (d(_this).is(":visible") && d(_this).attr('disabled') != 'disabled') {
                d(_this).trigger('blur');
                if (d(_this).hasClass('borError')) {
                    return false;
                }
            }
        }
        return true;
    }

	exports.volide = function(require, nowLang, device) {
		var requires = d(require).find('.require');
		var ifbtn = d(require).find('.ifbtn');
		requires.keyup(function() {
			var this_obj = d(this);
			var ByteCount;
			var $parent = this_obj.parents('.shbox_border');

			$parent.find(".onError").remove();
			this_obj.removeClass('borError');
			ifbtn.attr('disabled', false);

			//isNULL
            if (this_obj.hasClass('isNULL') && this.value == '') {
				$parent.append('<span class="onError">' + SHtips['nonull'][nowLang] + '</span>');
					this_obj.addClass('borError');
				return;
            }
			//base64编码
            if (this_obj.hasClass('isBase64') && (!g.isBaseFun(this.value) || this.value.length != 44)) {
				$parent.append('<span class="onError">' + SHtips['format_error'][nowLang] + '</span>');
					this_obj.addClass('borError');
				return;
            }
			//
            if (this_obj.hasClass('is_wg_ip') && !g.isGwIp(this.value)) {
				$parent.append('<span class="onError">' + SHtips['format_error'][nowLang] + '</span>');
					this_obj.addClass('borError');
				return;
            }
			//PPPOE帐号
            if (this_obj.hasClass('isPPPoeName')) {
                ByteCount = g.checkChar(d.trim(this.value));
				if (this.value == "" || ByteCount <= 0) {
					$parent.append('<span class="onError">' + SHtips['nonull'][nowLang] + '</span>');
					this_obj.addClass('borError');
				}
                if (g.isEnglish(this.value) || ByteCount > 63) {
                    if (g.isEnglish(this.value)) {
                         $parent.append('<span class="onError" sh_lang="SHtips.max63char">' + SHtips['format_error'][nowLang] + '</span>');
                    }
                    else {
                        $parent.append('<span class="onError" sh_lang="SHtips.max63char">' + SHtips['max63char'][nowLang] + '</span>');
                    }
                    this_obj.addClass('borError');
                }
                return;
            }
			//PPPOE密码
			if (this_obj.hasClass('isPPPoePwd')) {
				ByteCount = g.checkChar(this.value);
				if (this.value == "") {
					$parent.append('<span class="onError">' + SHtips['nonull'][nowLang] + '</span>');
					this_obj.addClass('borError');
				}
				if (g.isEnglish(this.value) || ByteCount > 63) {
					$parent.append('<span class="onError" sh_lang="SHtips.max63char">' + SHtips['max63char'][nowLang] + '</span>');
					this_obj.addClass('borError');
				}
				return;
			}

			//服务名称
			if (this_obj.hasClass('isServerName')) {
				ByteCount = g.checkChar(d.trim(this.value));
				if (g.isEnglish(this.value) || ByteCount > 63 ) {
					if (g.isEnglish(this.value)) {
						$parent.append('<span class="onError" sh_lang="SHtips.max63char">' + SHtips['format_error'][nowLang] + '</span>');
					}
					else {
						$parent.append('<span class="onError" sh_lang="SHtips.max63char">' + SHtips['max63char'][nowLang] + '</span>');
					}
					this_obj.addClass('borError');
				}
				return;
			}

			//非中文
			if (this_obj.hasClass('isEnglish') && g.isEnglish(this.value)) {
				$parent.append('<span class="onError" sh_lang="SHtips.format_en_error">' + SHtips['format_en_error'][nowLang] + '</span>');
				this_obj.addClass('borError');
				return;
			}

			//MTU
			if (this_obj.hasClass('isMTU') && (!g.isNum(this.value) || !g.isRangNum(this.value, 128, 1500))) {
				$parent.append('<span class="onError" sh_lang="SHtips.ismtu">' + SHtips['ismtu'][nowLang] + '</span>');
				this_obj.addClass('borError');
				return;
			}

			//txpower
			if (this_obj.hasClass('isTxpower') && (!g.isNum(this.value) || !g.isRangNum(this.value, 0, 22))) {
				$parent.append('<span class="onError" sh_lang="SHtips.ispower">' + SHtips['ispower'][nowLang] + '</span>');
				this_obj.addClass('borError');
				return;
			}
			
			//IP地址
			if (this_obj.hasClass('isIp')) {
				if (!g.isIpaddr(this.value) || this.value == '') {
					$parent.append('<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] +
						'</span>:192.168.0.2</span>');
					this_obj.addClass('borError');
					return;
				}
			}
			
			
			if (this_obj.hasClass('isZeroIp')) {
				if (g.isEnglish(this.value)) {
					$parent.append('<span class="onError" sh_lang="SHtips.format_en_error">' + SHtips['format_en_error'][nowLang] + '</span>');
					this_obj.addClass('borError');
					return;
				}
			}
			//子网掩码
			if (this_obj.hasClass('isNetmask')) {
				if (!g.isNetmask(this.value) || this.value == '') {
					$parent.append('<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] +
						'</span>: 255.255.255.0 </span>');
					this_obj.addClass('borError');
					return;
				}
			}

			//网关
			if (this_obj.hasClass('isGateway')) {
				if (!g.isIpaddr(this.value) || this.value == '') {
					$parent.append('<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] +
						'</span>: 192.168.0.1</span>');

					this_obj.addClass('borError');
					return;
				}
			}

			//DNS
			if (this_obj.hasClass('isDNS')) {
				if (!g.isIpaddr(this.value) || this.value == '') {
					$parent.append('<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] +
						'</span>: 202.96.128.86</span>');
					this_obj.addClass('borError');
					return;
				}
			}

			if (this_obj.hasClass('isDomainName')) {
				ByteCount = g.checkChar(d.trim(this.value));
				if (!g.isDomainName(this.value)) {
					$parent.append('<span class="onError" sh_lang="SHtips.format_error">' + SHtips['format_error'][nowLang] +
						'</span>');
					this_obj.addClass('borError');
					return;
				}

				if (!g.isDomainName(this.value) || ByteCount > 32 || ByteCount < 0) {
					$parent.append('<span class="onError" sh_lang="SHtips.max32char">' + SHtips['max32char'][nowLang] + '</span>');
					this_obj.addClass('borError');
					return;
				}
			}

			if (this_obj.hasClass('isDomain')) {
				if (!g.isDomain(this.value)) {
					$parent.append('<span class="onError" sh_lang="SHtips.domain">' + SHtips['domain'][nowLang] + '</span>');
					this_obj.addClass('borError');
					return;
				}
			}
			//nullSSID
			if (this_obj.hasClass('nullSSID')) {
				ByteCount = g.checkChar(d.trim(this.value));
				if (ByteCount == 0) {
					$parent.append('<span class="onError" sh_lang="SHtips.ssid_null">' + SHtips['ssid_null'][nowLang] +
						'</span>');
					this_obj.addClass('borError');
					return;
				}
			}
				//selectSSID
				if (this_obj.hasClass('selectSSID')) {
					ByteCount = g.checkChar(d.trim(this.value));
					if (ByteCount == 0) {
						$parent.append('<span class="onError" sh_lang="SHtips.wifiSelect">' + SHtips['wifiSelect'][nowLang] +
							'</span>');
						this_obj.addClass('borError');
						return;
					}
					if (ByteCount > 32) {
						$parent.append('<span class="onError" sh_lang="SHtips.max32char">' + SHtips['max32char'][nowLang] +
							'</span>');
						this_obj.addClass('borError');
						return;
					}
				}
				//SSID
				if (this_obj.hasClass('isSSID')) {
					ByteCount = g.checkChar(d.trim(this.value));
						if (ByteCount > 32 || ByteCount < 1) {
						$parent.append('<span class="onError" sh_lang="SHtips.1-32char">' + SHtips['1-32char'][nowLang] + '</span>');
						this_obj.addClass('borError');
						return;
				}
			}
			//isNullSSID
			if (this_obj.hasClass('isNullSSID')) {
				ByteCount = g.checkChar(d.trim(this.value));
				if (ByteCount > 32 || 1 > ByteCount) {
					$parent.append('<span class="onError" sh_lang="SHtips.max32char">' + SHtips['max32char'][nowLang] +
						'</span>');
					this_obj.addClass('borError');
					return;
				}
			}

			//isInterval
			if (this_obj.hasClass('isInterval')) {
				if (!g.isNum(this.value) || !g.isRangNum(this.value, 1, 999)) {
					$parent.append('<span class="onError" sh_lang="SHtips.isInterval">' + SHtips['isInterval'][nowLang] +
						'</span>');
					this_obj.addClass('borError');
					return;
				}
			}

			//Number
			if (this_obj.hasClass('isNum')) {
				var startnum = parseInt(this_obj.attr('name').split("_@")[1].split("_")[0]) || 0;
				var endnum = parseInt(this_obj.attr("name").split("_@")[1].split("_")[1]) || 99999999;

				if (!g.isNum(this.value) || !g.isRangNum(this.value, startnum, endnum)) {
					$parent.append('<span class="onError" sh_lang="SHtips.format_error">' + SHtips['format_error'][nowLang] + '</span>');
					this_obj.addClass('borError');
					return;
				}
			}
			//可以为空
			if (this_obj.hasClass('isNum_null') && this.value != '') {
				var startnum = parseInt(this_obj.attr('name').split("_@")[1].split("_")[0]) || 0;
				var endnum = parseInt(this_obj.attr("name").split("_@")[1].split("_")[1]) || 99999999;

				if (!g.isNum(this.value) || !g.isRangNum(this.value, startnum, endnum)) {
					$parent.append('<span class="onError" sh_lang="SHtips.format_error">' + SHtips['format_error'][nowLang] + '</span>');
					this_obj.addClass('borError');
					return;
				}
			}

			//DHCP开始地址
			if (this_obj.hasClass('isDhcpAddr') && !(g.isNum(this.value) && g.isRangNum(this.value, 1, 254))) {
				$parent.append('<span class="onError" sh_lang="SHtips.isdhcpaddr">' + SHtips['isdhcpaddr'][nowLang] +
					'</span>');
				this_obj.addClass('borError');
				return;
			}

			//DHCP number
			if (this_obj.hasClass('isDhcpNum') && (!g.isNum(this.value) || !g.isRangNum(this.value, 1, 1000))) {
				$parent.append('<span class="onError" sh_lang="SHtips.isdhcpnum">' + SHtips['isdhcpnum'][nowLang] + '</span>');
				this_obj.addClass('borError');
				return;
			}

			//isDhcpTime
			if (this_obj.hasClass('isDhcpTime') && (!g.isNum(this.value) || this.value < 2 || this.value > 10080)) {
				$parent.append('<span class="onError" sh_lang="SHtips.isdhcptime">' + SHtips['isdhcptime'][nowLang] +
					'</span>');
				this_obj.addClass('borError');
				return;
			}

			//Number
			if (this_obj.hasClass('isNonull')) {
				if (this.value == '' || this.value.indexOf(" ") > -1) {
					$parent.append('<span class="onError" sh_lang="SHtips.nonull">' + SHtips['nonull'][nowLang] + '</span>');
					this_obj.addClass('borError');
					return;
				}
			}

			//SSID密码
			if (this_obj.hasClass('isSSIDPwd')) {
				if (this.value.indexOf(' ') > -1) {
					$parent.append('<span class="onError" sh_lang="SHtips.format_err">' + SHtips['format_err'][nowLang] +
						'</span>');
					this_obj.addClass('borError');
					return;
				}

				if (this.value != '' && g.isEnglish(this.value)) {
					$parent.append('<span class="onError" sh_lang="SHtips.format_err">' + SHtips['format_err'][nowLang] +
						'</span>');
					this_obj.addClass('borError');
					return;
				}

				//可为空
				if (this.value != '' && !g.isEnglish(this.value)) {
					if (this.value.length > 32 || 8 > this.value.length) {
						$parent.append('<span class="onError" sh_lang="SHtips.empOr8-32char">' + SHtips['empOr8-32char'][nowLang] +
							'</span>');
						this_obj.addClass('borError');
						return;
					}
				}
			}

			//SSID密码2
			if (this_obj.hasClass('isSSIDPwd2')) {
				if (this.value == '') {
					$parent.append('<span class="onError" sh_lang="SHtips.format_err">' + SHtips['nonull'][nowLang] + '</span>');
					this_obj.addClass('borError');
					return;
				}

				if (!g.psk_special(this.value) || this.value.indexOf(' ') > -1 || g.isEnglish(this.value)) {
					$parent.append('<span class="onError" sh_lang="SHtips.format_err">' + SHtips['format_err'][nowLang] +
						'</span>');
					this_obj.addClass('borError');
					return;
				}
				// var Mode = window.WEPflag;
				if (sessionStorage.name == 'wep') {
					if (this.value.length == 26 || 13 == this.value.length || this.value.length == 10 || 5 == this.value.length) {} else {
						$parent.append('<span class="onError" sh_lang="SHtips.empOr8-32char">' + SHtips['wep_char'][nowLang] +
							'</span>');
						this_obj.addClass('borError');
						return;
					}
				} else {
					if (this.value.length > 32 || 8 > this.value.length) {
						$parent.append('<span class="onError" sh_lang="SHtips.empOr8-32char">' + SHtips['8-32char'][nowLang] +
							'</span>');
						this_obj.addClass('borError');
						return;
					}
				}
			}
			//isassoc
			if (this_obj.hasClass('isassoc') && (!g.isNum(this.value) || this.value > 256 || this.value < 1)) {
				$parent.append('<span class="onError" sh_lang="SHtips.isassoc">' + SHtips['isassoc'][nowLang] + '</span>');
				this_obj.addClass('borError');
				return;
			}

			//isfrag
			if (this_obj.hasClass('isfrag') && (!g.isNum(this.value) || !g.isRangNum(this.value, 256, 2346))) {
				$parent.append('<span class="onError" sh_lang="SHtips.isfrag">' + SHtips['isfrag'][nowLang] + '</span>');
				this_obj.addClass('borError');
				return;
			}

			//isrts
			if (this_obj.hasClass('isrts') && (!g.isNum(this.value) || !g.isRangNum(this.value, 0, 2347))) {
				$parent.append('<span class="onError" sh_lang="SHtips.isrts">' + SHtips['isrts'][nowLang] + '</span>');
				this_obj.addClass('borError');
				return;
			}

			//isRemoteIp
			if (this_obj.hasClass('isRemoteIp')) {
				if (this.value == '' || !g.isIp(this.value)) {
					$parent.append('<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] +
						'</span>: 192.168.0.2</span>');
					this_obj.addClass('borError');
					return;
				}
			}

			//isNullorIp
			if (this_obj.hasClass('isNullorIp')) {
				if (this.value != '' && !g.isIpaddr(this.value)) {
					$parent.append('<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] +
						'</span>: 192.168.0.2</span>');
					this_obj.addClass('borError');
					return;
				}
			}

			//端口
			if (this_obj.hasClass('isPort') && (!g.isNum(this.value) || !g.isRangNum(this.value, 1, 65535))) {
				$parent.append('<span class="onError" sh_lang="SHtips.port_err">' + SHtips['port_err'][nowLang] + '</span>');
				this_obj.addClass('borError');
				return;
			}

			//MAC地址
			if (this_obj.hasClass('isMac') && (!g.isMac(this.value) || this.value == '')) {
				$parent.append('<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] +
					'</span>: 84:82:f4:00:00:01</span>');
				this_obj.addClass('borError');
				return;
			}

			//设置密码
			if (this_obj.hasClass('isNewPwd') || this_obj.hasClass('isOldPwd')) {
				$parent.find(".iconerror").remove();
				if (!g.special(this.value) || g.isEnglish(this.value) || this.value.indexOf(" ") > -1) {
                    if (device == 'mobile') {
                        $parent.append('<em class="iconerror"></em>');
                    } else {
                        $parent.append('<span class="onError" sh_lang="SHtips.format_err">' + SHtips['format_err'][nowLang] + '</span>');
                    }
                    this_obj.addClass('borError');
                    return;
                }
                if (!g.isEnglish(this.value)) {
                    if (this.value.length > 63 || 1 > this.value.length) {
                        $parent.append('<span class="onError" sh_lang="SHtips.max63char">' + SHtips['max63char'][nowLang] + '</span>');
                        this_obj.addClass('borError');
                        return;
                    }
                }
			}
			//isTime
			if (this_obj.hasClass('isTime')) {
				if (!g.isTime(this.value)) {
					$parent.append('<span class="onError" sh_lang="SHtips.format_error">' + SHtips['format_error'][nowLang] +
						'</span>');
					this_obj.addClass('borError');
					return;
				}
			}

			//isUrlPort
			if (this_obj.hasClass('isUrlPort')) {
				var arg_arr = this.value.split(':');

				if (this.value == '') {
					$parent.append('<span class="onError" ><span sh_lang="SHtips.probeserver_url_is_null">' + SHtips[
						'probeserver_url_is_null'][nowLang] + '</span></span>');
					this_obj.addClass('borError');
					return;
				}

				if (arg_arr[0].indexOf('.') < 0 || !g.isNum(arg_arr[1])) {
					$parent.append('<span class="onError" ><span sh_lang="SHtips.probe_server_url_ok">' + SHtips[
						'probe_server_url_ok'][nowLang] + '</span></span>');
					this_obj.addClass('borError');
					return;
				}
			}

		}).blur(function() {
			d(this).triggerHandler("keyup");
		});
	}

	exports.firewall_volide = function(require, nowLang) {
		var requires = d(require).find('.require');
		requires.keyup(function() {
			var this_obj = d(this);
			var ByteCount;
			var $box_foot = d(require).find('.add_box_foot');
			$box_foot.find(".onError").remove();
			this_obj.removeClass('borError');

			//isNULL
            if (this_obj.hasClass('isNULL') && this.value == '') {
				$box_foot.append('<span class="onError">' + SHtips['nonull'][nowLang] + '</span>');
					this_obj.addClass('borError');
				return;
            }
			//isNum
			if (this_obj.hasClass('isNum')) {
				var startnum = parseInt(this_obj.attr('name').split("_@")[1].split("_")[0]) || 0;
				var endnum = parseInt(this_obj.attr("name").split("_@")[1].split("_")[1]) || 99999999;

				if (!g.isNum(this.value) || !g.isRangNum(this.value, startnum, endnum)) {
					$box_foot.append('<span class="onError" sh_lang="SHtips.format_error">' + SHtips['format_error'][nowLang] +
						'</span>');
					this_obj.addClass('borError');
					return;
				}
			}

			//非中文
			if (this_obj.hasClass('isEnglish') && g.isEnglish(this.value)) {
				$box_foot.append('<span class="onError" sh_lang="SHtips.format_en_error">' + SHtips['format_en_error'][nowLang] + '</span>');
				this_obj.addClass('borError');
				return;
			}

			//isUrl
			if (this_obj.hasClass('isUrl')) {
				ByteCount = g.checkChar(d.trim(this.value));
				if(this.value == "") {
					$box_foot.append('<span class="onError">' + SHtips['nonull'][nowLang] + '</span>');
					this_obj.addClass('borError');
				}
				if (this.value.indexOf(" ") > -1 ) {
					$box_foot.append('<span class="onError" sh_lang="SHtips.format_error">' + SHtips['format_error'][nowLang] +
						'</span>');
					this_obj.addClass('borError');
				}
				if (ByteCount > 63) {
					$box_foot.append('<span class="onError" sh_lang="SHtips.urlmax63char">' + SHtips['urlmax63char'][nowLang] +
						'</span>');
					this_obj.addClass('borError');
				}
				if (g.isEnglish(this.value)) {
					$box_foot.append('<span class="onError" sh_lang="SHtips.format_en_error">' + SHtips['format_en_error'][nowLang] + '</span>');
					this_obj.addClass('borError');
					return;
				}
				return;
			}

			//IP地址
			if (this_obj.hasClass('isIp') && (!g.isIpaddr(this.value) || this.value == '')) {
				$box_foot.append('<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] +
					'</span>：192.168.0.2</span>');
				this_obj.addClass('borError');
				return;
			}

			//端口
			if (this_obj.hasClass('isPort') && (!g.isNum(this.value) || !g.isRangNum(this.value, 1, 65535))) {
				$box_foot.append('<span class="onError">' + SHtips['port_err'][nowLang] + '</span>');
				this_obj.addClass('borError');
				return;
			}

			//Number
			if (this_obj.hasClass('isNonull') && (this.value == '' || this.value.indexOf(" ") > -1)) {
				$box_foot.append('<span class="onError">' + SHtips['nonull'][nowLang] + '</span>');
				this_obj.addClass('borError');
				return;
			}

			//起始IP 结束IP 验校
			if (this_obj.hasClass('startIp') || this_obj.hasClass('endIp')) {
				if (d('.startIp').val() == '') {
					$box_foot.append('<span class="onError">' + SHtips['StartIP'][nowLang] + ' </span>');
					this_obj.addClass('borError');
					return;
				}
				if (!g.isIp(d('.startIp').val()) || !g.isIp(d('.endIp').val()) ) {
					$box_foot.append('<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] +
						'</span>：192.168.0.2</span>');
					d('.startIp').addClass('borError');
					return;
				}
				if (d('.endIp').val() == '') {
					$box_foot.append('<span class="onError">' + SHtips['EndIP'][nowLang] + ' </span>');
					this_obj.addClass('borError');
					return;
				}
				if (!g.isIp(d('.endIp').val()) ) {
					$box_foot.append('<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] +
						'</span>：192.168.0.2</span>');
					d('.endIp').addClass('borError');
                                        return;

				}
				var startIp = ip2int(d('.startIp').val());
				var endIp = ip2int(d('.endIp').val());
				if (startIp > endIp) {
					$box_foot.append('<span class="onError">' + SHtips['StartNoGrtThEnd'][nowLang] + ' </span>');
					this_obj.addClass('borError');
					return;
				}
			}

			//MAC地址
			if (this_obj.hasClass('isMac') && (!g.isMac(this.value) || this.value == '')) {
				$box_foot.append('<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] +
					'</span>：xx:xx:xx:xx:xx:xx</span>');
				this_obj.addClass('borError');
				return;
			}

			//起始端口 结束端口 验校
			if (this_obj.hasClass('startport') || this_obj.hasClass('endport')) {
				if (d('.startport').val() == '') {
					$box_foot.append('<span class="onError">' + SHtips['StartPort'][nowLang] + ' </span>');
					this_obj.addClass('borError');
					return;
				}

				if (d('.endport').val() == '') {
					$box_foot.append('<span class="onError">' + SHtips['EndPort'][nowLang] + ' </span>');
					this_obj.addClass('borError');
					return;
				}

				var startport = parseInt(d('.startport').val());
				var endport = parseInt(d('.endport').val());
				if (startport > endport) {
					$box_foot.append('<span class="onError">' + SHtips['StartNoGrtThEnd'][nowLang] + ' </span>');
					this_obj.addClass('borError');
					return;
				}
			}

		}).blur(function() {
			d(this).triggerHandler("keyup");
		})
		/*.focus(function () {
		 d(this).triggerHandler("blur");
		 }).mouseup(function () {
		 d(this).triggerHandler("blur");
		 })*/
	};

	function ip2int(ip) {
		var num = 0;
		ip = ip.split(".");
		num = Number(ip[0]) * 256 * 256 * 256 + Number(ip[1]) * 256 * 256 + Number(ip[2]) * 256 + Number(ip[3]);
		num = num >>> 0;
		return num;
	}

	exports.volide_ok = function(btn) {
		var require = d(btn);
		var requires = d(btn).find('.require');
		for (var i = 0; i < requires.length; i++) {
			var _this = requires[i];
			if (d(_this).is(":visible") && d(_this).attr('disabled') != 'disabled') {
				d(_this).trigger('blur');
			}
		}
		var obj = d(require).find('.borError:visible');
		if (obj.length == 0) {
			return true;
		} else {
			d(obj[0]).trigger('blur').focus();
			return false;
		}
	};

	exports.volide_wifi_ok = function(btn) {
		var require = d(btn);
		var requires = d(btn).find('.require');
		for (var i = 0; i < requires.length; i++) {
			var _this = requires[i];
			if (d(_this).attr('disabled') != 'disabled') {
				d(_this).trigger('blur');
			}
		}
		var obj = d(require).find('.borError');
		if (obj.length == 0) {
			return true;
		} else {
			d(obj[0]).trigger('blur').focus();
			return false;
		}
	};

	exports.getifacenum = function(arg) {
		var ifacenum;
		ifacenum = arg.replace(/[^0-9]+/g, "") || '0';
		return ifacenum;
	};

	exports.trim_select = function(sel_val) {
		sel_val = typeof sel_val == "object" ? sel_val[0] : sel_val;
		return d.trim(sel_val);
	};

	exports.setmenuheight = function() {
		if (d(window).height() < (d('.content').height() + 60)) {
			d('#subMenu .navigation').css({
				"min-height": d('.content').height() + "px"
			});
			d('.content').css({
				"min-height": d('.content').height() + "px"
			});
		} else {
			d('#subMenu .navigation').css({
				"min-height": d(window).height() - 60 + "px"
			});
			d('.content').css({
				"min-height": d(window).height() - 60 + "px"
			});
		}
	};

	exports.isEqualIP = function(addr1, mask1, addr2, mask2) {
		if (!addr1 || !addr2 || !mask1 || !mask2) {
			return false;
		}
		var star_ip1 = [],
			star_ip2 = [],
			end_ip1 = [],
			end_ip2 = [];
		addr1 = addr1.split(".");
		addr2 = addr2.split(".");
		mask1 = mask1.split(".");
		mask2 = mask2.split(".");
		for (var i = 0; i < 4; i++) {
			star_ip1[i] = addr1[i] & mask1[i];
			star_ip2[i] = addr2[i] & mask2[i];
			end_ip1[i] = addr1[i] | (~mask1[i] & 0xff);
			end_ip2[i] = addr2[i] | (~mask2[i] & 0xff);
		}
		star_ip1 = ip2int(star_ip1.join('.'));
		star_ip2 = ip2int(star_ip2.join('.'));
		end_ip1 = ip2int(end_ip1.join('.'));
		end_ip2 = ip2int(end_ip2.join('.'));
		if ((star_ip1 >= star_ip2 && end_ip1 <= end_ip2) || (star_ip2 >= star_ip1 && end_ip2 <= end_ip1)) {
			return true;
		} else {
			return false;
		}
	}

	exports.escapeHtml = function(string) {
		var entityMap = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': '&quot;',
			"'": '&#39;',
			"/": '&#x2F;'
		};
		return String(string).replace(/[&<>"'\/]/g, function(s) {
			return entityMap[s];
		});
	};
});
