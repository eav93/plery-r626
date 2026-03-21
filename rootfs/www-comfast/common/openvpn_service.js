define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};
        require("upload")(d);

    var device, service_info;

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

        f.getMConfig('openvpn_server_get', '', function (data) {
            if (data && !data.errCode) {
                service_info = data.openvpn_server_config
                refresh_service();
            }
        });
        f.getMConfig('openvpn_dh_certificate_get', '', function (data) {
            if (data && !data.errCode) {
                if(data.dh_stat.dh_flag == 1) {
                    g.shconfirm(nowLang, SHtips.openvpnInfo_update[nowLang], "error");
                }
            }
        });
    }

    function refresh_service() {
        d("#openvpnservice_switch").val(service_info.enabled || '0')
        d("#clientip").val(service_info.client_ip);
        d("#client_mask").val(service_info.client_mask);
        d("#verb").val(service_info.verb);
        d("#port").val(service_info.port);
        d("#server_ip").val(service_info.server_ip);
        d("#server_mask").val(service_info.server_mask);
        d("#keepalive_interval").val(service_info.keepalive_interval);
        d("#keepalive_total").val(service_info.keepalive_total);

        et.book_change()
        et.enableConfig()
    }

    et.enableConfig = function () {
        if (d("#openvpnservice_switch").val() == 0) {
            d(".allform").find('input').prop('disabled', true).removeClass('borError')
            d(".allform").find('select').prop('disabled', true)
            d('.onError').remove();
        } else {
            d(".allform").find('input').removeAttr("disabled")
            d(".allform").find('select').removeAttr("disabled");

        }
    }

    et.book_change = function () {
        if (d("#book_switch").val() == 0) {
            d("#book_auto").addClass("hide");
        } else {
            d("#book_auto").removeClass("hide");
        }
    }

    // 更新
    et.updateFile_ca = function () {
        update_set('openvpn_ca_certificate_set')
    }
    et.updateFile_dh = function () {
        update_set('openvpn_dh_certificate_set')
    }
    et.updateFile_cert = function () {
        update_set('openvpn_ser_certificate_set')
    }
    et.updateFile_key = function () {
        update_set('openvpn_cli_certificate_set')
    }
    function update_set(url) {
        f.setMConfig(url, '', function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
				g.animationWidth(30, gohref);
            }
        })
    }

    // 上传
    d('#backup_file_ca').change(function () {
        setTimeout(function () {
            upload_all('ca', 'system_openvpn_ca_upload')
        }, 1000)
    });
    d('#backup_file_dh').change(function () {
        setTimeout(function () {
            upload_all('dh', 'system_openvpn_dh_upload')
        }, 1000)
    });
    d('#backup_file_cert').change(function () {
        setTimeout(function () {
            upload_all('cert', 'system_openvpn_server_cert_upload')
        }, 1000)
    });
    d('#backup_file_key').change(function () {
        setTimeout(function () {
            upload_all('key', 'system_openvpn_server_key_upload')
        }, 1000)
    });
    function upload_all(str, urls) {
        if (d("#backup_file_" + str).val().match(/\.crt$|\.pem$|\.key$/i) == null) {
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

    // 下载
    et.downloadFile_ca = function () {
        get_certificate('system_download_openvpn_ca')
    }
    et.downloadFile_dh = function () {
        get_certificate('system_download_openvpn_dh')
    }
    et.downloadFile_cert = function () {
        get_certificate('system_download_openvpn_client_cert')
    }
    et.downloadFile_key = function () {
        get_certificate('system_download_openvpn_client_key')
    }
    function get_certificate(url) {
        var iframe = d('<iframe style="position:absolute;top:-9999px" ></iframe>').attr('name', 'backdown_iframe');
        var form = d('<form method="post" style="display:none;" enctype="multipart/form-data" />').attr('name', 'backdown_form');
        form.attr("target", 'backdown_iframe').attr('action', '/cgi-bin/mbox-config?method=GET&section=' + url);

        iframe.appendTo("body");
        form.appendTo(iframe);
        form.submit();
    }

    et.setmode = function () {
        var a = {};
        if (!g.volide_ok('.shbox')) {
            g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            return;
        }
        a.enabled = d("#openvpnservice_switch").val();
        if (a.enabled == "1") {
            a.client_ip = d("#clientip").val();
            a.client_mask = d("#client_mask").val();
            a.verb = d("#verb").val();
            a.port = d("#port").val();
            a.server_ip = d("#server_ip").val();
            a.server_mask = d("#server_mask").val();
            a.keepalive_interval = d("#keepalive_interval").val();
            a.keepalive_total = d("#keepalive_total").val();
        }
        service_set(a);
    }

    function service_set(arg) {
        f.setMConfig('openvpn_server_set', arg, function (data) {
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
