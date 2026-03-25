define(function(require, exports) {
    var e = require("mbox"),
        f = require("util"),
        g = require("validate");

    /*WEP_config*/
    window.WEPflag = '';

    var nowLang, menu_html = '';
    var this_url = location.pathname;

    function applyRuntimeLanguage(lang) {
        var htmlLang = lang === 'ru' ? 'ru' : lang === 'cn' ? 'zh-CN' : 'en';
        var html = document.documentElement;
        html.setAttribute('lang', htmlLang);
        html.setAttribute('translate', 'no');
        html.classList.add('notranslate');
        document.body.setAttribute('translate', 'no');
        document.body.classList.add('notranslate');
        if (!document.querySelector('meta[name="google"]')) {
            var meta = document.createElement('meta');
            meta.setAttribute('name', 'google');
            meta.setAttribute('content', 'notranslate');
            document.head.appendChild(meta);
        }
    }

    /* common init */
    exports.login_init = function(data, device) {
        nowLang = data;
        applyRuntimeLanguage(nowLang);
        document.title = SHpack.global_title[nowLang];
        click_href();
        var loginOut = document.getElementById('login_out');
        if (loginOut) {
            loginOut.addEventListener('click', function() {
                if (document.getElementById('sixmodel')) {
                    location.replace(location.protocol + '//' + location.host);
                }
                f.loginout(function(data) {
                    if (data.errCode == 0) {
                        location.replace(location.protocol + '//' + location.host);
                    }
                });
            });
        }
    };

    function click_href() {
        fetch('/js/href.json', {cache: 'no-store'})
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.href) {
                    var el = document.getElementById('logo_herf');
                    if (el) el.setAttribute('href', data.href);
                }
            })
            .catch(function() {});
    }

    /* common init */
    exports.common = function(data, device) {
        nowLang = data;
        applyRuntimeLanguage(nowLang);
        document.title = SHpack.global_title[nowLang];
        click_href();
        var loginOut = document.getElementById('login_out');
        if (loginOut) {
            loginOut.addEventListener('click', function() {
                if (document.getElementById('sixmodel')) {
                    location.replace(location.protocol + '//' + location.host);
                }
                f.loginout(function(data) {
                    if (data.errCode == 0) {
                        location.replace(location.protocol + '//' + location.host);
                    }
                });
            });
        }
        getmenu(device);
    };

    function get_config(a, b) {
        fetch('/js/menu.json', {cache: 'no-store'})
            .then(function(r) { return r.json(); })
            .then(a)
            .catch(b || function() {});
    }

    function getmenu(device) {
        get_config(function(config) {
            f.getguide(function(data) {
                var workmode = data.wan.workmode || 'router';
                pathmenu(config.menu, device, workmode, data.wan.proto);
                var nav = document.querySelector('#subMenu .navigation');
                if (nav) nav.insertAdjacentHTML('beforeend', menu_html);
                menueffect();
            });
        });
    }

    function pathmenu(arg, device, workmode, proto) {
        var sh_lang;
        var pageflag = location.href.split('/').pop();
        arg.forEach(function(m) {
            sh_lang = eval(m.name);

            if (workmode == "ap" || workmode == "wds" || device == 'mobile') {
                if (m.id == 'iplimit') return;
            }

            if (m.childs && m.childs.length > 0) {
                menu_html += '<li class="item-has-children" id="menu_' + m.id + '">';
                menu_html += '<a class="iconfont"><i class="' + m.icon + '"></i><span  sh_lang="' + m.name + '">' + sh_lang[nowLang] + '</span></a>';
                var childsstring = JSON.stringify(m.childs);
                if (childsstring.indexOf(pageflag) > -1) {
                    menu_html += '<ul class="sub-menu">';
                } else {
                    menu_html += '<ul class="sub-menu" style="display: none;">';
                }
                m.childs.forEach(function(y) {
                    sh_lang = eval(y.name);
                    if ((y.id.indexOf('remote') > -1 || y.id.indexOf('wan') > -1 || y.id.indexOf('dns') > -1) && workmode != 'router') {
                        return;
                    }
                    if ((y.id == 'vlan' || y.id == 'ssidvlan') && (workmode != 'router' && workmode != 'wisp')) {
                        return;
                    }
                    if (y.id == 'band' && proto != 'qmi' && proto != 'dhcp_fibocom') {
                        return;
                    }
                    if ((y.id.indexOf('last') > -1 || y.id.indexOf('upnp') > -1 || m.id.indexOf('remote') > -1) && device == 'mobile') {
                        return;
                    }

                    if (y.childs && y.childs.length > 0) {
                        menu_html += '<li class="item-has-children" id="menu_' + y.id + '">';
                        menu_html += '<a sh_lang="' + y.name + '"><span>' + sh_lang[nowLang] + '</span></a>';
                        var childsLast = JSON.stringify(y.childs);
                        if (childsLast.indexOf(pageflag) > -1) {
                            menu_html += '<ul class="sub-menu">';
                        } else {
                            menu_html += '<ul class="sub-menu" style="display: none;">';
                        }
                        y.childs.forEach(function(x) {
                            sh_lang = eval(x.name);
                            if (this_url.indexOf(x.urls) > -1) {
                                menu_html += '<li id="menu_' + x.id + '"><a class="active" href="' + x.urls + '"  sh_lang="' + x.name + '">' + sh_lang[nowLang] + '</a></li>';
                            } else {
                                menu_html += '<li id="menu_' + x.id + '"><a href="' + x.urls + '"  sh_lang="' + x.name + '">' + sh_lang[nowLang] + '</a></li>';
                            }
                        });
                        menu_html += '</ul>';
                    } else {
                        if (this_url.indexOf(y.urls) > -1) {
                            menu_html += '<li id="menu_' + y.id + '"><a class="active" href="' + y.urls + '"  sh_lang="' + y.name + '">' + sh_lang[nowLang] + '</a></li>';
                        } else {
                            menu_html += '<li id="menu_' + y.id + '"><a href="' + y.urls + '"  sh_lang="' + y.name + '">' + sh_lang[nowLang] + '</a></li>';
                        }
                    }
                });
                menu_html += '</ul>';
            } else {
                menu_html += '<li id="menu_' + m.id + '">';
                if (this_url.indexOf(m.urls) > -1) {
                    menu_html += '<a class="active" href="' + m.urls + '"><i class="' + m.icon + '"></i><span sh_lang="' + m.name + '">' + sh_lang[nowLang] + '</span></a>';
                } else {
                    menu_html += '<a href="' + m.urls + '"><i class="' + m.icon + '"></i><span sh_lang="' + m.name + '">' + sh_lang[nowLang] + '</span></a>';
                }
            }
            menu_html += '</li>';
        });
    }

    function menueffect() {
        var headerMenu = document.querySelector('.header_menu');
        var mainContent = document.querySelector('.main_content');
        var header = document.querySelector('header');
        var nav = document.querySelector('.nav');

        if (headerMenu && mainContent && header) {
            headerMenu.addEventListener('click', function(event) {
                event.preventDefault();
                headerMenu.classList.toggle('is-clicked');
                header.classList.toggle('menu_open');
                mainContent.classList.toggle('menu_open');
                mainContent.addEventListener('transitionend', function handler() {
                    document.body.classList.toggle('overflow-hidden');
                    mainContent.removeEventListener('transitionend', handler);
                }, {once: true});
                if (nav) nav.classList.toggle('menu_open');
                if (document.documentElement.classList.contains('no-csstransitions')) {
                    document.body.classList.toggle('overflow-hidden');
                }
            });

            mainContent.addEventListener('click', function(event) {
                if (!event.target.matches('.header_menu, .header_menu span')) {
                    headerMenu.classList.remove('is-clicked');
                    header.classList.remove('menu_open');
                    mainContent.classList.remove('menu_open');
                    mainContent.addEventListener('transitionend', function handler() {
                        document.body.classList.remove('overflow-hidden');
                        mainContent.removeEventListener('transitionend', handler);
                    }, {once: true});
                    if (nav) nav.classList.remove('menu_open');
                    if (document.documentElement.classList.contains('no-csstransitions')) {
                        document.body.classList.remove('overflow-hidden');
                    }
                }
            });
        }

        var subMenuEl = document.querySelector('.subMenu');
        if (subMenuEl) {
            subMenuEl.addEventListener('click', function(event) {
                var link = event.target.closest && event.target.closest('.item-has-children > a');
                if (!link) return;
                event.preventDefault();
                var thisSubMenu = link.nextElementSibling;
                var parentLi = link.parentElement;
                var parentUl = parentLi.parentElement;
                /* Collapse all sibling sub-menus */
                Array.from(parentUl.querySelectorAll('.item-has-children > a + .sub-menu')).forEach(function(sm) {
                    if (sm !== thisSubMenu) sm.style.display = 'none';
                });
                /* Toggle this sub-menu */
                if (thisSubMenu) {
                    thisSubMenu.style.display = (thisSubMenu.style.display === 'none' || thisSubMenu.style.display === '') ? 'block' : 'none';
                }
            });
        }
    }

    exports.step = function(model, opt) {
        var not_radio, remove_div;
        if (!model) return;
        var $html = [],
            $arr;
        get_config(function(data) {
            $arr = data[model];
            if (opt) {
                not_radio = 'wf' + opt;
                remove_div = 'w' + opt;
                $arr = $arr.filter(function(m) { return m !== not_radio; });
                var divEl = document.querySelector('.' + remove_div);
                if (divEl) divEl.remove();
            }
            $html += '<ul>';
            for (var i = 0; i < $arr.length; i++) {
                if (i == 0) {
                    $html += '<li class="active"><span>' + (parseInt(i) + 1) + '</span><em sh_lang="SHpack.' + [$arr[i]] + '">' + SHpack[$arr[i]][nowLang] + '</em></li>';
                } else if (i == ($arr.length - 1)) {
                    $html += '<li><span><i class="iconfont icon-gou"></i></span><em sh_lang="SHpack.' + [$arr[i]] + '">' + SHpack[$arr[i]][nowLang] + '</em></li>';
                } else {
                    $html += '<li><span>' + (parseInt(i) + 1) + '</span><em sh_lang="SHpack.' + [$arr[i]] + '">' + SHpack[$arr[i]][nowLang] + '</em></li>';
                }
            }
            var shstep = document.querySelector('.shstep');
            if (shstep) shstep.innerHTML = $html;
        });
    };

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
        fetch('/cgi-bin/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: user, password: pass})
        })
        .then(function(r) { return r.json(); })
        .then(function(a) { callback(a.errCode); })
        .catch(function() {});
    };

    exports.setvalue = function(obj, data) {
        var el = typeof obj === 'string' ? document.querySelector(obj) : obj;
        if (!el) return;
        if (data !== '' && data !== undefined) {
            el.value = data;
            if (el.parentElement) {
                el.parentElement.querySelectorAll('.tip').forEach(function(tip) {
                    tip.classList.add('hide');
                });
            }
        } else {
            el.value = '';
        }
    };

    exports.shconfirm = function(nowLang, popHtml, type, options) {
        var this_obj = {};
        this_obj.btnEnum = {
            ok: parseInt("0001", 2),
            cancel: parseInt("0010", 2),
            okcancel: parseInt("0011", 2)
        };
        this_obj.eventEnum = {
            ok: 1,
            cancel: 2,
            close: 3
        };
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

        var itype = type ? type instanceof Object ? type : popType[type] || {} : {};
        var config = Object.assign({
            title: "&nbsp",
            btn: btnType.ok,
            onOk: function() {},
            onCancel: function() {},
            onClose: function() {}
        }, itype, options);

        var btn = config.btn;
        var popId = creatPopId();
        var keyHandler;

        /* Create DOM */
        var box     = document.createElement('div');  box.className = 'mo_Confirm';
        var layer   = document.createElement('div');  layer.className = 'xc_layer';
        var popBox  = document.createElement('div');  popBox.className = 'popBox';
        var ttBox   = document.createElement('div');  ttBox.className = 'ttBox';
        var contBox = document.createElement('div');  contBox.className = 'contBox';
        var icobox  = document.createElement('div');  icobox.className = 'icobox';
        var txtBox  = document.createElement('div');  txtBox.className = 'txtBox';
        var btnArea = document.createElement('div');  btnArea.className = 'btnArea';
        var tt      = document.createElement('span'); tt.className = 'tt'; tt.textContent = config.title;
        var txt     = document.createElement('span'); txt.innerHTML = popHtml;
        var ok      = document.createElement('a');    ok.className = 'sgBtn ok';     ok.textContent = SHpack['confirm'][nowLang];
        var cancel  = document.createElement('a');    cancel.className = 'sgBtn cancel'; cancel.textContent = SHpack['cancel'][nowLang];
        var clsBtn  = document.createElement('i');    clsBtn.className = 'iconclose';

        icobox.innerHTML = config.icon || '';
        txtBox.appendChild(txt);
        ttBox.appendChild(clsBtn);
        ttBox.appendChild(tt);
        contBox.appendChild(icobox);
        contBox.appendChild(txtBox);
        btnArea.appendChild(creatBtnGroup(btn));
        popBox.appendChild(ttBox);
        popBox.appendChild(contBox);
        popBox.appendChild(btnArea);
        box.id = popId;
        box.appendChild(layer);
        box.appendChild(popBox);
        document.body.appendChild(box);

        /* Bind events */
        ok.addEventListener('click', doOk);
        cancel.addEventListener('click', doCancel);
        clsBtn.addEventListener('click', doClose);
        keyHandler = function(ev) {
            if (ev.keyCode == 13 && document.getElementById(popId)) doOk();
        };
        window.addEventListener('keydown', keyHandler);

        function doOk() {
            var el = document.getElementById(popId);
            if (!el) return;
            el.style.transition = 'opacity 0.5s';
            el.style.opacity = '0';
            setTimeout(function() {
                config.onOk();
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 500);
            config.onClose(eventType.ok);
        }

        function doCancel() {
            var el = document.getElementById(popId);
            if (!el) return;
            el.style.transition = 'opacity 0.5s';
            el.style.opacity = '0';
            setTimeout(function() {
                config.onCancel();
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 500);
            config.onClose(eventType.cancel);
        }

        function doClose() {
            var el = document.getElementById(popId);
            if (!el) return;
            el.style.transition = 'opacity 0.5s';
            el.style.opacity = '0';
            setTimeout(function() {
                config.onClose(eventType.close);
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 500);
            window.removeEventListener('keydown', keyHandler);
        }

        function creatBtnGroup(tp) {
            if (btn == 3) {
                var bgp = document.createElement('div');
                bgp.className = 'btnGroup';
                var btns = {ok: ok, cancel: cancel};
                Object.keys(btns).forEach(function(i) {
                    if (btnType[i] == (tp & btnType[i])) bgp.appendChild(btns[i]);
                });
                return bgp;
            } else {
                return ok;
            }
        }

        function creatPopId() {
            var i = "pop_" + (new Date()).getTime() + parseInt(Math.random() * 100000);
            if (document.getElementById(i)) return creatPopId();
            return i;
        }
    };

    exports.loading_box = function(tiptxt) {
        var loadmask = document.querySelector('.Loadmask') || document.createElement('div');
        loadmask.className = 'Loadmask';
        document.body.appendChild(loadmask);

        var loadbox     = document.createElement('div'); loadbox.className = 'Loadbox';
        var maxbox      = document.createElement('div'); maxbox.className = 'maxbox';
        var progressbox = document.createElement('div'); progressbox.className = 'progressbox';
        var txtbox      = document.createElement('div'); txtbox.className = 'txtbox';
        txtbox.innerHTML = tiptxt;

        maxbox.appendChild(progressbox);
        maxbox.appendChild(txtbox);
        loadbox.appendChild(maxbox);
        document.body.appendChild(loadbox);

        var mb = document.querySelector('.maxbox');
        if (mb) {
            mb.style.left = ((window.innerWidth  - mb.offsetWidth)  / 2) + 'px';
            mb.style.top  = ((window.innerHeight - mb.offsetHeight) / 2) + 'px';
        }
    };

    exports.animationWidth = function(times, callback) {
        var progressbox = document.querySelector('.progressbox');
        var maxbox      = document.querySelector('.maxbox');
        if (!progressbox || !maxbox) return;
        var w = maxbox.offsetWidth;
        progressbox.style.transition = 'width ' + times + 's linear';
        progressbox.style.width = w + 'px';
        setTimeout(callback, times * 1000);
    };

    exports.chgTabnet = function(tabnav, tabbox) {
        document.body.addEventListener('click', function(event) {
            var target = event.target;
            if (!target.classList.contains('hasclick')) return;
            if (!target.closest('.' + tabnav)) return;
            event.stopPropagation();
            var siblings = Array.from(target.parentElement.children);
            var oIndex = siblings.indexOf(target);
            siblings.forEach(function(el) { el.classList.remove('active'); });
            target.classList.add('active');
            var tabCon = document.querySelector('.' + tabbox);
            if (tabCon) {
                Array.from(tabCon.children).forEach(function(child, i) {
                    if (i === oIndex) child.classList.add('show');
                    else child.classList.remove('show');
                });
            }
        });
    };

    exports.chgTabs = function(tabnav, tabbox) {
        document.body.addEventListener('click', function(event) {
            var li = event.target.closest && event.target.closest('.' + tabnav + ' li');
            if (!li) return;
            event.stopPropagation();
            var siblings = Array.from(li.parentElement.children);
            var oIndex = siblings.indexOf(li);
            siblings.forEach(function(el) { el.classList.remove('active'); });
            li.classList.add('active');
            var thisRadio = li.querySelector('input[type="radio"]');
            if (thisRadio) thisRadio.checked = true;
            siblings.forEach(function(el) {
                if (el !== li) {
                    var r = el.querySelector('input[type="radio"]');
                    if (r) r.checked = false;
                }
            });
            var tabCon = document.querySelector('.' + tabbox);
            if (tabCon) {
                Array.from(tabCon.children).forEach(function(child, i) {
                    if (i === oIndex) child.classList.add('show');
                    else child.classList.remove('show');
                });
            }
        });
    };

    exports.setlanguage = function(arg) {
        var this_data = {"language": arg};
        f.setlanguage(this_data, function(data) {
            if (data.errCode == '0') {
                applyRuntimeLanguage(arg);
                e.replacetext(arg);
            }
        });
    };

    function isVisible(el) {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }

    exports.format_volide_ok = function(obj) {
        if (!obj || obj == undefined) obj = 'body';
        var container = typeof obj === 'string' ? document.querySelector(obj) : obj;
        if (!container) return true;
        var requires = container.querySelectorAll('.require');
        for (var i = 0; i < requires.length; i++) {
            var _this = requires[i];
            if (isVisible(_this) && _this.getAttribute('disabled') !== 'disabled') {
                _this.dispatchEvent(new Event('blur'));
                if (_this.classList.contains('borError')) return false;
            }
        }
        return true;
    };

    exports.volide = function(selector, nowLang, device) {
        var container = document.querySelector(selector);
        if (!container) return;
        var requires = container.querySelectorAll('.require');
        var ifbtn    = container.querySelector('.ifbtn');

        requires.forEach(function(input) {
            function validate() {
                var parent = input.closest('.shbox_border');
                if (!parent) return;

                parent.querySelectorAll('.onError').forEach(function(n) { n.remove(); });
                input.classList.remove('borError');
                if (ifbtn) ifbtn.disabled = false;

                var v = input.value;
                var ByteCount;

                if (input.classList.contains('isNULL') && v == '') {
                    parent.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['nonull'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isBase64') && (!g.isBaseFun(v) || v.length != 44)) {
                    parent.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['format_error'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('is_wg_ip') && !g.isGwIp(v)) {
                    parent.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['format_error'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isPPPoeName')) {
                    ByteCount = g.checkChar(v.trim());
                    if (v == "" || ByteCount <= 0) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['nonull'][nowLang] + '</span>');
                        input.classList.add('borError');
                    }
                    if (g.isEnglish(v) || ByteCount > 63) {
                        if (g.isEnglish(v)) {
                            parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.max63char">' + SHtips['format_error'][nowLang] + '</span>');
                        } else {
                            parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.max63char">' + SHtips['max63char'][nowLang] + '</span>');
                        }
                        input.classList.add('borError');
                    }
                    return;
                }
                if (input.classList.contains('isPPPoePwd')) {
                    ByteCount = g.checkChar(v);
                    if (v == "") {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['nonull'][nowLang] + '</span>');
                        input.classList.add('borError');
                    }
                    if (g.isEnglish(v) || ByteCount > 63) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.max63char">' + SHtips['max63char'][nowLang] + '</span>');
                        input.classList.add('borError');
                    }
                    return;
                }
                if (input.classList.contains('isServerName')) {
                    ByteCount = g.checkChar(v.trim());
                    if (g.isEnglish(v) || ByteCount > 63) {
                        if (g.isEnglish(v)) {
                            parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.max63char">' + SHtips['format_error'][nowLang] + '</span>');
                        } else {
                            parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.max63char">' + SHtips['max63char'][nowLang] + '</span>');
                        }
                        input.classList.add('borError');
                    }
                    return;
                }
                if (input.classList.contains('isEnglish') && g.isEnglish(v)) {
                    parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_en_error">' + SHtips['format_en_error'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isMTU') && (!g.isNum(v) || !g.isRangNum(v, 128, 1500))) {
                    parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.ismtu">' + SHtips['ismtu'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isTxpower') && (!g.isNum(v) || !g.isRangNum(v, 0, 22))) {
                    parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.ispower">' + SHtips['ispower'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isIp')) {
                    if (!g.isIpaddr(v) || v == '') {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] + '</span>:192.168.0.2</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isZeroIp')) {
                    if (g.isEnglish(v)) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_en_error">' + SHtips['format_en_error'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isNetmask')) {
                    if (!g.isNetmask(v) || v == '') {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] + '</span>: 255.255.255.0 </span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isGateway')) {
                    if (!g.isIpaddr(v) || v == '') {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] + '</span>: 192.168.0.1</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isDNS')) {
                    if (!g.isIpaddr(v) || v == '') {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] + '</span>: 202.96.128.86</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isDomainName')) {
                    ByteCount = g.checkChar(v.trim());
                    if (!g.isDomainName(v)) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_error">' + SHtips['format_error'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                    if (!g.isDomainName(v) || ByteCount > 32 || ByteCount < 0) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.max32char">' + SHtips['max32char'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isDomain')) {
                    if (!g.isDomain(v)) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.domain">' + SHtips['domain'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('nullSSID')) {
                    ByteCount = g.checkChar(v.trim());
                    if (ByteCount == 0) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.ssid_null">' + SHtips['ssid_null'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('selectSSID')) {
                    ByteCount = g.checkChar(v.trim());
                    if (ByteCount == 0) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.wifiSelect">' + SHtips['wifiSelect'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                    if (ByteCount > 32) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.max32char">' + SHtips['max32char'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isSSID')) {
                    ByteCount = g.checkChar(v.trim());
                    if (ByteCount > 32 || ByteCount < 1) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.1-32char">' + SHtips['1-32char'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isNullSSID')) {
                    ByteCount = g.checkChar(v.trim());
                    if (ByteCount > 32 || 1 > ByteCount) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.max32char">' + SHtips['max32char'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isInterval')) {
                    if (!g.isNum(v) || !g.isRangNum(v, 1, 999)) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.isInterval">' + SHtips['isInterval'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isNum')) {
                    var startnum = parseInt(input.getAttribute('name').split("_@")[1].split("_")[0]) || 0;
                    var endnum   = parseInt(input.getAttribute('name').split("_@")[1].split("_")[1]) || 99999999;
                    if (!g.isNum(v) || !g.isRangNum(v, startnum, endnum)) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_error">' + SHtips['format_error'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isNum_null') && v != '') {
                    var startnum2 = parseInt(input.getAttribute('name').split("_@")[1].split("_")[0]) || 0;
                    var endnum2   = parseInt(input.getAttribute('name').split("_@")[1].split("_")[1]) || 99999999;
                    if (!g.isNum(v) || !g.isRangNum(v, startnum2, endnum2)) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_error">' + SHtips['format_error'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isDhcpAddr') && !(g.isNum(v) && g.isRangNum(v, 1, 254))) {
                    parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.isdhcpaddr">' + SHtips['isdhcpaddr'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isDhcpNum') && (!g.isNum(v) || !g.isRangNum(v, 1, 1000))) {
                    parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.isdhcpnum">' + SHtips['isdhcpnum'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isDhcpTime') && (!g.isNum(v) || v < 2 || v > 10080)) {
                    parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.isdhcptime">' + SHtips['isdhcptime'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isNonull')) {
                    if (v == '' || v.indexOf(" ") > -1) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.nonull">' + SHtips['nonull'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isSSIDPwd')) {
                    if (v.indexOf(' ') > -1) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_err">' + SHtips['format_err'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                    if (v != '' && g.isEnglish(v)) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_err">' + SHtips['format_err'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                    if (v != '' && !g.isEnglish(v)) {
                        if (v.length > 32 || 8 > v.length) {
                            parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.empOr8-32char">' + SHtips['empOr8-32char'][nowLang] + '</span>');
                            input.classList.add('borError'); return;
                        }
                    }
                }
                if (input.classList.contains('isSSIDPwd2')) {
                    if (v == '') {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_err">' + SHtips['nonull'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                    if (!g.psk_special(v) || v.indexOf(' ') > -1 || g.isEnglish(v)) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_err">' + SHtips['format_err'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                    if (sessionStorage.name == 'wep') {
                        if (v.length == 26 || 13 == v.length || v.length == 10 || 5 == v.length) {} else {
                            parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.empOr8-32char">' + SHtips['wep_char'][nowLang] + '</span>');
                            input.classList.add('borError'); return;
                        }
                    } else {
                        if (v.length > 32 || 8 > v.length) {
                            parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.empOr8-32char">' + SHtips['8-32char'][nowLang] + '</span>');
                            input.classList.add('borError'); return;
                        }
                    }
                }
                if (input.classList.contains('isassoc') && (!g.isNum(v) || v > 256 || v < 1)) {
                    parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.isassoc">' + SHtips['isassoc'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isfrag') && (!g.isNum(v) || !g.isRangNum(v, 256, 2346))) {
                    parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.isfrag">' + SHtips['isfrag'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isrts') && (!g.isNum(v) || !g.isRangNum(v, 0, 2347))) {
                    parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.isrts">' + SHtips['isrts'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isRemoteIp')) {
                    if (v == '' || !g.isIp(v)) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] + '</span>: 192.168.0.2</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isNullorIp')) {
                    if (v != '' && !g.isIpaddr(v)) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] + '</span>: 192.168.0.2</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isPort') && (!g.isNum(v) || !g.isRangNum(v, 1, 65535))) {
                    parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.port_err">' + SHtips['port_err'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isMac') && (!g.isMac(v) || v == '')) {
                    parent.insertAdjacentHTML('beforeend', '<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] + '</span>: 84:82:f4:00:00:01</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isNewPwd') || input.classList.contains('isOldPwd')) {
                    parent.querySelectorAll('.iconerror').forEach(function(n) { n.remove(); });
                    if (!g.special(v) || g.isEnglish(v) || v.indexOf(" ") > -1) {
                        if (device == 'mobile') {
                            parent.insertAdjacentHTML('beforeend', '<em class="iconerror"></em>');
                        } else {
                            parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_err">' + SHtips['format_err'][nowLang] + '</span>');
                        }
                        input.classList.add('borError'); return;
                    }
                    if (!g.isEnglish(v)) {
                        if (v.length > 63 || 1 > v.length) {
                            parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.max63char">' + SHtips['max63char'][nowLang] + '</span>');
                            input.classList.add('borError'); return;
                        }
                    }
                }
                if (input.classList.contains('isTime')) {
                    if (!g.isTime(v)) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_error">' + SHtips['format_error'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isUrlPort')) {
                    var arg_arr = v.split(':');
                    if (v == '') {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError"><span sh_lang="SHtips.probeserver_url_is_null">' + SHtips['probeserver_url_is_null'][nowLang] + '</span></span>');
                        input.classList.add('borError'); return;
                    }
                    if (arg_arr[0].indexOf('.') < 0 || !g.isNum(arg_arr[1])) {
                        parent.insertAdjacentHTML('beforeend', '<span class="onError"><span sh_lang="SHtips.probe_server_url_ok">' + SHtips['probe_server_url_ok'][nowLang] + '</span></span>');
                        input.classList.add('borError'); return;
                    }
                }
            }

            input.addEventListener('keyup', validate);
            input.addEventListener('blur', function() {
                input.dispatchEvent(new Event('keyup'));
            });
        });
    };

    exports.firewall_volide = function(selector, nowLang) {
        var container = document.querySelector(selector);
        if (!container) return;
        var requires = container.querySelectorAll('.require');
        var boxFoot  = container.querySelector('.add_box_foot');

        requires.forEach(function(input) {
            function validate() {
                if (!boxFoot) return;
                boxFoot.querySelectorAll('.onError').forEach(function(n) { n.remove(); });
                input.classList.remove('borError');

                var v = input.value;
                var ByteCount;

                if (input.classList.contains('isNULL') && v == '') {
                    boxFoot.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['nonull'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isNum')) {
                    var startnum = parseInt(input.getAttribute('name').split("_@")[1].split("_")[0]) || 0;
                    var endnum   = parseInt(input.getAttribute('name').split("_@")[1].split("_")[1]) || 99999999;
                    if (!g.isNum(v) || !g.isRangNum(v, startnum, endnum)) {
                        boxFoot.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_error">' + SHtips['format_error'][nowLang] + '</span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isEnglish') && g.isEnglish(v)) {
                    boxFoot.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_en_error">' + SHtips['format_en_error'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isUrl')) {
                    ByteCount = g.checkChar(v.trim());
                    if (v == "") {
                        boxFoot.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['nonull'][nowLang] + '</span>');
                        input.classList.add('borError');
                    }
                    if (v.indexOf(" ") > -1) {
                        boxFoot.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_error">' + SHtips['format_error'][nowLang] + '</span>');
                        input.classList.add('borError');
                    }
                    if (ByteCount > 63) {
                        boxFoot.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.urlmax63char">' + SHtips['urlmax63char'][nowLang] + '</span>');
                        input.classList.add('borError');
                    }
                    if (g.isEnglish(v)) {
                        boxFoot.insertAdjacentHTML('beforeend', '<span class="onError" sh_lang="SHtips.format_en_error">' + SHtips['format_en_error'][nowLang] + '</span>');
                        input.classList.add('borError');
                    }
                    return;
                }
                if (input.classList.contains('isIp') && (!g.isIpaddr(v) || v == '')) {
                    boxFoot.insertAdjacentHTML('beforeend', '<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] + '</span>：192.168.0.2</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isPort') && (!g.isNum(v) || !g.isRangNum(v, 1, 65535))) {
                    boxFoot.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['port_err'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('isNonull') && (v == '' || v.indexOf(" ") > -1)) {
                    boxFoot.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['nonull'][nowLang] + '</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('startIp') || input.classList.contains('endIp')) {
                    var startIpEl = document.querySelector('.startIp');
                    var endIpEl   = document.querySelector('.endIp');
                    var sVal = startIpEl ? startIpEl.value : '';
                    var eVal = endIpEl   ? endIpEl.value   : '';
                    if (sVal == '') {
                        boxFoot.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['StartIP'][nowLang] + ' </span>');
                        input.classList.add('borError'); return;
                    }
                    if (!g.isIp(sVal) || !g.isIp(eVal)) {
                        boxFoot.insertAdjacentHTML('beforeend', '<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] + '</span>：192.168.0.2</span>');
                        if (startIpEl) startIpEl.classList.add('borError'); return;
                    }
                    if (eVal == '') {
                        boxFoot.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['EndIP'][nowLang] + ' </span>');
                        input.classList.add('borError'); return;
                    }
                    if (!g.isIp(eVal)) {
                        boxFoot.insertAdjacentHTML('beforeend', '<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] + '</span>：192.168.0.2</span>');
                        if (endIpEl) endIpEl.classList.add('borError'); return;
                    }
                    if (ip2int(sVal) > ip2int(eVal)) {
                        boxFoot.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['StartNoGrtThEnd'][nowLang] + ' </span>');
                        input.classList.add('borError'); return;
                    }
                }
                if (input.classList.contains('isMac') && (!g.isMac(v) || v == '')) {
                    boxFoot.insertAdjacentHTML('beforeend', '<span class="onError"><span sh_lang="SHtips.Example">' + SHtips['Example'][nowLang] + '</span>：xx:xx:xx:xx:xx:xx</span>');
                    input.classList.add('borError'); return;
                }
                if (input.classList.contains('startport') || input.classList.contains('endport')) {
                    var spEl = document.querySelector('.startport');
                    var epEl = document.querySelector('.endport');
                    var spVal = spEl ? spEl.value : '';
                    var epVal = epEl ? epEl.value : '';
                    if (spVal == '') {
                        boxFoot.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['StartPort'][nowLang] + ' </span>');
                        input.classList.add('borError'); return;
                    }
                    if (epVal == '') {
                        boxFoot.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['EndPort'][nowLang] + ' </span>');
                        input.classList.add('borError'); return;
                    }
                    if (parseInt(spVal) > parseInt(epVal)) {
                        boxFoot.insertAdjacentHTML('beforeend', '<span class="onError">' + SHtips['StartNoGrtThEnd'][nowLang] + ' </span>');
                        input.classList.add('borError'); return;
                    }
                }
            }

            input.addEventListener('keyup', validate);
            input.addEventListener('blur', function() {
                input.dispatchEvent(new Event('keyup'));
            });
        });
    };

    function ip2int(ip) {
        var num = 0;
        ip = ip.split(".");
        num = Number(ip[0]) * 256 * 256 * 256 + Number(ip[1]) * 256 * 256 + Number(ip[2]) * 256 + Number(ip[3]);
        num = num >>> 0;
        return num;
    }

    exports.volide_ok = function(btn) {
        var container = typeof btn === 'string' ? document.querySelector(btn) : btn;
        if (!container) return true;
        var requires = container.querySelectorAll('.require');
        for (var i = 0; i < requires.length; i++) {
            var _this = requires[i];
            if (isVisible(_this) && _this.getAttribute('disabled') !== 'disabled') {
                _this.dispatchEvent(new Event('blur'));
            }
        }
        var borErrors = Array.from(container.querySelectorAll('.borError')).filter(isVisible);
        if (borErrors.length == 0) {
            return true;
        } else {
            borErrors[0].dispatchEvent(new Event('blur'));
            borErrors[0].focus();
            return false;
        }
    };

    exports.volide_wifi_ok = function(btn) {
        var container = typeof btn === 'string' ? document.querySelector(btn) : btn;
        if (!container) return true;
        var requires = container.querySelectorAll('.require');
        for (var i = 0; i < requires.length; i++) {
            var _this = requires[i];
            if (_this.getAttribute('disabled') !== 'disabled') {
                _this.dispatchEvent(new Event('blur'));
            }
        }
        var borErrors = container.querySelectorAll('.borError');
        if (borErrors.length == 0) {
            return true;
        } else {
            borErrors[0].dispatchEvent(new Event('blur'));
            borErrors[0].focus();
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
        return (sel_val || '').trim();
    };

    exports.setmenuheight = function() {
        var subMenuNav = document.querySelector('#subMenu .navigation');
        var content    = document.querySelector('.content');
        if (!subMenuNav || !content) return;
        if (window.innerHeight < (content.offsetHeight + 60)) {
            subMenuNav.style.minHeight = content.offsetHeight + 'px';
            content.style.minHeight    = content.offsetHeight + 'px';
        } else {
            subMenuNav.style.minHeight = (window.innerHeight - 60) + 'px';
            content.style.minHeight    = (window.innerHeight - 60) + 'px';
        }
    };

    exports.isEqualIP = function(addr1, mask1, addr2, mask2) {
        if (!addr1 || !addr2 || !mask1 || !mask2) return false;
        var star_ip1 = [], star_ip2 = [], end_ip1 = [], end_ip2 = [];
        addr1 = addr1.split(".");
        addr2 = addr2.split(".");
        mask1 = mask1.split(".");
        mask2 = mask2.split(".");
        for (var i = 0; i < 4; i++) {
            star_ip1[i] = addr1[i] & mask1[i];
            star_ip2[i] = addr2[i] & mask2[i];
            end_ip1[i]  = addr1[i] | (~mask1[i] & 0xff);
            end_ip2[i]  = addr2[i] | (~mask2[i] & 0xff);
        }
        star_ip1 = ip2int(star_ip1.join('.'));
        star_ip2 = ip2int(star_ip2.join('.'));
        end_ip1  = ip2int(end_ip1.join('.'));
        end_ip2  = ip2int(end_ip2.join('.'));
        if ((star_ip1 >= star_ip2 && end_ip1 <= end_ip2) || (star_ip2 >= star_ip1 && end_ip2 <= end_ip1)) {
            return true;
        } else {
            return false;
        }
    };

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
