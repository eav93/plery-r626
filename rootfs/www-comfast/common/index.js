define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, color_array = [], wan_workmode, wifis_info, wan_info, wireless_client, link_info, wwan_info,
        firmware_info, rep_info, cpuflow_info, portstatus_info, link_status, iccid_and_imei;

    var GuideConfig;

    var up_data = 0, down_data = 0, flow_data_store = [], data = [], data_tx = [], data_change = 0, maximum = 0;

    var iface_array = ["iface_one", "iface_two", "iface_thr", "iface_for", "iface_fiv"];

    exports.init = function () {
        e.plugInit(et, start_model);
    };

    function start_model(data) {
        nowLang = data.language.language;
        device = d('body').attr('device');
        g.common(nowLang, device);
        d.ajax({
            type: 'GET',
            dataType: 'json',
            url: '/js/color.json',
            cache: false,
            async: false,
            success: function (data) {
                color_array[0] = data.color1;
                color_array[1] = data.color2;
                color_array[2] = data.color3;
                color_array[3] = data.color4;
            }
        });
        initchart();
        refresh_init();
        if (device == 'computer') {
            g.setmenuheight();
        }
    }

    function initchart() {
        var chartsize;
        if (device == 'computer') {
            chartsize = 130;
        } else {
            chartsize = 100;
        }
        $('#cpuusage').easyPieChart({barColor: color_array[0], size: chartsize});
        $('#menusage').easyPieChart({barColor: color_array[1], size: chartsize});
    }

    function refresh_init() {
        f.getMConfig('guide_config', '', function (data) {
            if (data.errCode == 0) {
                GuideConfig = data;
            }
        }, false);
        interval_network();
        f.getFirmwareInfo(function (data) {
            if (data.errCode == 0) {
                firmware_info = data.firmware;
                refresh_firmware();
            }
        }, false);

        getportstatus();
        getCpuAndFlow();
        setTimeout(function () {
            if (device == 'computer') {
                d("#flowchart").height(d("#char_height").height() - 44);
            } else {
                d("#flowchart").height(300);
            }
            setevent();
        }, 1000);
    }

    function interval_network() {

        f.getMConfig('network_config', '', function (data) {
            if (data.errCode == 0) {
                link_status = data.bridge_status.bridge_status || "";
                link_info = data.device;
                wan_workmode = data.workmode.workmode;
                wan_info = data.wanlist[0];
                wifis_info = data.wifi_info;
                wireless_client = data.wireless_num.wireless_num_sum;
                refresh_network();
                setTimeout(interval_network, 5000)
            }
        }, false);
    }

    function refresh_network() {

        var mode_name;
        if (wan_workmode == "router" || wan_workmode == "") {

            if (wan_info.proto.toUpperCase() == 'PPPOE') {
                mode_name = SHpack['pppoe'][nowLang];
                d("#wan_info").removeClass('hide');
            } else if (wan_info.proto.toUpperCase() == 'DHCP') {
                mode_name = SHpack['dyAddress'][nowLang];
                d("#wan_info").removeClass('hide');
            } else if (wan_info.proto.toUpperCase() == 'STATIC') {
                mode_name = SHpack['staAddress'][nowLang];
                d("#wan_info").removeClass('hide');
            } else if (wan_info.proto.toUpperCase() == 'QMI' || wan_info.proto.toUpperCase() == 'PPP_QUECTEL') {
                mode_name = SHpack['apn_mode'][nowLang];
                f.getMConfig('get_ec20_status_info', '', function (data) {
                    //data = {"module_info": {"sim_status": 0, "singal": "", "qwinfo": {"network_type": "", "network_stat": 0, "operater_code": "Unkown"}, "gprs_data": {"rx_bytes": "0", "tx_bytes": "0"}}, "errCode": 0, "errMsg": "OK", "configDone": false};
                    if (data.errCode == 0) {
                        show_apninfo(data.module_info);
                    }
                });

                f.getMConfig('get_ccid_and_imei', '', function (data) {
                    if (data && data.errCode == 0 && data.module_info) {
                        iccid_and_imei = data.module_info;
                        d('#apn_imei').html(iccid_and_imei.imei || '-');
                        d('#apn_iccid').html(iccid_and_imei.iccid || '-');
                    }
                })

                d("#qmi_info").removeClass('hide');
		d("#4g_ip").text(wan_info.wan_ipaddr || '0.0.0.0');
            }

            d("#wan_get_mode").text(mode_name);
            d("#wan_ip").text(wan_info.wan_ipaddr || '0.0.0.0');
            d("#mode_pic").attr("src", "/images/m_router.png");
            d("#mode_text").text(SHpack.router[nowLang]);
            d("#wireless_info").removeClass('hide');
        } else if (wan_workmode == "ap") {
            d("#wan_info").removeClass('hide');
            d("#wan_ip_info").addClass('hide');
            d("#wan_get_mode").text(SHpack['staAddress'][nowLang]);
            d("#mode_pic").attr("src", "/images/m_ap.png");
            d("#mode_text").text(SHpack.ap[nowLang]).attr('sh_lang', 'SHpack.ap');
            d("#wireless_info").removeClass('hide');
        } else if (wan_workmode == "wisp" || wan_workmode == "wds") {
            d("#rep_info").removeClass('hide');
            d("#wireless_info").removeClass('hide');
            if (wan_workmode == "wisp") {
                d("#sta_ssid").text(wifis_info.bridge_ssid || '');
                d("#mode_pic").attr("src", "/images/m_repeater.png");
                d("#mode_text").text(SHpack.repeater[nowLang]);
            } else if (wan_workmode == "wds") {
                d("#sta_ssid").text(wifis_info.bridge_ssid || '');
                d("#mode_pic").attr("src", "/images/m_bridge.png");
                d("#mode_text").text(SHpack.bridge[nowLang]);
            }
        } else if (wan_workmode == "mesh") {
            d("#mesh_info").removeClass('hide');
            d("#wireless_info").removeClass('hide');
            d("#sta_ssid").text(wifis_info.bridge_ssid || '');
            d("#mode_pic").attr("src", "/images/m_mesh.png");
            d("#mode_text").text(SHpack.mesh[nowLang]).attr('sh_lang', 'SHpack.mesh');
        } else if (wan_workmode == "wisp_c" || wan_workmode == "wds_c") {
            d("#rep_info").removeClass('hide');
            d("#sta_ssid").text(wifis_info.bridge_ssid || '');
            if (wan_workmode == "wisp_c") {
                d("#mode_pic").attr("src", "/images/m_repeater.png");
                d("#mode_text").text(SHpack.repeater_c[nowLang]).attr('sh_lang', 'SHpack.repeater_c');
            } else if (wan_workmode == "wds_c") {
                d("#mode_pic").attr("src", "/images/s_bridge_c_hover.png");
                d("#mode_text").text(SHsixmodels.bridge_c[nowLang]).attr('sh_lang', 'SHpack.bridge_c');
            }
        }

        if (wan_workmode != "wds_c" && wan_workmode != "wisp_c") {
            showwifi();
        }

        d("#user_num").text(wireless_client);
        d("#total_link").text(link_info.total);

        if (wan_workmode == 'mesh') {
            d("#mesh_id").text(wwan_info.mesh_id);
            if (rep_info.mesh_status != "0") {
                d("#mesh_status").text(SHpack.link_status_up[nowLang]);
                d("#mesh_signal").text(wifis_info.info.signal);
            } else {
                d("#mesh_status").text(SHpack.link_status_linking[nowLang]);
                d("#mesh_signal").text("unknown");
            }
        } else {
            if (link_status == '1') {
                d("#rep_status").text(SHpack.link_status_up[nowLang]);
                d("#rep_signal").text(wifis_info.info.signal);
            } else {
                d("#rep_status").text(SHpack.link_status_linking[nowLang]);
                d("#rep_signal").text("unknown");
            }
        }
    }

    function show_apninfo(data) {
        if (data.sim_status == 1) {
            d('#sim_status').addClass('hidden');
            d('.apn_row').removeClass('hidden');
            var gprs_data = parseInt(data.gprs_data.rx_bytes) + parseInt(data.gprs_data.tx_bytes);
            d('#apn_name').html(data.qwinfo.operater_code);
            if (data.qwinfo.network_stat) {
                d('#apn_network').html(data.qwinfo.network_type);
            } else {
                d('#apn_network').html(SHpack.g4_network_status[nowLang]);
            }
            d('#apn_data').html(data.singal);
        } else {
            d('#sim_status').removeClass('hidden');
            d('.apn_row').addClass('hidden');
        }
    }

    function data_convert(data) {
        if (data > 1073741824) {
            return (data / 1073741824).toFixed(2) + 'GB';
        } else if (data > 1048576) {
            return (data / 1048576).toFixed(2) + 'MB';
        } else if (data > 1024) {
            return (data / 1024).toFixed(2) + 'KB';
        } else {
            return data.toFixed(2) + 'B';
        }
    }

    function refresh_firmware() {
        var deviceName, deviceReg;

        d('#mac').html(firmware_info.macaddr.toUpperCase());
        if (firmware_info) {
            deviceReg = new RegExp(/(.+)-V(.+)/);
            var match = deviceReg.exec(firmware_info.version);
            deviceName = match ? match[1].split('-')[1] : firmware_info.version;
            d("#deviceinfo").text(deviceName);
            d("#version").text(firmware_info.version);
        }
    }

    function getportstatus() {
        f.getPortStatus(function (data) {
            if (data.errCode == 0) {
                portstatus_info = data.port_list || [];
                refreshportstatus();
                setTimeout(getportstatus, 10000)
            }
        })
    }

    function refreshportstatus() {
        var html = "", pleft, ptop;
        var i;
        var port_num = portstatus_info.length;
        for (i = 0; i < port_num; i++) {
            if (portstatus_info[i].up == 1) {
                html += '<li class ="link ' + iface_array[port_num - 1] + '">';
            } else {
                html += '<li class ="unlink ' + iface_array[port_num - 1] + '">';
            }
            if (portstatus_info[i].wan_enable == 1) {
                html += '<i class="iconfont wan"></i><p>WAN</p>';
            } else {
                html += '<i class="iconfont lan"></i><p>LAN</p>';
            }
            html += "</li>";
        }

        d('#port_list').html(html);
        pleft = (d('#port_list').parent().width() - d('#port_list').width()) / 2;
        ptop = (d('#port_list').parent().height() - d('#port_list').height()) / 2;
        d('#port_list').css({'left': pleft + 'px', 'top': ptop + 'px'})
    }

    function showwifi() {
        var wifihtml = '';

        if (GuideConfig.combine_wifi.enable == 0) {
            if (wifis_info.ssid_24g != undefined && wifis_info.ssid_24g != '' && wifis_info.ssid_58g != undefined && wifis_info.ssid_58g != '') {
                wifihtml += '<li class="list clearfix"><label class="left">2.4G SSID</label><span class="right">' + wifis_info.ssid_24g + '</span></li>';
                wifihtml += '<li class="list clearfix"><label class="left">5.8G SSID</label><span class="right">' + wifis_info.ssid_58g + '</span></li>';
            } else if (wifis_info.ssid_58g != undefined && wifis_info.ssid_58g != '') {
                wifihtml += '<li class="list clearfix"><label class="left">5.8G SSID</label><span class="right">' + wifis_info.ssid_58g + '</span></li>';
            } else {
                wifihtml += '<li class="list clearfix"><label class="left">2.4G SSID</label><span class="right">' + wifis_info.ssid_24g + '</span></li>';
            }
        } else {
            if (wifis_info.ssid_58g != undefined && wifis_info.ssid_58g != '') {
                wifihtml += '<li class="list clearfix"><label class="left">SSID</label><span class="right">' + wifis_info.ssid_58g + '</span></li>';
            } else {
                wifihtml += '<li class="list clearfix"><label class="left">SSID</label><span class="right">' + wifis_info.ssid_24g + '</span></li>';
            }
        }

        d('#wifishow').html(wifihtml);
    }

    function getCpuAndFlow() {
        f.getsystemusage(function (data) {
            if (data.errCode == 0) {
                cpuflow_info = data;
                refresh_cpu_flow();
                setTimeout(getCpuAndFlow, 1000);
            }
        });
    }

    function refresh_cpu_flow() {
        var res_rx = data;
        var res_tx = data_tx;
        var rtx_data = [];
        var rx_val, tx_val;
        rtx_data[0] = cpuflow_info.linedata.rx_history; //rx data
        rtx_data[1] = cpuflow_info.linedata.tx_history; //tx data
        get_flow(parseInt(rtx_data[0]), "download_unit", "download");
        get_flow(parseInt(rtx_data[1]), "upload_unit", "upload");

        $("#cpuusage").data('easyPieChart').update(Math.ceil(parseInt(cpuflow_info.cpu_usage.cpu_used)));
        $('span', '#cpuusage').text(Math.ceil(parseInt(cpuflow_info.cpu_usage.cpu_used)));

        $("#menusage").data('easyPieChart').update(Math.ceil(parseInt(cpuflow_info.memory.usage)));
        $('span', '#menusage').text(Math.ceil(parseInt(cpuflow_info.memory.usage)));

        while (flow_data_store.length > 1) {
            flow_data_store = flow_data_store.slice(1);
        }
        flow_data_store.push(rtx_data);
        if (flow_data_store.length == 2) {
            rx_val = (flow_data_store[1][0] - flow_data_store[0][0]);
            tx_val = (flow_data_store[1][1] - flow_data_store[0][1]);
            if (rx_val < 0) rx_val = 0;
            if (tx_val < 0) tx_val = 0;
            res_rx.push(parseFloat(rx_val / 1000));
            down_data = parseFloat(rx_val / 1000);
            while ((res_rx.length - maximum) >= 1) {
                res_rx = res_rx.slice(1);
            }
            data = res_rx;
            up_data = parseFloat(tx_val / 1000);
            res_tx.push(parseFloat(tx_val / 1000));
            while ((res_tx.length - maximum) >= 1) {
                res_tx = res_tx.slice(1);
            }
            data_tx = res_tx;
            data_change = 1;
        }
    }

    function get_flow(data, unit_id, data_id) {
        var data_t = 0;
        var unit = "#" + unit_id;
        var data_ = "#" + data_id;
        if (data > 1073741824) {
            d(unit).text("GB");
            data_t = data / 1073741824;
            d(data_).text(data_t.toFixed(2));
        } else if (data > 1048576) {
            d(unit).text("MB");
            data_t = data / 1048576;
            d(data_).text(data_t.toFixed(2));
        } else if (data > 1024) {
            d(unit).text("KB");
            data_t = data / 1024;
            d(data_).text(data_t.toFixed(2));
        } else {
            d(unit).text("B");
            d(data_).text(data);
        }
    }

    function setevent() {
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });

        var mchart = Highcharts.chart('flowchart', {
            chart: {
                type: 'spline',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
                events: {
                    load: function () {
                        // set up the updating of the chart each second
                        var series1 = this.series[0], series2 = this.series[1];
                        setInterval(function () {
                            var x = (new Date()).getTime(); // current time
                            series1.addPoint([x, up_data], false, true);
                            series2.addPoint([x, down_data], false, true);
                            activeLastPointToolip()
                        }, 1000);
                    }
                }
            },
            title: {
                text: ''
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 150
            },
            yAxis: {
                title: {
                    text: ''
                },
                labels: {
                    formatter: function () {
                        //return this.value+"KB/s";
                        return this.value;
                    }
                }
            },
            tooltip: {
                formatter: function () {
                    if (this.points) {
                        if (this.x < 1000) {
                            var error = '<b id="datatip">' + SHpack.no_date[nowLang] + '</b>';
                            return error;
                        }
                        var s = '<b>' + Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '</b>';
                        var nowx = this.points[0].point.index;
                        var upname = this.points[0].series.chart.series[0].name;
                        var upy = this.points[0].series.chart.series[0].points[nowx].y.toFixed(2);
                        var downname = this.points[0].series.chart.series[1].name;
                        var downy = this.points[0].series.chart.series[1].points[nowx].y.toFixed(2);
                        s += '<br/><span style="color:' + color_array[2] + '" sh_lang ="upname">' + upname + '</span>: ' + upy + 'KB/s';
                        s += '<br/><span style="color:' + color_array[3] + '" sh_lang ="downname">' + downname + '</span>: ' + downy + 'KB/s';
                        return s;
                    }
                },
                shared: true,
                crosshairs: true
            },
            legend: {
                enabled: false,
            },
            exporting: {
                enabled: false
            },
            rangeSelector: {
                enabled: false
            },
            scrollbar: {
                enabled: false
            },
            navigator: {
                enabled: false
            },
            series: [{
                name: SHpack.uplink[nowLang],
                data: (function () {
                    // generate an array of random data
                    var data = [],
                        time = (new Date()).getTime(),
                        i;
                    for (i = -200; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: 0
                        });
                    }
                    return data;
                }()),
                color: color_array[2]
            }, {
                name: SHpack.downlink[nowLang],
                data: (function () {
                    // generate an array of random data
                    var data = [],
                        time = (new Date()).getTime(),
                        i;
                    for (i = -200; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: 0
                        });
                    }
                    return data;
                }()),
                color: color_array[3]
            }],
            credits: {
                enabled: false // 禁用版权信息
            }
        });

        function activeLastPointToolip() {
            mchart.redraw();
        }
    };

})
