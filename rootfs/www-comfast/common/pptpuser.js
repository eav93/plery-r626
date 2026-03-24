define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, pptpd_user, action;

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
        d('input[type=checkbox]').prop('checked', false).attr('data-value', '0');
        f.getPPTPuser(function (data) {
            if (data.errCode == 0) {
                pptpd_user = data.pptpd_user || [];
                refresh_userlist();
            }
        });

    }

    function refresh_userlist() {
        if (!pptpd_user.length) {
            d("#user_table").html('');
            return;
        }
        urllist_show();
    }

    function urllist_show() {
        d('.row_checkbox').prop('checked', false).attr('data-value', '0');
        d('#allchecked').prop('checked', false).attr('data-value', '0');
        var this_html = '';
        d("#user_table").empty();

        d.each(pptpd_user, function (n, m) {
            this_html += '<tr>';
            this_html += '<td><input type="checkbox" et="click:select_row" class="row_checkbox"></td>';
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="pptp_username" >' + m.username + '</td>';
            this_html += '<td class="pptp_password" >' + m.password + '</td>';
            this_html += '<td class="real_num" style="display: none">' + m.real_num + '</td>';
            this_html += '<td ><i et="click:edit" class="list_edit" sh_title = "SHpack.edit" title = "' + SHpack.edit[nowLang] + '"></i><i et="click:del" class="list_del" sh_title = "SHpack.del" title = "' + SHpack.del[nowLang] + '"></i></td>';
            this_html += '</tr>';
        });
        d("#user_table").append(this_html);
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

    et.showbox = function (evt) {
        var this_model;
        d(".firewall_tab ").removeClass("show");
        d(evt).addClass('active').siblings().removeClass('active');
        this_model = d(evt).attr('data-value');
        refresh_init(this_model);
    }

    et.add = function () {
        var addbox = '.add_box', marleft, martop;
        action = "add";
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
        url_config(evt);
    };

    function url_config(evt) {
        var a = {}, double_flag = 0;
        if (!g.volide_ok('.add_box')) {
            return;
        }
        if (action == 'add' && pptpd_user.length == 512) {
            g.shconfirm(nowLang, SHtips.maxlength[nowLang], "error");
            return false;
        }
        if (action == "edit") {
            a.real_num = parseInt(d("#real_num").val());
        }
        a.operate = action;
        a.username = d("#username").val();
        a.password = d("#password").val();
        d.each(pptpd_user, function (n, m) {
            if (a.real_num != m.real_num && a.username == m.username) {
                double_flag = 1;
                return false;
            }
        });
        if (double_flag) {
            g.shconfirm(nowLang, SHtips.sameas[nowLang], "error");
            return false;
        }
        closewin(evt);
        user_set(a);
    }

    et.delsele = function () {
        console.log(000)
        action = "del"
        var a = {}, this_checked, del_arr = [];
        a.operate = action;
        a.list = '';

        this_checked = d('#user_table').find('input:checked');
        console.log(this_checked)
        if (this_checked.length < 1) {
            return;
        }
        this_checked.each(function (n, m) {
            del_arr.push(d(m).parents('tr').find('.real_num').text());
        });
        a.list = del_arr.sort(function (a, b) {
            return b - a;
        }).join(',') + ',';
        user_set(a);
    }

    et.del = function (evt) {
        action = "del"
        var a = {}
        a.operate = action;
        a.list = d(evt).parents('tr').find('.real_num').text() + ','
        user_set(a);
    }

    et.edit = function (evt) {
        var addbox = '.add_box', marleft, martop;
        d('.mask').addClass('mask_show');
        marleft = (d(window).innerWidth() - d(addbox).innerWidth()) / 2;
        martop = (d(window).innerHeight() - d(addbox).innerHeight()) / 2;
        d(addbox).css({'left': marleft + 'px', 'top': martop + 'px'});
        d(addbox).addClass('add_show').siblings().removeClass('add_show');

        action = "edit";
        d(".url_add").addClass("add_show");
        user_setdefault(evt);

        g.firewall_volide(addbox, nowLang);
    }

    function user_setdefault(evt) {
        d("#username").val(d(evt).parents('tr').find('.pptp_username').text());
        d("#password").val(d(evt).parents('tr').find('.pptp_password').text());
        d("#real_num").val(d(evt).parents('tr').find('.real_num').text());
    }

    function user_set(arg) {
        f.setPPTPuser(arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(1,seted);
            }
        })
    }

    function seted() {
        d('.Loadmask').remove();
        d('.Loadbox').remove();
        refresh_init()
    }

});
