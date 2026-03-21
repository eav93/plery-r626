define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    require("shpages")(d);

    var device, macfilter_info, optflag;

    exports.init = function init() {
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
        d('input[type=checkbox]').prop('checked', false).attr('data-value','0');
        f.getMacFilter(function (data) {
            if (data.errCode == 0) {
                macfilter_info = data.macfilter_list || [];
                refresh_maclist();
            }
        });

    }

    function refresh_maclist() {
        var defapage, defanum;
        if (!macfilter_info.length) {
            d("#mac_filters_table").html('');
            d('.PageInfo').html('');
            d('.PageCode').html('');
            return;
        }
        defapage = 1;
        defanum = 10;
        list_show(defapage, defanum);
        d("#mac_page").SHPages({
            total: macfilter_info.length,
            pageTotal: defanum,
            current: defapage,
            PageFn: function (p) {
                list_show(p, defanum);
            }
        }, nowLang);
    }

    function list_show(currentline, pageline) {
        d('#select_laber').text(SHpack.selectall[nowLang]);
        d('.row_checkbox').prop('checked', false).attr('data-value', '0');
        d('#allchecked').prop('checked', false).attr('data-value', '0');
        var this_html = '';
        d("#mac_filters_table").empty();
        d.each(macfilter_info, function (n, m) {
            if (n >= (parseInt(currentline) - 1) * pageline && n < parseInt(currentline) * pageline) {
                this_html += '<tr>';
                this_html += '<td><input type="checkbox" et="click:select_row" class="row_checkbox"></td>';
                this_html += '<td>' + (n + 1) + '</td>';
                this_html += '<td class="mac_addr">' + m.src_mac.toUpperCase() + '</td>';
                this_html += '<td class="mac_remark">' + m.name + '</td>';
                this_html += '<td class="real_num" style="display: none">' + m.real_num + '</td>';
                this_html += '<td ><i et="click:edit" class="list_edit" sh_title = "SHpack.edit" title = "' + SHpack.edit[nowLang] + '"></i><i et="click:del" class="list_del" sh_title = "SHpack.del" title = "' + SHpack.del[nowLang] + '"></i></td>';
                this_html += '</tr>';
            }
        })
        d("#mac_filters_table").append(this_html);
    }

    et.selectall = function () {
        var allcheckvalue = d('#allchecked').attr('data-value');
        if (allcheckvalue == '0') {
            d('#select_laber').text(SHpack.cancelall[nowLang]);
            d('.row_checkbox').prop('checked', true).attr('data-value','1');
            d('#allchecked').prop('checked', true).attr('data-value','1');
        } else {
            d('#select_laber').text(SHpack.selectall[nowLang]);
            d('.row_checkbox').prop('checked', false).attr('data-value','0');
            d('#allchecked').prop('checked', false).attr('data-value','0');
        }
    };

    et.select_row = function (evt) {
        var rowcheck = d(evt).attr('data-value');
        if(rowcheck == '1'){
            d('#select_laber').text(SHpack.selectall[nowLang]);
            d(evt).prop('checked', false).attr('data-value','0');
            d('#allchecked').prop('checked', false).attr('data-value','0');
        }else {
            d(evt).prop('checked', true).attr('data-value','1');
        }
        if (d('.row_checkbox').length == d('.row_checkbox:checked').length){
            d('#select_laber').text(SHpack.cancelall[nowLang]);
            d('#allchecked').prop('checked', true).attr('data-value','1');
        }
    }

    et.showbox = function (evt) {
        var this_model;
        d(".firewall_tab ").removeClass("show");
        d(evt).addClass('active').siblings().removeClass('active');
        this_model = d(evt).attr('data-value');
        refresh_init(this_model);
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
    }

    et.closewin = function (evt) {
        closewin(evt)
    }

    function closewin(obj) {
        d('.mask').removeClass('mask_show');
        d(obj).parents('.add_box').removeClass('add_show');
        d('.onError').remove();
    }

    et.save = function (evt) {
        mac_config(evt);
    }

    function mac_config(evt) {
        var a = {};
        if (!g.volide_ok('.add_box')) {
            return;
        }
        closewin(evt);
        a.src_mac = d("#mac_src").val().toLowerCase();
        a.name = d("#mac_reamek").val();
        if (optflag == 'edit') {
            a.real_num = parseInt(d("#real_num").val());
        }
        a.operate = optflag;
        if (macfilter_info && macfilter_info.length > 0) {
            var dubflag = 0;
            d.each(macfilter_info, function (n, m) {
                if (m.src_mac == a.src_mac) {
                    if(m.real_num == a.real_num){
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
        mac_set(a);
    }

    et.delsele = function () {
        var a = {}, b = [], this_checked;
        this_checked = d('#mac_filters_table').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        a.list = '';
        this_checked.each(function (n, m) {
            a.list += d(m).parents('tr').find('.real_num').text() + ',';
        });
        a.operate = "del";
        mac_set(a);

    }

    et.del = function (evt) {
        var a = {};
        a.list = d(evt).parents('tr').find('.real_num').text() + ",";
        a.operate = "del";
        mac_set(a);
    }

    et.edit = function (evt) {
        var addbox = '.add_box', marleft, martop;
        d('.mask').addClass('mask_show');
        marleft = (d(window).innerWidth() - d(addbox).innerWidth()) / 2;
        martop = (d(window).innerHeight() - d(addbox).innerHeight()) / 2;
        d(addbox).css({'left': marleft + 'px', 'top': martop + 'px'});
        d(addbox).addClass('add_show').siblings().removeClass('add_show');
        optflag = "edit";
        d("#ipaddbox").addClass("add_show");
        mac_setdefault(evt);

        g.firewall_volide(addbox, nowLang);
    }

    function mac_setdefault(evt) {
        var mac_addr, mac_remark, real_num;
        mac_addr = d(evt).parents('tr').find('.mac_addr').text();
        mac_remark = d(evt).parents('tr').find('.mac_remark').text();
        real_num = d(evt).parents('tr').find('.real_num').text();
        d("#mac_src").val(mac_addr);
        d("#mac_reamek").val(mac_remark);
        d("#real_num").val(real_num);
    }

    function mac_set(arg) {
        f.setMacFilter(arg, function (data) {
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
