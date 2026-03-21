define(function (require, exports) {
    var d = require("jquery");

    function E(callback) {
        return function (b) {
            if (b.errCode == -32002) {
                location.href = '/login.html';
                return
            }
            callback(b)
        }
    }

    function F(data) {
        if (String(data) == '' || String(data) == 'undefined' || String(data) == 'true') {
            return true;
        } else {
            return false;
        }
    }

    exports.getSConfig = function (section, data, callback, async) {
        var url = "/cgi-bin/system-status?method=GET&section=" + section;
        _ajax(url, data, callback, async);
    };

    exports.setSConfig = function (section, data, callback, async) {
        var url = "/cgi-bin/system-status?method=SET&section=" + section;
        _ajax(url, data, callback, async);
    };

    exports.getMConfig = function (section, data, callback, async) {
        var url = "/cgi-bin/mbox-config?method=GET&section=" + section;
        _ajax(url, data, callback, async);
    };

    exports.setMConfig = function (section, data, callback, async) {
        var url = "/cgi-bin/mbox-config?method=SET&section=" + section;
        _ajax(url, data, callback, async);
    };

    function _ajax(url, data, callback, async) {
        d.ajax({
            url: url,
            data: data ? JSON.stringify(data) : "{}",
            success: E(callback),
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                //console.dir(XMLHttpRequest.readyState);
                //window.location.href = location.href;
            },
            contentType: "appliation/json",
            dataType: "json",
            type: "POST",
            async: F(async),
            cache: false,
        })
    }

    exports.setlanguage = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            cache: false,
            url: "/cgi-bin/system-status?method=SET&section=language"
        })
    };

    exports.modifypassword = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: a,
            type: "POST",
            async: F(async),
            cache: false,
            url: "/cgi-bin/system-status?method=SET&section=admin_config"
        })
    };

    exports.login = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: a,
            type: "POST",
            async: F(async),
            url: "/cgi-bin/login"
        })
    };

    exports.loginout = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: a,
            type: "POST",
            async: F(async),
            url: "/cgi-bin/logout"
        })
    };

    exports.getsystemusage = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=system_usage"
        })
    };

    exports.getguide = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=guide_config"
        })
    };

    exports.setguide = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=guide_config"
        })
    };

    exports.scanwifi = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: a,
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=wifi_scan"
        })
    };

    exports.getWanConfig = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=wan_config"
        })
    };

    exports.setWanConfig = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=wan_config"
        })
    };

    exports.setDnsConfig = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=dns_config"
        })
    };

    exports.setLanConfig = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=lan_config"
        })
    };

    exports.setWifiConfig = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=wifi_config"
        })
    };

    exports.getwwanstatus = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=wwan_status"
        })
    };

    exports.getwifiinfo = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=wifi_info"
        })
    };

    exports.getCpuUsageAndFlow = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/system-status?method=GET&section=cpu_usage_and_flow"
        })
    };

    exports.getIpFilter = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=ipft_config"
        })
    };

    exports.setIpFilter = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=ipft_config"
        })
    };

    exports.getMacFilter = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=macft_config"
        })
    };

    exports.setMacFilter = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=macft_config"
        })
    };

    exports.getUrlFilter = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=urlft_config"
        })
    };

    exports.setUrlFilter = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=urlft_config"
        })
    };

    exports.getPortforward = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=portfw_config"
        })
    };

    exports.setPortforward = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=portfw_config"
        })
    };

    exports.getArpBind = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=arp_bind_list"
        })
    };

    exports.setArpBind = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=arp_bind_list"
        })
    };

    exports.getArpList = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=arp_list"
        })
    };

    exports.getDmzInfo = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=dmz_config"
        })
    };

    exports.setDmzInfo = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=dmz_config"
        })
    };

    exports.getDdosInfo = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=ddos_config"
        })
    };

    exports.setDdosInfo = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=ddos_config"
        })
    };

    exports.getFirmwareInfo = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=firmware_version_get"
        })
    };

    exports.getRemote = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=remote"
        })
    };

    exports.setRemote = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=remote"
        })
    };

    exports.getLogs = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=systemlog_get"
        })
    };

    exports.setReset = function (a) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: false,
            url: "/cgi-bin/mbox-config?method=SET&section=system_reset"
        })
    };

    exports.setSystemConfig = function () {
        var iframe = d('<iframe style="position:absolute;top:-9999px" ></iframe>').attr('name', 'backdown_iframe');
        var form = d('<form enctype="multipart/form-data">');
        form.attr("style", "display:none");
        form.attr("target", "");
        form.attr("method", "post");
        form.attr("action", "/cgi-bin/mbox-config?method=GET&section=system_config_backup");
        var input1 = d("<input>");
        input1.attr("type", "hidden");
        input1.attr("data", "{}");
        d("body").append(iframe);
        iframe.append(form);
        form.append(input1);
        form.submit();
    };

    exports.setModifyPsd = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/system-status?method=SET&section=admin_config"
        })
    };

    exports.setReboot = function (a) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: false,
            url: "/cgi-bin/mbox-config?method=SET&section=system_reboot"
        })
    };

    exports.getWifiFilter = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=wireless_user_list_set"
        })
    };

    exports.setWifiFilter = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=wireless_user_list_set"
        })
    };

    exports.getWifiAssoc = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=wireless_assoc_client_info"
        })
    };

    exports.getSystemLog = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=systemlog_get"
        })
    };

    exports.getNetworkLink = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=network_link"
        })
    };

    exports.getPortStatus = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/system-status?method=GET&section=port_status"
        })
    };

    exports.getMemUsage = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=mem_usage"
        })
    };

    exports.getDhcpList = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=dhcp_list"
        })
    };

    exports.getLanDhcp = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=lan_dhcp_config"
        })
    };

    exports.setLanDhcp = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=lan_dhcp_config"
        })
    };

    exports.getprobeserver = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=probe_server"
        })
    };

    exports.setprobeserver = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=probe_server"
        })
    };

    exports.getledstatus = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/system-status?method=GET&section=led_status"
        })
    };

    exports.setledstatus = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/system-status?method=SET&section=led_status"
        })
    };
    
    exports.get_hb_status = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/system-status?method=GET&section=heart_beat"
        })
    };

    exports.getPPTPclient = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=pptp_client_config"
        })
    };

    exports.setPPTPclient = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=pptp_client_config"
        })
    };

    exports.getLTPclient = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=l2tp_client_config"
        })
    };

    exports.setLTPclient = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=l2tp_client_config"
        })
    };
    
    exports.getPPTPservice = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=pptpd_config"
        })
    };

    exports.setPPTPservice = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=pptpd_config"
        })
    };

    exports.getPPTPuser = function (a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: "{}",
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=GET&section=pptpd_user"
        })
    };

    exports.setPPTPuser = function (data, a, async) {
        d.ajax({
            contentType: "appliation/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: E(a),
            type: "POST",
            async: F(async),
            url: "/cgi-bin/mbox-config?method=SET&section=pptpd_user"
        })
    };
});
