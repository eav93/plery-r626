define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    require("shpages")(d);

    var device, port_info, optflag;

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
        f.getPortforward(function (data) {
            if (data.errCode == 0) {
                port_info = data.portfw_list || [];
                refresh_portlist();
            }
        });
    }

    function refresh_portlist() {
        var defapage, defanum;
        if (!port_info.length) {
            d("#port_table").html('');
            d('.PageInfo').html('');
            d('.PageCode').html('');
            return;
        }
        defapage = 1;
        defanum = 10;
        portlist_show(defapage, defanum);
        d("#port_page").SHPages({
            total: port_info.length,
            pageTotal: defanum,
            current: defapage,
            PageFn: function (p) {
                portlist_show(p, defanum);
            }
        }, nowLang);
    }

    function portlist_show(currentline, pageline) {
        d('#select_laber').text(SHpack.selectall[nowLang]);
        d('.row_checkbox').prop('checked', false).attr('data-value', '0');
        d('#allchecked').prop('checked', false).attr('data-value', '0');
        var this_html = '';
        d("#port_table").empty();
        d.each(port_info, function (n, m) {
            if (n >= (parseInt(currentline) - 1) * pageline && n < parseInt(currentline) * pageline) {
                var portlist, start_port, end_port;

                if (m.src_dport.indexOf('-') < 0) {
                    start_port = end_port = m.src_dport;
                } else {
                    portlist = m.src_dport.split("-");
                    start_port = portlist[0];
                    end_port = portlist[1];
                }

                this_html += '<tr>';
                this_html += '<td><input type="checkbox" et="click:select_row" class="row_checkbox"></td>';
                this_html += '<td>' + (n + 1) + '</td>';
                this_html += '<td class="dest_ip">' + m.dest_ip + '</td>';
                this_html += '<td class="pf_proto">' + m.proto.toUpperCase() + '</td>';
                if (m.proto.toUpperCase() == 'ALL') {
                    this_html += '<td class="pf_sp">1</td>';
                    this_html += '<td class="pf_ep">65535</td>';
                } else {
                    this_html += '<td class="pf_sp">' + start_port + '</td>';
                    this_html += '<td class="pf_ep">' + end_port + '</td>';
                }
                this_html += '<td class="pf_name">' + m.name + '</td>';
                this_html += '<td class="pf_rnum" style="display: none">' + m.real_num + '</td>';
                this_html += '<td ><i et="click:edit" class="list_edit" sh_title = "SHpack.edit" title = "' + SHpack.edit[nowLang] + '"></i><i et="click:del" class="list_del" sh_title = "SHpack.del" title = "' + SHpack.del[nowLang] + '"></i></td>';
                this_html += '</tr>';
            }
        });
        d("#port_table").append(this_html);
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
        d('input[type="text"]').val('').attr('disabled', false);
        d('#pf_proto_select').val('tcp udp');
        d('.onError').remove();
        g.firewall_volide(addbox, nowLang)
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
        pf_config(evt);
    };

    et.protoConfig = function () {
        var b = d("#pf_proto_select").val();
        proto_Config(b);
    }

    function proto_Config(data) {
        if (data == "all") {
            d("#startport").val("1");
            d("#endport").val("65535");
            d("#startport").attr('disabled', "true");
            d("#endport").attr('disabled', "true");
        } else {
            d("#startport").val("");
            d("#endport").val("");
            d("#startport").removeAttr("disabled");
            d("#endport").removeAttr("disabled");
        }
    }

    function pf_config(evt) {
        var a = {}, b = [], start_port, end_port, temp;
        if (!g.volide_ok('.add_box')) {
            return;
        }
        closewin(evt);
        b[0] = {};

        b[0].dest_ip = d("#ip_src").val();
        b[0].real_num = d("#real_num").val();

        start_port = d("#startport").val();
        end_port = d("#endport").val();

        if ((start_port != "") && (end_port != "")) {
            if (parseInt(start_port) > parseInt(end_port)) {
                temp = start_port;
                start_port = end_port;
                end_port = temp;
                b[0].src_dport = start_port + '-' + end_port;
            } else if (start_port == end_port)
                b[0].src_dport = start_port;
            else
                b[0].src_dport = start_port + '-' + end_port;
        } else {
            if (start_port != "") {
                b[0].src_dport = start_port;
            } else {
                b[0].src_dport = end_port;
            }
        }
        b[0].proto = d('#pf_proto_select').val();
        b[0].name = d('#pf_comment').val();

        if (d('#real_num').val() != '') {
            b[0].real_num = parseInt(d('#real_num').val());
        }

        if (b[0].proto == "all") {
            b[0].src_dport = "";
        }

        if (port_info && port_info.length > 0) {
            for (var i = 0; i < port_info.length; i++) {
                var m = port_info[i];
                if (m.dest_ip == b[0].dest_ip && m.proto == b[0].proto && m.src_dport == b[0].src_dport) {
                    if (m.real_num == b[0].real_num) {
                        continue;
                    }
                    alert(SHtips.dubset[nowLang]);
                    return false;
                }
            }
        }

        b[0].action = optflag;
        a.portfw_list = b;
        port_set(a);
    }

    et.delsele = function () {
        var a = {}, b = [], this_checked;

        this_checked = d('#port_table').find('input:checked');
        if (this_checked.length < 1) {
            return;
        }
        b[0] = {};
        b[0].list = '';
        this_checked.each(function (n, m) {
            b[0].list += d(m).parents('tr').find('.pf_rnum').text() + ',';
        });
        b[0].action = 'del';
        a.portfw_list = b;
        port_set(a);

    };

    et.del = function (evt) {
        var a = {}, b = [];

        b[0] = {};
        b[0].list = d(evt).parents('tr').find('.pf_rnum').text() + ",";
        b[0].action = "del";
        a.portfw_list = b;
        port_set(a);

    };

    et.edit = function (evt) {
        var addbox = '.add_box', marleft, martop;
        d('.mask').addClass('mask_show');
        marleft = (d(window).innerWidth() - d(addbox).innerWidth()) / 2;
        martop = (d(window).innerHeight() - d(addbox).innerHeight()) / 2;
        d(addbox).css({'left': marleft + 'px', 'top': martop + 'px'});
        d(addbox).addClass('add_show').siblings().removeClass('add_show');

        optflag = "edit";
        d(".port_add").addClass("add_show");
        port_setdefault(evt);

        g.firewall_volide(addbox, nowLang);
    }

    function port_setdefault(evt) {
        var pf_ipaddr, pf_proto, pf_sp, pf_ep, pf_name, pf_rnum;

        pf_ipaddr = d(evt).parents('tr').find('.dest_ip').text();
        pf_proto = d(evt).parents('tr').find('.pf_proto').text().toLowerCase();
        pf_sp = d(evt).parents('tr').find('.pf_sp').text();
        pf_ep = d(evt).parents('tr').find('.pf_ep').text();
        pf_name = d(evt).parents('tr').find('.pf_name').text();
        pf_rnum = d(evt).parents('tr').find('.pf_rnum').text();

        proto_Config(pf_proto);

        d("#ip_src").val(pf_ipaddr);
        d("#pf_proto_select").val(pf_proto);
        d("#startport").val(pf_sp);
        d("#endport").val(pf_ep);
        d("#pf_comment").val(pf_name);
        d("#real_num").val(pf_rnum);
    }

    function port_set(arg) {
        f.setPortforward(arg, function (data) {
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
