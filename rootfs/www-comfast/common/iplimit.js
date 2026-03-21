define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    require("shpages")(d);

    var device, iplimit, ipLimtSwitch, optflag;

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
        d('#select_laber').text(SHpack.selectall[nowLang]);
        d('input[type=checkbox]').attr('checked', false).attr('data-value', '0');
        f.getMConfig("qos_ip_limit", "", function (data) {
            if (data.errCode == 0) {
                iplimit = data.list || [];
                ipLimtSwitch = data.qos.enable_limit;
                refresh_iplist();
            }
        });
    }

    function refresh_iplist() {
        var defapage, defanum;
        if (!iplimit.length) {
            d("#ip_filters_table").html('');
            d('.PageInfo').html('');
            d('.PageCode').html('');
            return;
        }
        defapage = 1;
        defanum = 10;
        list_show(defapage, defanum);
        d("#ip_page").SHPages({
            total: iplimit.length,
            pageTotal: defanum,
            current: defapage,
            PageFn: function (p) {
                list_show(p, defanum);
            }
        }, nowLang);
    }

    function list_show(currentline, pageline) {
        var this_html = '';
        d('#select_laber').text(SHpack.selectall[nowLang]);
        d('.row_checkbox').prop('checked', false).attr('data-value', '0');
        d('#allchecked').prop('checked', false).attr('data-value', '0');
        d("#ip_filters_table").empty();
        d.each(iplimit, function (n, m) {
            if (n >= (parseInt(currentline) - 1) * pageline && n < parseInt(currentline) * pageline) {
                var downrate = parseInt(m.downrate) / 8;
                var uprate = parseInt(m.uprate) / 8;
                var state;
                if (m.enable == '1') {
                    state = SHpack["enable"][nowLang];
                } else {
                    state = SHpack["disable"][nowLang];
                }
                this_html += '<tr>';
                this_html += '<td><input type="checkbox"  et="click:select_row" class="row_checkbox"></td>';
                this_html += '<td>' + (n + 1) + '</td>';
                this_html += '<td>' + m.ip + '</td>';
                this_html += '<td>' + uprate + '</td>';
                this_html += '<td>' + downrate + '</td>';
                this_html += '<td>' + state + '</td>';
                this_html += '<td>' + m.comment + '</td>';
                this_html += '<td class="real_num" style="display: none">' + m.real_num + '</td>';
                this_html += '<td ><i et="click:edit" data-num="' + n + '" class="list_edit" sh_title = "SHpack.edit" title = "' + SHpack.edit[nowLang] + '"></i></td>';
                this_html += '</tr>';
            }
        });
        d("#ip_filters_table").append(this_html);
    }

    et.selectall = function () {
        var allcheckvalue = d('#allchecked').attr('data-value');
        if (allcheckvalue == '0') {
            d('#select_laber').text(SHpack.cancelall[nowLang]);
            d('.row_checkbox').prop('checked', true).attr('data-value', '1');
            d('#allchecked').prop('checked', true).attr('data-value', '1');
        } else {
            d('#select_laber').text(SHpack.selectall[nowLang]);
            d('.row_checkbox').prop('checked', false).attr('data-value', '0');
            d('#allchecked').prop('checked', false).attr('data-value', '0');
        }
    };

    et.select_row = function (evt) {
        var rowcheck = d(evt).attr('data-value');
        if (rowcheck == '1') {
            d('#select_laber').text(SHpack.selectall[nowLang]);
            d(evt).prop('checked', false).attr('data-value', '0');
            d('#allchecked').prop('checked', false).attr('data-value', '0');
        } else {
            d(evt).prop('checked', true).attr('data-value', '1');
        }
        if (d('.row_checkbox').length == d('.row_checkbox:checked').length) {
            d('#select_laber').text(SHpack.cancelall[nowLang]);
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
    };

    function ip_config(evt) {
        var a = {};
        if (!g.volide_ok('.add_box')) {
            return;
        }
        closewin(evt);

        a.ip = d("#ipLimitHost").val();
        a.uprate = "" + d("#ipLimitUpload").val() * 8;
        a.downrate = "" + d("#ipLimitDownload").val() * 8;
        a.enable = d("#ipLimitState").val();
        a.comment = d("#remarks").val();
        a.share = "1";

        if (d("#real_num").val() != "") {
            a.real_num = parseInt(d("#real_num").val());
        }
        a.operate = optflag;
        if (iplimit.length > 0) {
            for (var n = 0; n < iplimit.length; n++) {
                var m = iplimit[n];
                console.dir(m.ip);
                console.dir(a.ip);
                if (m.real_num == a.real_num) {
                    continue;
                }else if (m.ip == a.ip) {
                    alert(SHtips.dubset[nowLang]);
                    return;
                }
            }
        }

        iplimit_set(a);
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
        iplimit_set(a);
    };

    et.del = function (evt) {
        var num = evt.attr("data-num");
        var a = {};
        a.list = iplimit[num].real_num + ",";
        a.operate = "del";
        iplimit_set(a);

    };

    et.edit = function (evt) {
        var addbox = '.add_box', marleft, martop;
        d('.mask').addClass('mask_show');
        marleft = (d(window).innerWidth() - d(addbox).innerWidth()) / 2;
        martop = (d(window).innerHeight() - d(addbox).innerHeight()) / 2;
        d(addbox).css({'left': marleft + 'px', 'top': martop + 'px'});
        d(addbox).addClass('add_show').siblings().removeClass('add_show');

        optflag = "edit";
        var num = evt.attr("data-num");
        ip_setdefault(num);
        g.firewall_volide(addbox, nowLang);
    };

    function ip_setdefault(n) {
        d("#ipLimitHost").val(iplimit[n].ip);
        d("#ipLimitUpload").val(parseInt(iplimit[n].uprate) / 8);
        d("#ipLimitDownload").val(parseInt(iplimit[n].downrate) / 8);
        d("#ipLimitState").val(iplimit[n].enable);
        d("#remarks").val(iplimit[n].comment);
        d("#real_num").val(iplimit[n].real_num);
    }

    function iplimit_set(arg) {
        f.setMConfig("qos_ip_limit", arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                if (ipLimtSwitch == 0) {
                    f.setMConfig("mwan_qos", {"enable_limit": "1"}, function (data) {
                    })
                }
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(1, seted);
            }
        });
    }

    function seted() {
        location.href = location.href;
    }

});
