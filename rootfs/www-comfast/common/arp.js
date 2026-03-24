define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, arpbind_info = [], arp_info, optflag;

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
        d('input[type=checkbox]').prop('checked', false).attr('data-value', '0');
        f.getArpBind(function (data) {
            if (data.errCode == 0) {
                arpbind_info = data.arp_bind || [];
            }
        }, false);

        f.getArpList(function (arplist) {
            if (arplist && arplist.errCode == 0) {
                arp_info = arplist.arp_list || [];
                refresh_arplist();
            }
        });
    }

    function refresh_arplist() {
        if (!arp_info.length && !arpbind_info.length) {
            d("#arp_table").html('');
            return;
        }
        d.each(arp_info, function (n, m) {
            if (m.static != '1') {
                arpbind_info.push(m);
            }
        })
        arplist_show();
    }

    function arplist_show() {
        d('.row_checkbox').prop('checked', false).attr('data-value', '0');
        d('#allchecked').prop('checked', false).attr('data-value', '0');
        var this_html = '';
        d("#arp_table").empty();
        d.each(arpbind_info, function (n, m) {
            this_html += "<tr>";
            if (m.static != '0') {
                if (device == 'mobile') {
                    this_html += '<td><input type="checkbox" et="tap:select_row" class="row_checkbox"></td>';
                } else {
                    this_html += '<td><input type="checkbox" et="click:select_row" class="row_checkbox"></td>';
                }
            } else {
                this_html += '<td><input type="checkbox" disabled class="row_checkbox"></td>';
            }
            this_html += '<td>' + (n + 1) + '</td>';
            this_html += '<td class="arp_ipaddr">' + m.ip + '</td>';
            this_html += '<td class="arp_mac">' + m.mac.toUpperCase() + '</td>';
            this_html += '<td class="arp_network">' + m.ifname.slice(0, 3).toUpperCase() + '</td>';
            this_html += '<td class="arp_name">' + (m.remark || "") + '</td>';
            if (m.static != '0') {
                this_html += '<td class="arp_bind" sh_lang="SHpack.Statu_bind">' + SHpack.Statu_bind[nowLang] + '</td>';
                this_html += '<td class="arp_rnum" style="display: none">' + m.real_num + '</td>';
                this_html += '<td ><i et="click tap:edit" class="list_edit" sh_title = "SHpack.edit" title = "' + SHpack.edit[nowLang] + '"></i><i et="click tap:del" class="list_unlink" sh_title = "SHpack.arp_unbind" title = "' + SHpack.arp_unbind[nowLang] + '"></i></td>';
            } else {
                this_html += '<td class="arp_bind" sh_lang="SHpack.Statu_bind">' + SHpack.Statu_unbind[nowLang] + '</td>';
                this_html += '<td ><i et="click tap:bind" class="list_link" sh_title = "SHpack.arp_bind" title = "' + SHpack.arp_bind[nowLang] + '"></i></td>';
            }

            this_html += '</tr>';
        })
        d("#arp_table").append(this_html);
    }

    et.selectall = function () {
        var allcheckvalue = d('#allchecked').attr('data-value');
        if (allcheckvalue == '0') {
            d('.row_checkbox:enabled').prop('checked', true).attr('data-value', '1');
            d('#allchecked').prop('checked', true).attr('data-value', '1');
        } else {
            d('.row_checkbox:enabled').prop('checked', false).attr('data-value', '0');
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
        if (d('.row_checkbox:enabled').length == d('.row_checkbox:checked').length) {
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
        g.firewall_volide(addbox, nowLang)
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
        arp_config(evt);
    };

    function arp_config(evt) {
        var a = {};
        var b = [];
        if (!g.volide_ok('.add_box')) {
            return;
        }
        closewin(evt);
        b[0] = {};
        b[0].ip = d("#arp_ip_src").val();
        b[0].mac = d("#arp_mac_src").val().toLowerCase();
        b[0].ifname = d("#arp_ifname_src").val();
        b[0].remark = d("#arp_remark_src").val();

        if (optflag == "add") {
            a.add_list = b;
        } else if (optflag == "edit") {
            a = b[0];
            a.real_num = parseInt(d("#real_num").val());
        }
        a.operate = optflag;
        for (var i = 0; i < arpbind_info.length; i++) {
            var m = arpbind_info[i];
            if (m.real_num == a.real_num) {
                continue;
            }

            if (m.ip == b[0].ip && m.ifname.indexOf(b[0].ifname) > -1) {
                alert(SHtips.dubip[nowLang]);
                return false;
            }

            if (m.ip == b[0].ip && m.mac == b[0].mac && m.ifname.indexOf(b[0].ifname) > -1) {
                alert(SHtips.dubset[nowLang]);
                return false;
            }
        }
        arp_set(a);
    }

    et.delsele = function () {
        var a = {}, this_checked;

        this_checked = d('#arp_table').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        a.del_list = '';
        this_checked.each(function (n, m) {
            a.del_list += d(m).parents('tr').find('.arp_rnum').text() + ',';
        });
        a.operate = "del";
        arp_set(a);

    }

    et.del = function (evt) {
        var a = {};
        a.del_list = d(evt).parents('tr').find('.arp_rnum').text() + ",";
        a.operate = "del";
        arp_set(a);
    }

    et.edit = function (evt) {
        var addbox = '.add_box', marleft, martop;
        d('.mask').addClass('mask_show');
        marleft = (d(window).innerWidth() - d(addbox).innerWidth()) / 2;
        martop = (d(window).innerHeight() - d(addbox).innerHeight()) / 2;
        d(addbox).css({'left': marleft + 'px', 'top': martop + 'px'});
        d(addbox).addClass('add_show').siblings().removeClass('add_show');
        optflag = "edit";
        d(".arp_add").addClass("add_show");
        arp_setdefault(evt);
        g.firewall_volide(addbox, nowLang);
    }

    function arp_setdefault(evt) {
        var arp_ipaddr, arp_mac, arp_network, arp_name, arp_rnum;
        arp_ipaddr = d(evt).parents('tr').find('.arp_ipaddr').text();
        arp_mac = d(evt).parents('tr').find('.arp_mac').text();
        arp_network = d(evt).parents('tr').find('.arp_network').text().toLowerCase();
        arp_name = d(evt).parents('tr').find('.arp_name').text();
        arp_rnum = d(evt).parents('tr').find('.arp_rnum').text();
        d("#arp_ip_src").val(arp_ipaddr);
        d("#arp_mac_src").val(arp_mac);
        d("#arp_ifname_src").val(arp_network);
        d("#arp_remark_src").val(arp_name);
        d("#real_num").val(arp_rnum);
    }

    et.bind = function (evt) {
        var arp_ipaddr, arp_mac, arp_network, arp_name, a = {}, b = [];
        arp_ipaddr = d(evt).parents('tr').find('.arp_ipaddr').text();
        arp_mac = d(evt).parents('tr').find('.arp_mac').text();
        arp_network = d(evt).parents('tr').find('.arp_network').text().toLowerCase();
        arp_name = d(evt).parents('tr').find('.arp_name').text();
        b[0] = {};
        b[0].ip = arp_ipaddr;
        b[0].mac = arp_mac.toLowerCase();
        b[0].ifname = arp_network;
        b[0].remark = arp_name;
        a.add_list = b;
        a.operate = "add";
        arp_set(a);
    };

    function arp_set(arg) {
        f.setArpBind(arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
                g.animationWidth(1, seted);
            }
        })
    }

    function seted() {
        d('.Loadmask').remove();
        d('.Loadbox').remove();
        refresh_init()
    }
});
