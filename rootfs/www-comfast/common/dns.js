define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var wanlists_info;
    var device, setflag = 0;

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    function start_model(data) {
        nowLang = data.language.language;
        device = d('body').attr('device');
        g.common(nowLang, device);
        g.volide('.shbox_border', nowLang, device);
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
        var martop;
        martop = (d(window).height() - d('.set_seat').height() - 180) / 2;
        d('.set_seat').css({'top': martop + 'px'});

        f.getWanConfig(function (data) {
            if (data.errCode == 0) {
                wanlists_info = data.wanlist || [];
                if (wanlists_info.length != '0') {
                    fillvalue();
                }
            }
        });
    }

    function fillvalue() {
        var first_wanlist, dnsarry;

        first_wanlist = wanlists_info[0];
        if (first_wanlist.peerdns == "0" && first_wanlist.dns) {
            dnsarry = first_wanlist.dns.split(' ');
            g.setvalue('#dns_main', dnsarry[0] || '');
            g.setvalue('#dns_backup', dnsarry[1] || '');
        }
    }

    et.prev = function () {
        location.href = 'index.html';
    };

    et.setmode = function () {
        if (!g.volide_ok('.shbox_border')) {
            return;
        }
        
        if(validate_data()){

        }

        var arg = {}, a = {}, dnsarry = [];
        dnsarry[0] = d("#dns_main").val();
        dnsarry[1] = d("#dns_backup").val();
        arg.mwan_list = [];
        a.iface = "wan";
        a.enable = "1";
        a.dns = filterdns(dnsarry).join(' ') || '';
        if (a.dns != "") {
            arg.dns_type = "1";
        } else {
            arg.dns_type = "0";
        }
        arg.mwan_list.push(a);
        set_config(arg);
    };
    
    function validate_data() {

    }

    function filterdns(data) {
        var newdata = [];
        d.each(data, function (n, m) {
            if (m != '') {
                newdata.push(m);
            }
        })
        return newdata;
    }

    function set_config(arg) {
        if (setflag) {
            return;
        }
        setflag = '1';
        f.setDnsConfig(arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(30,gohref);
            }
        });
    }

    function gohref() {
        location.href = location.href;
    }
})
