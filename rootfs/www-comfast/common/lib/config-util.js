define(function (require, exports) {

    function E(callback) {
        return function (b) {
            if (b.errCode == -32002) {
                location.href = '/login.html';
                return;
            }
            callback(b);
        };
    }

    function _post(url, data, callback) {
        fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data || {}),
        })
        .then(function (r) { return r.json(); })
        .then(E(callback))
        .catch(function () {});
    }

    function _get(url, callback) {
        fetch(url, {cache: 'no-store'})
        .then(function (r) { return r.json(); })
        .then(E(callback))
        .catch(function () {});
    }

    exports.getSConfig = function (section, data, callback) {
        _post("/cgi-bin/system-status?method=GET&section=" + section, data, callback);
    };

    exports.setSConfig = function (section, data, callback) {
        _post("/cgi-bin/system-status?method=SET&section=" + section, data, callback);
    };

    exports.getMConfig = function (section, data, callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=" + section, data, callback);
    };

    exports.setMConfig = function (section, data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=" + section, data, callback);
    };

    exports.setlanguage = function (data, callback) {
        _post("/cgi-bin/system-status?method=SET&section=language", data, callback);
    };

    exports.modifypassword = function (data, callback) {
        fetch("/cgi-bin/system-status?method=SET&section=admin_config", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data || {}),
        })
        .then(function (r) { return r.json(); })
        .then(callback)
        .catch(function () {});
    };

    exports.login = function (data, callback) {
        fetch("/cgi-bin/login", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data || {}),
        })
        .then(function (r) { return r.json(); })
        .then(callback)
        .catch(function () {});
    };

    exports.loginout = function (callback) {
        _post("/cgi-bin/logout", {}, callback);
    };

    exports.getsystemusage = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=system_usage", {}, callback);
    };

    exports.getguide = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=guide_config", {}, callback);
    };

    exports.setguide = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=guide_config", data, callback);
    };

    exports.scanwifi = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=wifi_scan", data, callback);
    };

    exports.getWanConfig = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=wan_config", {}, callback);
    };

    exports.setWanConfig = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=wan_config", data, callback);
    };

    exports.setDnsConfig = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=dns_config", data, callback);
    };

    exports.setLanConfig = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=lan_config", data, callback);
    };

    exports.setWifiConfig = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=wifi_config", data, callback);
    };

    exports.getwwanstatus = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=wwan_status", {}, callback);
    };

    exports.getwifiinfo = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=wifi_info", data, callback);
    };

    exports.getCpuUsageAndFlow = function (callback) {
        _post("/cgi-bin/system-status?method=GET&section=cpu_usage_and_flow", {}, callback);
    };

    exports.getIpFilter = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=ipft_config", {}, callback);
    };

    exports.setIpFilter = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=ipft_config", data, callback);
    };

    exports.getMacFilter = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=macft_config", {}, callback);
    };

    exports.setMacFilter = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=macft_config", data, callback);
    };

    exports.getUrlFilter = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=urlft_config", {}, callback);
    };

    exports.setUrlFilter = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=urlft_config", data, callback);
    };

    exports.getPortforward = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=portfw_config", {}, callback);
    };

    exports.setPortforward = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=portfw_config", data, callback);
    };

    exports.getArpBind = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=arp_bind_list", {}, callback);
    };

    exports.setArpBind = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=arp_bind_list", data, callback);
    };

    exports.getArpList = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=arp_list", {}, callback);
    };

    exports.getDmzInfo = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=dmz_config", {}, callback);
    };

    exports.setDmzInfo = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=dmz_config", data, callback);
    };

    exports.getDdosInfo = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=ddos_config", {}, callback);
    };

    exports.setDdosInfo = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=ddos_config", data, callback);
    };

    exports.getFirmwareInfo = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=firmware_version_get", {}, callback);
    };

    exports.getRemote = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=remote", {}, callback);
    };

    exports.setRemote = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=remote", data, callback);
    };

    exports.getLogs = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=systemlog_get", {}, callback);
    };

    exports.setReset = function (callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=system_reset", {}, callback);
    };

    exports.setSystemConfig = function () {
        var iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:absolute;top:-9999px';
        iframe.name = 'backdown_iframe';
        var form = document.createElement('form');
        form.style.display = 'none';
        form.method = 'post';
        form.action = '/cgi-bin/mbox-config?method=GET&section=system_config_backup';
        var input = document.createElement('input');
        input.type = 'hidden';
        input.setAttribute('data', '{}');
        form.appendChild(input);
        iframe.appendChild(form);
        document.body.appendChild(iframe);
        form.submit();
    };

    exports.setModifyPsd = function (data, callback) {
        _post("/cgi-bin/system-status?method=SET&section=admin_config", data, callback);
    };

    exports.setReboot = function (callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=system_reboot", {}, callback);
    };

    exports.getWifiFilter = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=wireless_user_list_set", {}, callback);
    };

    exports.setWifiFilter = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=wireless_user_list_set", data, callback);
    };

    exports.getWifiAssoc = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=wireless_assoc_client_info", {}, callback);
    };

    exports.getSystemLog = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=systemlog_get", {}, callback);
    };

    exports.getNetworkLink = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=network_link", {}, callback);
    };

    exports.getPortStatus = function (callback) {
        _post("/cgi-bin/system-status?method=GET&section=port_status", {}, callback);
    };

    exports.getMemUsage = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=mem_usage", {}, callback);
    };

    exports.getDhcpList = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=dhcp_list", {}, callback);
    };

    exports.getLanDhcp = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=lan_dhcp_config", {}, callback);
    };

    exports.setLanDhcp = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=lan_dhcp_config", data, callback);
    };

    exports.getprobeserver = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=probe_server", {}, callback);
    };

    exports.setprobeserver = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=probe_server", data, callback);
    };

    exports.getledstatus = function (callback) {
        _post("/cgi-bin/system-status?method=GET&section=led_status", {}, callback);
    };

    exports.setledstatus = function (data, callback) {
        _post("/cgi-bin/system-status?method=SET&section=led_status", data, callback);
    };

    exports.get_hb_status = function (callback) {
        _post("/cgi-bin/system-status?method=GET&section=heart_beat", {}, callback);
    };

    exports.getPPTPclient = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=pptp_client_config", {}, callback);
    };

    exports.setPPTPclient = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=pptp_client_config", data, callback);
    };

    exports.getLTPclient = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=l2tp_client_config", {}, callback);
    };

    exports.setLTPclient = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=l2tp_client_config", data, callback);
    };

    exports.getPPTPservice = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=pptpd_config", {}, callback);
    };

    exports.setPPTPservice = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=pptpd_config", data, callback);
    };

    exports.getPPTPuser = function (callback) {
        _post("/cgi-bin/mbox-config?method=GET&section=pptpd_user", {}, callback);
    };

    exports.setPPTPuser = function (data, callback) {
        _post("/cgi-bin/mbox-config?method=SET&section=pptpd_user", data, callback);
    };

    exports.uciGet = function (path, callback) {
        _get("/api/uci?get=" + encodeURIComponent(path), callback);
    };

    exports.uciSet = function (key, value, callback) {
        _post("/api/uci/set", {key: key, value: value}, callback);
    };
});
