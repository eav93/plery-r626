define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device;

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    function start_model(data) {
        nowLang = data.language.language;
        device = d('body').attr('device');
        g.common(nowLang, device);
        g.volide('.shbox', nowLang, device);
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    function refresh_init() {
        var martop;
        martop = (d(window).height() - d('.set_seat').height() - 180) / 2;
        d('.set_seat').css({'top': martop + 'px'});
    }

    et.prev = function () {
        location.href = 'index.html';
    };

    et.modify_passwd = function (a) {
	if (!g.volide_ok('.shbox_border')) {
            g.shconfirm(nowLang, SHtips.passwd_err[nowLang], "error");
            return;
        }
        if ( d('.isNewPwd').val().length == 0 ){
            g.shconfirm(nowLang, SHtips.newpasswd_msg[nowLang], "error");
            d('.isNewPwd').addClass('borError');
            return;
        }
	var setting = {};
        setting.username = "admin";
        setting.password = d("#npasswd").val();
        setting.oldPassword = d("#opasswd").val();
        f.modifypassword(setting, function(data) {
            if (d("#npasswd").val() != '' && d("#opasswd").val() != '') {
                if (data.errCode != 0) {
                    d("#opasswd").addClass('borError')
                    g.shconfirm(nowLang, SHtips.old_passwords[nowLang], "error");
                    return
                } else if (data.errCode == 0) {
                    f.loginout(function(data) {
                    if (data.errCode == 0) {
                        g.loading_box(SHpack['tip'][nowLang]);
                        g.animationWidth(5, gopath);
                        }
                    })
                }
            }
        });
    };

    function gopath() {
        window.location.href = 'http://' + location.hostname;
    }
});
