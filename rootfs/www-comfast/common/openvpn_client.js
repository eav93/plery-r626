define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};
        require("upload")(d);

    var device, client_info;

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
        g.volide('.shbox', nowLang, device);
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
        });
    }

    function refresh_init() {
        // var martop;
        // martop = (d(window).height() - d('.set_seat').height() - 180) / 2;
        // d('.set_seat').css({'top': martop + 'px'});

        f.getMConfig('openvpn_client_get', '', function (data) {
            if (data && !data.errCode) {
                client_info = data.openvpn[0]
                refresh_client();
            }
        });
    }

    function refresh_client() {
        d("#openvpnclient_switch").val(client_info.enabled || '0')
        d("#verb").val(client_info.verb);
        d("#nobind").val(client_info.nobind);
        d("#client").val(client_info.clientmode);
        d("#remote").val(client_info.remote.split(' ')[0]);
        d("#port").val(client_info.remote.split(' ')[1]);
        d("#openvpn_server").val(client_info.serverip);
        d("#service_mask").val(client_info.mask);
        d("#dui_gateway").val(client_info.gateway);

        et.enableConfig()
    }

    et.enableConfig = function () {
        if (d("#openvpnclient_switch").val() == 0) {
            d(".allform").find('input').prop('disabled', true).removeClass('borError')
            d(".allform").find('select').prop('disabled', true)
            d('.onError').remove();
        } else {
            d(".allform").find('input').removeAttr("disabled")
            d(".allform").find('select').removeAttr("disabled");

        }
    }

    // 上传
    d('#backup_file_ca').change(function () {
        setTimeout(function () {
            upload_all('ca', 'openvpn_upload_client_ca_crt')
        }, 1000)
    });
    d('#backup_file_cert').change(function () {
        setTimeout(function () {
            upload_all('cert', 'openvpn_upload_client_client_crt')
        }, 1000)
    });
    d('#backup_file_key').change(function () {
        setTimeout(function () {
            upload_all('key', 'openvpn_upload_client_client_key')
        }, 1000)
    });
    function upload_all(str, urls) {
        if (d("#backup_file_" + str).val().match(/\.crt$|\.key$/i) == null) {
            g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            return false;
        }
        d("#backup_file_" + str).upload({
            url: '/cgi-bin/mbox-config?method=SET&section=' + urls,
            onComplate: function (data) {
                g.loading_box(SHpack['tip'][nowLang]);
                if (data && data.errCode != 0) {
                    g.animationWidth(0, function () {
                        g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
                    });
                } else {
                    g.animationWidth(5, gohref);
                }
            }
        });
        d("#backup_file_" + str).upload("ajaxSubmit");
    }

    et.setmode = function () {
        var a = {};
        if (!g.volide_ok('.shbox')) {
            g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            return;
        }
        a.enabled = d("#openvpnclient_switch").val();
        if (a.enabled == "1") {
            a.verb = d("#verb").val();
            a.nobind = d("#nobind").val();
            a.clientmode = d("#client").val();
            a.remote = d("#remote").val() + ' ' + d("#port").val();
            a.serverip = d("#openvpn_server").val();
            a.mask = d("#service_mask").val();
            a.gateway = d("#dui_gateway").val();
        }
        client_set({ openvpn: a });
    }
    function client_set(arg) {
        f.setMConfig('openvpn_client_set', arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
				g.animationWidth(30, gohref);
            }
        })
    }
    function gohref() {
        window.location.href = location.href;
    }
});
