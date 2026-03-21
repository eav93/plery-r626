define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    require("shpages")(d);

    var device, urlfilter_info, optflag;

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
        d('input[type=checkbox]').prop('checked', false).attr('data-value', '0');
        f.getUrlFilter(function (data) {
            if (data.errCode == 0) {
                urlfilter_info = data.url_filter_list || [];
                refresh_urllist();
            }
        });

    }

    function refresh_urllist() {
        var defapage, defanum;
        if (!urlfilter_info.length) {
            d("#url_filters_table").html('');
            d('.PageInfo').html('');
            d('.PageCode').html('');
            return;
        }
        defapage = 1;
        defanum = 10;
        urllist_show(defapage, defanum);
        d("#url_page").SHPages({
            total: urlfilter_info.length,
            pageTotal: defanum,
            current: defapage,
            PageFn: function (p) {
                urllist_show(p, defanum);
            }
        }, nowLang);
    }

    function urllist_show(currentline, pageline) {
        d('#select_laber').text(SHpack.selectall[nowLang]);
        d('.row_checkbox').prop('checked', false).attr('data-value', '0');
        d('#allchecked').prop('checked', false).attr('data-value', '0');
        var this_html = '';
        d("#url_filters_table").empty();
        d.each(urlfilter_info, function (n, m) {
            if (n >= (parseInt(currentline) - 1) * pageline && n < parseInt(currentline) * pageline) {

                this_html += '<tr>';
                this_html += '<td><input type="checkbox" et="click:select_row" class="row_checkbox"></td>';
                this_html += '<td>' + (n + 1) + '</td>';
                this_html += '<td class="url_name" >' + m.url_name + '</td>';
                this_html += '<td class="url_rnum" style="display: none">' + m.url_com_num + '</td>';
                this_html += '<td ><i et="click:edit" class="list_edit" sh_title = "SHpack.edit" title = "' + SHpack.edit[nowLang] + '"></i><i et="click:del" class="list_del" sh_title = "SHpack.del" title = "' + SHpack.del[nowLang] + '"></i></td>';
                this_html += '</tr>';
            }
        })
        d("#url_filters_table").append(this_html);
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
        url_config(evt);
    };

    function url_config(evt) {
        var a = {}, b = [];
        var urlfilter_length;
        if (!g.volide_ok('.add_box')) {
            return;
        }
        urlfilter_length = urlfilter_info.length;

        if (urlfilter_info.length) {
            urlfilter_length = parseInt(g.getifacenum(urlfilter_info[urlfilter_info.length - 1].url_com_num)) + 1;
        }

        closewin(evt);
        b[0] = {};
        b[0].url_name = d("#url_src").val().toLowerCase();
        if (d("#real_num").val() != "") {
            b[0].url_com_num = d("#real_num").val();
        } else {
            b[0].url_com_num = "url_filter" + (parseInt(urlfilter_length));
        }
        b[0].action = optflag;
        if (urlfilter_info.length > 0) {
            for (var i = 0; i < urlfilter_info.length; i++) {
                var m = urlfilter_info[i];

                if (m.url_com_num == b[0].url_com_num && optflag == "edit") {
                    continue;
                }
                if (m.url_name == b[0].url_name) {
                    alert(SHtips.dubset[nowLang]);
                    return false;
                }
            }
        }
        a.url_filter_list = b;
        url_set(a);
    }

    et.delsele = function () {
        var a = {}, b = [], this_checked;

        this_checked = d('#url_filters_table').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        this_checked.each(function (n, m) {
            b[n] = {};
            b[n].action = "del";
            b[n].url_com_num = d(m).parents('tr').find('.url_rnum').text();
        });
        a.url_filter_list = b;
        url_set(a);
    }

    et.del = function (evt) {
        var a = {}, b = [];
        b[0] = {};
        b[0].url_com_num = d(evt).parents('tr').find('.url_rnum').text();
        b[0].action = "del";
        a.url_filter_list = b;
        url_set(a);
    }

    et.edit = function (evt) {
        var addbox = '.add_box', marleft, martop;
        d('.mask').addClass('mask_show');
        marleft = (d(window).innerWidth() - d(addbox).innerWidth()) / 2;
        martop = (d(window).innerHeight() - d(addbox).innerHeight()) / 2;
        d(addbox).css({'left': marleft + 'px', 'top': martop + 'px'});
        d(addbox).addClass('add_show').siblings().removeClass('add_show');

        optflag = "edit";
        d(".url_add").addClass("add_show");
        url_setdefault(evt);

        g.firewall_volide(addbox, nowLang);
    }

    function url_setdefault(evt) {
        var url_name, url_rnum;
        url_name = d(evt).parents('tr').find('.url_name').text();
        url_rnum = d(evt).parents('tr').find('.url_rnum').text();
        d("#url_src").val(url_name);
        d("#real_num").val(url_rnum);
    }

    function url_set(arg) {
        f.setUrlFilter(arg, function (data) {
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
