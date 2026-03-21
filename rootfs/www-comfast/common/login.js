define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, device_config, firstlogin_flag;

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    function start_model(data) {
        device_config = data;
        nowLang = data.language.language;
        g.login_init(nowLang);
        device = d('body').attr('device');
        page();
        selectedlanguage(nowLang);
    }

    /* */
    function selectedlanguage(data) {
        d("#l_select").val(data)
        d("#selected").text(d("#l_select")[0].selectedOptions[0].innerText)
    }

    d('body').on('click', function () {
        close_w();
    });

    function close_w() {
        d("#login_area").show();
        d('.lang_box').hide();
        d('.set_lang span').data('status', 'close');
    }

    et.language_change = function (evt) {
        d("#selected").text(d(evt)[0].selectedOptions[0].innerText)
        g.setlanguage(d("#l_select").val(), firstlogin_flag);
    }
    /* */

    function page() {
        var w_heigh, d_height, top_value;
        w_heigh = d(window).height();
        d_height = d('#login_area').height();
        if ((d_height + 50) < w_heigh) {
            top_value = (w_heigh - d_height) / 2 - 80;
        } else {
            top_value = (w_heigh - d_height) / 2;
        }
        d('body').height(w_heigh);
        d('#login_area').css({'top': top_value + 'px'});

        if (device_config.changed == '0') {
            var currentLang = (navigator.language || navigator.browserLanguage).toLowerCase();
            if (currentLang.indexOf("cn") > -1) {
                g.setlanguage('cn', firstlogin_flag);
                nowLang = 'cn';
            }
        }

        f.getSConfig("first_login", "", function (data) {
            if (data.errCode == 0) {
                firstlogin_flag = data.system.first_login;
            }

            if (firstlogin_flag == "1") {
                d('#passwordbox').remove();
                d('#newpsdbox').removeClass('hide');
                d("#login_btn").html(SHpack.passwd_add[nowLang]).attr('sh_lang', 'SHpack.passwd_add');
            } else {
                d('#newpsdbox').remove();
                d('#passwordbox').removeClass('hide');
                d("#login_btn").html(SHpack.login[nowLang]).attr('sh_lang', 'SHpack.login');
            }
        });
    }

    d(document).keydown(function (event) {
        if (event.keyCode == 13 && d(".mo_Confirm").length == 0) {
            d('#login_btn').click();
        }
    });

    et.login = function (a) {
        var username, password;
        if (firstlogin_flag == "1") {
            passwd_change();
            return;
        }

        username = 'admin';
        password = d("#password").val();

        g.login(username, password, function (a) {
            if (a) {
                g.shconfirm(nowLang, SHtips.password_error[nowLang], 'error');
            } else {
                l_login(username)
            }
        });
    };

    function l_login() {
        window.location.href = "index.html";
    }

    function passwd_change() {
        var pasword = d("#newpsd").val();
        if (g.isEnglish(pasword) || !g.special(pasword) || g.checkChar(pasword) > 63) {
            g.shconfirm(nowLang, SHtips.format_error[nowLang], 'error');
            return
        }
        login_m();
    }

    function login_m() {
        var user = {};
        user.username = 'admin';
        user.password = 'admin';
        f.login(user, function (data) {
            modify_password();
        })
    }

    function modify_password() {
        var lan_info = {};
        var setting = {};
        var pasword = d("#newpsd").val();

        setting.username = "admin";
        setting.password = pasword;
        setting.oldPassword = "admin";
        if (setting.password == "" || setting.oldPassword == "") return;

        f.getguide(function (info) {
		if (info.errCode == 0) {
		config = d.extend(true, {}, info);
		lan_info = info.lan;
            }
        });

        f.modifypassword(setting, function (setting) {
            if (setting.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], 'error');
            } else {
                d.ajax({
                    type: 'GET',
                    dataType: 'json',
                    url: '/js/href.json',
                    cache: false,
                    success: function (data) {
                        window.location.href = "http://" + lan_info.ipaddr + "/" + device + "/" + data.guide;
                    }
                });
            }
        });
    }

});
