define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    require("shpages")(d);

    var device, dhcp_status, arp_list, dhcp_info, assoc_info, filter_data, filter_type, filter_info = [],
        assoc_array = [], filter_array, macfilter_info, set_num = [], now_num, workmode;

    var listpage = 1, listnum = 10;

    exports.init = function () {
        e.plugInit(et, start_model);
    }

    function start_model(data) {
        nowLang = data.language.language;
        device = d('body').attr('device');
        g.common(nowLang, device);
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    function refresh_init() {
        f.getMConfig('wireless_user_list_get', '', function (data) {
            filter_data = data.wifi_filters;
            workmode = data.mode;
            if (filter_data.length > 0) {
                filter_type = filter_data[0].macfilter;
                filter_info = filter_data[0].wifi_filter || [];
            }
        }, false);

        f.getMConfig('macft_config', '', function (data) {
            if (data.errCode == 0) {
                macfilter_info = data.macfilter_list || [];
            }
        }, false);

        f.getLanDhcp(function (data) {
            if (data.errCode == 0) {
                dhcp_status = data.lanlist[0].dhcp.enable;
            }
        }, false);

        f.getWifiAssoc(function (data) {
            assoc_info = [];
            if (data.errCode == 0) {
                assoc_info = data['wifi-iface'];
            }
        }, false);

        f.getArpList(function (data) {
            if (data.errCode == 0) {
                arp_list = data.arp_list;
            }
        }, false);

        f.getDhcpList(function (data) {
            if (data.errCode == 0) {
                dhcp_info = data.dhcp;
            }
        }, false);
        assoc_and_filter();
    }

    function assoc_and_filter() {
        filter_init();
        assoc_init();
    }

    function assoc_init() {
        var i = 0;
        assoc_array = [];
        d.each(assoc_info, function (n, m) {
            if (m && m.length > 1 && m.ifname != 'vif-sta0') {
                d.each(m, function (x, y) {
                    if (x != 0) {
                        var filter_flag;
                        d.each(filter_array, function (z, l) {
                            if (y.mac == l.macaddr || y.mac.toUpperCase() == l.macaddr || y.mac == l.macaddr.toUpperCase()) {
                                filter_flag = 1;

                                return false;
                            }
                        });
                        if (filter_flag) {
                            return true;
                        }
                        assoc_array[i] = y;
                        var dhcp_flag = 0, arp_flag = 0;
                        if (dhcp_status == '1') {
                            d.each(dhcp_info, function (z, l) {
                                if (y.mac == l.mac || y.mac == l.mac.toUpperCase() || y.mac.toUpperCase() == l.mac) {
                                    dhcp_flag = 1;
                                    assoc_array[i] = d.extend({}, y, l);
                                }
                            })
                        }
                        if (dhcp_flag) {
                            i++;
                            return true;
                        }

                        d.each(arp_list, function (z, l) {
                            if (y.mac.toUpperCase() == l.mac.toUpperCase()) {
                                arp_flag = 1;
                                assoc_array[i] = d.extend({}, y, l);
                            }
                        });

                        if (arp_flag) {
                            i++;
                            return true;
                        }
                        i++;
                    }
                })
            }
        });
        showassoctable();
    }

    function showassoctable() {
        list_show(listpage, listnum);
        d("#online_device_page").SHPages({
            total: assoc_array.length,
            pageTotal: listnum,
            current: listpage,
            PageFn: function (p) {
                list_show(p, listnum);
            }
        }, nowLang);
    }

    function list_show(currentline, pageline) {
        var this_html = '';
        d("#user_tbody").empty();
        d.each(assoc_array, function (n, m) {
            var commentname, mip;

            if (m.commentname == undefined) {
                commentname = '*'
            } else {
                commentname = m.commentname;
            }

            if (m.ip == undefined) {
                mip = '*'
            } else {
                mip = m.ip;
            }

            this_html += '<tr>';
            this_html += '<td class="text-center user_name" style="width: 10%">' + commentname || '' + '</td>';
            this_html += '<td class="text-center user_ip hide-xs">' + mip + '</td>';
            this_html += '<td class="text-center user_mac">' + m.mac.toUpperCase() + '</td>';
            this_html += '<td class="text-center user_rxbytes hide-xs">' + bytesToSize(m.rxbytes) + '</td>';
            this_html += '<td class="text-center user_txbytes">' + bytesToSize(m.txbytes) + '</td>';
            this_html += '<td class="text-center user_time hide-xs">' + contimes(m.contime) + '</td>';
            this_html += '<td ><i et="click tap:add_black"  class="list_edit iconfont icon-heimingdan" sh_title="SHpack.joinblack" title="' + SHpack.joinblack[nowLang] + '"></i></td>';
            this_html += '</tr>';

        })
        d("#user_tbody").html(this_html);
    }

    function bytesToSize(bytes) {
        if (!bytes) {
            return '*';
        }
        if (bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));

        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    }

    function contimes(times) {
        var t;
        if(times > -1){
            var hour = Math.floor(times/3600);
            var min = Math.floor(times/60) % 60;
            var sec = times % 60;
            if(hour < 10) {
                t = '0'+ hour + ":";
            } else {
                t = hour + ":";
            }

            if(min < 10){t += "0";}
            t += min + ":";
            if(sec < 10){t += "0";}
            t += sec.toFixed(2);
        }
        t=t.substring(0,t.length-3);
        return t;
    }

    function filter_init() {
        filter_array = [];
        if (!filter_info.length) {
            filter_info = [];
        }

        d.each(filter_info, function (n, m) {
            filter_array.push(m);
        });
        showfiltertable();
    }

    function showfiltertable() {
        var defapage, defanum;
        defapage = 1;
        defanum = 10;
        filter_list(defapage, defanum);
        d("#pageinfo").SHPages({
            total: filter_array.length,
            pageTotal: defanum,
            current: defapage,
            PageFn: function (p) {
                filter_list(p, defanum);
            }
        }, nowLang);
    }

    function filter_list() {
        var this_html = '';
        d("#black_info").empty();
        d.each(filter_array, function (n, m) {
            set_num.push(m.num);
            this_html += '<tr>';
            this_html += '<td class="text-center user_name">' + (m.name || '*') + '</td>';
            this_html += '<td class="text-center user_mac">' + m.macaddr.toUpperCase() + '</td>';
            this_html += '<td class="text-center user_num hide">' + m.num + '</td>';
            this_html += '<td class="text-center"><a et="click tap:del_black" class="list_edit iconfont icon-wifidel" sh_title = "SHpack.removeblack" title="' + SHpack.removeblack[nowLang] + '"></a></td>';
            this_html += '</tr>';
        });
        d("#black_info").append(this_html);
    }

    function reckonnum() {
        if (set_num.join(',').indexOf(now_num) > -1) {
            now_num++;
            reckonnum();
        }
    }

    et.add_black = function (evt) {
        var a = {}, b = [], c = [], remove_mac;
        c[0] = {};
        now_num = 0;
        remove_mac = d(evt).parents('tr').find('.user_mac').text().toLowerCase();
        a.src_mac = remove_mac;
        a.operate = "add";
        c[0].num = reckonnum() || now_num;
        c[0].macaddr = remove_mac;
        c[0].name = d(evt).parents('tr').find('.user_name').text();

        d.each(assoc_info, function (n, m) {
            if (m.ifname != 'vif-sta0') {
                b[n] = {};
                b[n].maclist = c;
                b[n].iface = n;
                b[n].macfilter = "deny";
                b[n].action = "add";
            }
        });
        a.wifi_filters = b;
        set_config(a);
    };

    et.prev = function () {
        location.href = 'index.html';
    };

    et.del_black = function (evt) {
        var a = {}, b = [], c = [], remove_mac, remove_num, del_mac_num = [];
        c[0] = {};
        remove_mac = d(evt).parents('tr').find('.user_mac').text().toLowerCase();
        remove_num = d(evt).parents('tr').find('.user_num').text().toLowerCase();
        d.each(filter_info, function (n, m) {
            if (remove_mac == m.macaddr) {
                c[0].num = parseInt(remove_num);
                c[0].macaddr = m.macaddr;
            }
        });
        c[0].name = "";

        d.each(filter_data, function (n, m) {
            b[n] = {};
            b[n].maclist = c;
            b[n].macfilter = "deny";
            b[n].iface = n;
            b[n].action = "del";
        });
        a.wifi_filters = b;

        d.each(macfilter_info, function (n, m) {
            if (remove_mac == m.src_mac) {
                del_mac_num.push(m.real_num);
            }
        });
        a.list = del_mac_num.join(",") + ",";
        a.operate = "del";
        set_config(a);
    };

    function set_config(arg) {
        f.setMConfig('wireless_user_list_set', arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
                if (workmode == 'router') {
                    g.animationWidth(2,seted);
                } else {
                    g.animationWidth(10,seted);
                }
            }
        });
    }

    function seted() {
        d('.Loadmask').remove();
        d('.Loadbox').remove();
        refresh_init()
    }

});
