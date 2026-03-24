define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, ipfilter_info, optflag;

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
        d('input[type=checkbox]').attr('checked', false).attr('data-value', '0');
        f.getIpFilter(function (data) {
            if (data.errCode == 0) {
                ipfilter_info = data.ipfilter_list || [];
                refresh_iplist();
            }
        });
    }

    function refresh_iplist() {
        if (!ipfilter_info.length) {
            d("#ip_filters_table").html('');
            return;
        }
        list_show();
    }

    function list_show() {
        var this_html = '';
        d('.row_checkbox').prop('checked', false).attr('data-value', '0');
        d('#allchecked').prop('checked', false).attr('data-value', '0');
        d("#ip_filters_table").empty();
        d.each(ipfilter_info, function (n, m) {
            var iplist, src_ip, dst_ip;
            if (m.src_ip.indexOf('-') < 0) {
                src_ip = dst_ip = m.src_ip;
            } else {
                iplist = m.src_ip.split("-");
                src_ip = iplist[0];
                dst_ip = iplist[1];
            }
            this_html += '<tr>';
            this_html += '<td><input type="checkbox"  et="click:select_row" class="row_checkbox"></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="ip_proto">' + m.proto.toUpperCase() + '</td>';
            this_html += '<td class="ip_sip">' + src_ip + '</td>';
            this_html += '<td class="ip_dip">' + dst_ip + '</td>';
            this_html += '<td class="ip_reamek">' + m.name + '</td>';
            this_html += '<td class="real_num" style="display: none">' + m.real_num + '</td>';
            this_html += '<td ><i et="click:edit" data-value="0" class="list_edit" sh_title = "SHpack.edit" title = "' + SHpack.edit[nowLang] + '"></i><i et="click:del" sh_title = "SHpack.del" title = "' + SHpack.del[nowLang] + '" class="list_del"></i></td>';
            this_html += '</tr>';
        });
        d("#ip_filters_table").append(this_html);
    }

    et.selectall = function () {
        var allcheckvalue = d('#allchecked').attr('data-value');
        if (allcheckvalue == '0') {
            d('.row_checkbox').prop('checked', true).attr('data-value', '1');
            d('#allchecked').prop('checked', true).attr('data-value', '1');
        } else {
            d('.row_checkbox').prop('checked', false).attr('data-value', '0');
            d('#allchecked').prop('checked', false).attr('data-value', '0');
        }
    };

    et.select_row = function (evt) {
        var rowcheck = d(evt).attr('data-value');
        if (rowcheck == '1') {
            d(evt).prop('checked', false).attr('data-value', '0');
            d('#allchecked').prop('checked', false).attr('data-value', '0');
        } else {
            d(evt).prop('checked', true).attr('data-value', '1');
        }
        if (d('.row_checkbox').length == d('.row_checkbox:checked').length) {
            d('#allchecked').prop('checked', true).attr('data-value', '1');
        }
    }

    et.add = function () {
        var addbox = '.add_box', marleft, martop;
        optflag = "add";
        d('.mask').addClass('mask_show');
        marleft = (d(window).innerWidth() - d(addbox).innerWidth()) / 2;
        martop = (d(window).innerHeight() - d(addbox).innerHeight()) / 2;
        d(addbox).css({'left': marleft + 'px', 'top': martop + 'px'});
        d(addbox).addClass('add_show').siblings().removeClass('add_show');
        d('input[type="text"]').val('');
        d('.onError').remove();
        g.firewall_volide('.add_box', nowLang);
    };

    et.closewin = function (evt) {
        closewin(evt)
    };

    function closewin(obj) {
        d('.mask').removeClass('mask_show');
        d(obj).parents('.add_box').removeClass('add_show');
        d('.onError').remove();
    }

    et.save = function (evt) {
        ip_config(evt);
    }

    function ip_config(evt) {
        var a = {};
        if (!g.volide_ok('.add_box')) {
            return;
        }
        closewin(evt);
        var fromIP, toIP;
        fromIP = d("#startip").val();
        toIP = d("#endip").val();

        if (toIP == fromIP) {
            a.src_ip = fromIP;
        } else {
            a.src_ip = fromIP + '-' + toIP;
        }
        a.proto = d("#proto_select").val();
        a.name = d("#ip_reamek").val();
        if (d("#real_num").val() != "") {
            a.real_num = parseInt(d("#real_num").val());
        }
        a.operate = optflag;
        if (ipfilter_info && ipfilter_info.length > 0) {
            var dubflag = 0;
            d.each(ipfilter_info, function (n, m) {
                if (m.proto == a.proto && m.src_ip == a.src_ip) {
                    if (m.real_num == a.real_num) {
                        return true;
                    }
                    dubflag = 1;
                    alert(SHtips.dubset[nowLang]);
                    return false;
                }
            })
        }
        if (dubflag) {
            return;
        }
        ip_set(a);
    }

    et.delsele = function () {
        var a = {}, this_checked;
        this_checked = d('#ip_filters_table').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        a.list = '';
        this_checked.each(function (n, m) {
            a.list += d(m).parents('tr').find('.real_num').text() + ',';
        });
        a.operate = "del";
        ip_set(a);
    }

    et.del = function (evt) {
        var a = {};
        a.list = d(evt).parents('tr').find('.real_num').text() + ",";
        a.operate = "del";
        ip_set(a);
    }

    et.edit = function (evt) {
        var addbox = '.add_box', marleft, martop;
        d('.mask').addClass('mask_show');
        marleft = (d(window).innerWidth() - d(addbox).innerWidth()) / 2;
        martop = (d(window).innerHeight() - d(addbox).innerHeight()) / 2;
        d(addbox).css({'left': marleft + 'px', 'top': martop + 'px'});
        d(addbox).addClass('add_show').siblings().removeClass('add_show');

        optflag = "edit";
        ip_setdefault(evt);

        g.firewall_volide(addbox, nowLang);
    }

    function ip_setdefault(evt) {
        var ip_proto, ip_sip, ip_dip, ip_reamek, real_num;
        ip_proto = d(evt).parents('tr').find('.ip_proto').text().toLowerCase();
        ip_sip = d(evt).parents('tr').find('.ip_sip').text();
        ip_dip = d(evt).parents('tr').find('.ip_dip').text();
        ip_reamek = d(evt).parents('tr').find('.ip_reamek').text();
        real_num = d(evt).parents('tr').find('.real_num').text();
        d("#proto_select").val(ip_proto);
        d("#startip").val(ip_sip);
        d("#endip").val(ip_dip);
        d("#ip_reamek").val(ip_reamek);
        d("#real_num").val(real_num);
    }

    function ip_set(arg) {
        f.setIpFilter(arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(1,seted);
            }
        });
    }

    function seted() {
        d('.Loadmask').remove();
        d('.Loadbox').remove();
        refresh_init()
    }

});
