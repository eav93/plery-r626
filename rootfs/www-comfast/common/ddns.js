define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    require("shpages")(d);

    var device, ddns_info = [], optflag;

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
        d('.select li').on('click tap', function () {
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

        f.getMConfig('ddns', '', function (data) {
            if (data && data.errCode == 0) {
                ddns_info = data.ddns_list || data.ddns || [];
                if (!Array.isArray(ddns_info)) ddns_info = [];
                refresh_list();
            }
        });
    }

    function refresh_list() {
        var defapage = 1, defanum = 10;

        if (!ddns_info.length) {
            d("#user_table").html('');
            d('.PageInfo').html('');
            d('.PageCode').html('');
            return;
        }

        list_show(defapage, defanum);
        d("#url_page").SHPages({
            total: ddns_info.length,
            pageTotal: defanum,
            current: defapage,
            PageFn: function (p) {
                list_show(p, defanum);
            }
        });
    }

    function list_show(page, num) {
        var html = '', start = (page - 1) * num, end = Math.min(start + num, ddns_info.length);

        for (var i = start; i < end; i++) {
            var item = ddns_info[i];
            html += '<tr>';
            html += '<td><input type="checkbox" data-value="0" data-index="' + i + '" class="itemcheck"/></td>';
            html += '<td>' + (i + 1) + '</td>';
            html += '<td>' + (item.enabled == '1' ? SHpack.enable[nowLang] : SHpack.disable[nowLang]) + '</td>';
            html += '<td>' + (item.service_name || '-') + '</td>';
            html += '<td>' + (item.domain || '-') + '</td>';
            html += '<td>' + (item.username || '-') + '</td>';
            html += '<td>' + (item.password ? '******' : '-') + '</td>';
            html += '<td>' + (item.ip_address || '-') + '</td>';
            html += '<td>' + (item.interface || '-') + '</td>';
            html += '<td><a class="a_edit" data-index="' + i + '" et="click:edit">' + SHpack.edit[nowLang] + '</a></td>';
            html += '</tr>';
        }
        d("#user_table").html(html);
    }

    function openbox() {
        var addbox = '.add_box', marleft, martop;
        d('.mask').addClass('mask_show');
        marleft = (d(window).innerWidth() - d(addbox).innerWidth()) / 2;
        martop = (d(window).innerHeight() - d(addbox).innerHeight()) / 2;
        d(addbox).css({'left': marleft + 'px', 'top': martop + 'px'});
        d(addbox).addClass('add_show');
        d('.onError').remove();
    }

    function closebox(evt) {
        d('.mask').removeClass('mask_show');
        d(evt).parents('.add_box').removeClass('add_show');
        d('.onError').remove();
    }

    et.add = function () {
        optflag = 'add';
        d('#switch').val('1');
        d('#service_name').val('dyndns.org');
        d('#domain').val('');
        d('#username').val('');
        d('#password').val('');
        d('#src_ip').val('network');
        openbox();
    };

    et.edit = function (event) {
        var idx = d(event.target).attr('data-index');
        var item = ddns_info[idx];
        if (!item) return;
        optflag = 'edit';
        d('#real_num').val(idx);
        d('#switch').val(item.enabled || '0');
        d('#service_name').val(item.service_name || 'dyndns.org');
        d('#domain').val(item.domain || '');
        d('#username').val(item.username || '');
        d('#password').val(item.password || '');
        d('#src_ip').val(item.ip_source || 'network');
        openbox();
    };

    et.save = function () {
        if (!g.volideall('.add_box', nowLang, device)) return;

        var config = {
            enabled: d('#switch').val(),
            service_name: d('#service_name').val(),
            domain: d('#domain').val(),
            username: d('#username').val(),
            password: d('#password').val(),
            ip_source: d('#src_ip').val(),
            interface: d('#interfacename').val() || 'wan'
        };

        if (optflag == 'edit') {
            config.index = d('#real_num').val();
        }

        f.setMConfig('ddns_config', config, function (data) {
            if (data.errCode == 0) {
                g.shconfirm(nowLang, SHtips.set_ok[nowLang], "success");
                d('.mask').removeClass('mask_show');
                d('.add_box').removeClass('add_show');
                refresh_init();
            } else {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            }
        });
    };

    et.switchConfig = function () {
        var val = d('#switch').val();
        if (val == '0') {
            d('#domain').attr('disabled', true);
            d('#username').attr('disabled', true);
            d('#password').attr('disabled', true);
        } else {
            d('#domain').attr('disabled', false);
            d('#username').attr('disabled', false);
            d('#password').attr('disabled', false);
        }
    };

    et.srcipselect = function () {
        if (d('#src_ip').val() == 'network') {
            d('#interfacelist').show();
        } else {
            d('#interfacelist').hide();
        }
    };

    et.selectall = function () {
        var checked = d('#allchecked').attr('data-value');
        if (checked == '0') {
            d('.itemcheck').prop('checked', true).attr('data-value', '1');
            d('#allchecked').attr('data-value', '1');
        } else {
            d('.itemcheck').prop('checked', false).attr('data-value', '0');
            d('#allchecked').attr('data-value', '0');
        }
    };

    et.delsele = function () {
        var indices = [];
        d('.itemcheck:checked').each(function () {
            indices.push(d(this).attr('data-index'));
        });
        if (!indices.length) return;

        f.setMConfig('ddns_config', {delete: indices.join(',')}, function (data) {
            if (data.errCode == 0) {
                g.shconfirm(nowLang, SHtips.set_ok[nowLang], "success");
                refresh_init();
            }
        });
    };
});
