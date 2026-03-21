define(function (require, exports) {
    var d = require("jquery");
    var array_channel = {};
    array_channel.channel_24g = [
        {type: '2', name: 'auto', value: 'auto'},
        {type: '1', name: '1-2412MHz', value: '1'},
        {type: '1', name: '2-2417MHz', value: '2'},
        {type: '1', name: '3-2422MHz', value: '3'},
        {type: '1', name: '4-2427MHz', value: '4'},
        {type: '1', name: '5-2432MHz', value: '5'},
        {type: '1', name: '6-2437MHz', value: '6'},
        {type: '1', name: '7-2442MHz', value: '7'},
        {type: '1', name: '8-2447MHz', value: '8'},
        {type: '1', name: '9-2452MHz', value: '9'},
        {type: '1', name: '10-2457MHz', value: '10'},
        {type: '1', name: '11-2462MHz', value: '11'},
        {type: '1', name: '12-2467MHz', value: '12'},
        {type: '1', name: '13-2472MHz', value: '13'}
    ];
    array_channel.channel_58g = [
        {type: '2', name: 'auto', value: 'auto'},
        {type: '1', name: '36-5180MHz', value: '36'},
        {type: '1', name: '40-5200MHz', value: '40'},
        {type: '1', name: '44-5220MHz', value: '44'},
        {type: '1', name: '48-5240MHz', value: '48'},
        {type: '1', name: '52-5260MHz', value: '52'},
        {type: '1', name: '56-5280MHz', value: '56'},
        {type: '1', name: '60-5300MHz', value: '60'},
        {type: '1', name: '64-5320MHz', value: '64'},
        {type: '1', name: '100-5500MHz', value: '100'},
        {type: '1', name: '104-5520MHz', value: '104'},
        {type: '1', name: '108-5540MHz', value: '108'},
        {type: '1', name: '112-5560MHz', value: '112'},
        {type: '1', name: '116-5580MHz', value: '116'},
        {type: '1', name: '120-5600MHz', value: '120'},
        {type: '1', name: '124-5620MHz', value: '124'},
        {type: '1', name: '128-5640MHz', value: '128'},
        {type: '1', name: '132-5660MHz', value: '132'},
        {type: '1', name: '136-5680MHz', value: '136'},
        {type: '1', name: '140-5700MHz', value: '140'},
        {type: '1', name: '149-5745MHz', value: '149'},
        {type: '1', name: '153-5765MHz', value: '153'},
        {type: '1', name: '157-5785MHz', value: '157'},
        {type: '1', name: '161-5805MHz', value: '161'},
        {type: '1', name: '165-5825MHz', value: '165'}
    ];
    array_channel.channel_58g_gb = [
        { type: '1', name: 'auto', value: 'auto' },
        { type: '1', name: '36', value: '36' },
        { type: '1', name: '40', value: '40' },
        { type: '1', name: '44', value: '44' },
        { type: '1', name: '48', value: '48' },
        { type: '1', name: '52', value: '52' },
        { type: '1', name: '56', value: '56' },
        { type: '1', name: '60', value: '60' },
        { type: '1', name: '64', value: '64' },
        { type: '1', name: '100', value: '100' },
        { type: '1', name: '104', value: '104' },
        { type: '1', name: '108', value: '108' },
        { type: '1', name: '112', value: '112' },
        { type: '1', name: '116', value: '116' },
        { type: '1', name: '120', value: '120' },
        { type: '1', name: '124', value: '124' },
        { type: '1', name: '128', value: '128' },
        { type: '1', name: '132', value: '132' },
        { type: '1', name: '136', value: '136' },
        { type: '1', name: '140', value: '140' },
        { type: '1', name: '144', value: '144' },
        { type: '1', name: '149', value: '149' },
        { type: '1', name: '153', value: '153' },
        { type: '1', name: '157', value: '157' },
        { type: '1', name: '161', value: '161' },
        { type: '1', name: '165', value: '165' }
    ];
    array_channel.channel_58g_11a = [
        {type: '2', name: 'auto', value: 'auto'},
        {type: '1', name: '36-5180MHz', value: '36'},
        {type: '1', name: '40-5200MHz', value: '40'},
        {type: '1', name: '44-5220MHz', value: '44'},
        {type: '1', name: '48-5240MHz', value: '48'},
        {type: '1', name: '52-5260MHz', value: '52'},
        {type: '1', name: '56-5280MHz', value: '56'},
        {type: '1', name: '60-5300MHz', value: '60'},
        {type: '1', name: '64-5320MHz', value: '64'},
        {type: '1', name: '149-5745MHz', value: '149'},
        {type: '1', name: '153-5765MHz', value: '153'},
        {type: '1', name: '157-5785MHz', value: '157'},
        {type: '1', name: '161-5805MHz', value: '161'},
        {type: '1', name: '165-5825MHz', value: '165'}
    ];

    var Global_HT20 = "HT20";
    var Global_HT40 = "HT40";
    var Global_HT80 = "VHT80";
    var htmode_24g = [Global_HT20, Global_HT40];
    var htmode_58g = [Global_HT20, Global_HT40, Global_HT80];

    exports.append_channel = function (id, country, channel, freq, htmode, noht80, type) {
        var content_HTML = "";
        if (freq == "58g") {
            if (noht80 == 1) {
                if (country == "CN") {
                    d.each(array_channel.channel_58g_11a, function (n, m) {
                        if (type == 1 && n == 0) {
                            return true;
                        }
                        content_HTML += channel_option(m, channel);
                    });
                } else if (country == "US") {
                    d.each(array_channel.channel_58g_11a, function (n, m) {
                        if (type == 1 && n == 0) {
                            return true;
                        }
                        content_HTML += channel_option(m, channel);
                    });
                } else if (country == "GB" || country == "UK") {
                    d.each(array_channel.channel_58g_11a, function (n, m) {
                        if (type == 1 && n == 0) {
                            return true;
                        }
                        if (n < 5) {
                            content_HTML += channel_option(m, channel);
                        }
                    });
                }
            } else {
                if (country == "CN") {
                    d.each(array_channel.channel_58g_11a, function (n, m) {
                        if (type == 1 && n == 0) {
                            return true;
                        }
                        content_HTML += channel_option(m, channel);
                    });
                } else if (country == "US") {
                    d.each(array_channel.channel_58g, function (n, m) {
                        if (type == 1 && n == 0) {
                            return true;
                        }
                        if (htmode == Global_HT80) {
                            if(m.value == 132 || m.value == 136) return true
                            if(m.value <= 161 || m.value == 'auto') content_HTML += channel_option(m, channel);
                        } else {
                            content_HTML += channel_option(m, channel);
                        }
                    });
                } else if (country == "GB" || country == "UK") {
                    d.each(array_channel.channel_58g_gb, function (n, m) {
                        if (type == 1 && n == 0) {
                            return true;
                        }
                        content_HTML += channel_option(m, channel);
                    });
                }
            }
        } else if (freq == "24g") {
            if (country == "CN" || country == "GB" || country == "UK") {
                d.each(array_channel.channel_24g, function (n, m) {
                    if (type == 1 && n == 0) {
                        return true;
                    }
                    content_HTML += channel_option(m, channel);
                });
            } else if (country == "US") {
                d.each(array_channel.channel_24g, function (n, m) {
                    if (type == 1 && n == 0) {
                        return true;
                    }
                    if (n < 12) {
                        content_HTML += channel_option(m, channel);
                    }
                });
            }
        }

        d(id).html(content_HTML);
        if (freq == '58g' && htmode != Global_HT20) {
            if(country != "GB" && country != "UK") d('#channel140').remove();
            d('#channel165').remove();
        }
    };

    function channel_option(obj, channel) {
        if (obj.value == channel) {
            return '<option value="' + obj.value + '" id = "channel' + obj.value + '" selected>' + obj.name + "</option>";
        } else {
            return '<option value="' + obj.value + '" id = "channel' + obj.value + '">' + obj.name + "</option>";
        }
    }

    exports.append_htmode = function (id, mode, freq, noht80) {
        var content_HTML = "";
        var index;
        if (freq == "24g") {
            for (index = 0; index < htmode_24g.length; index++) {
                if (mode != htmode_24g[index]) {
                    content_HTML += '<option value="' + htmode_24g[index] + '">' + htmode_24g[index].split("HT")[1] + 'MHz</option>';
                } else {
                    content_HTML += '<option value="' + htmode_24g[index] + '" selected>' + htmode_24g[index].split("HT")[1] + 'MHz</option>';
                }
            }
        } else if (freq == "58g") {
            if (noht80 && jQuery.inArray(Global_HT80, htmode_58g) > -1) {
                htmode_58g.splice(jQuery.inArray(Global_HT80, htmode_58g), 1);
            }
            for (index = 0; index < htmode_58g.length; index++) {
                if (mode != htmode_58g[index]) {
                    content_HTML += '<option value="' + htmode_58g[index] + '">' + htmode_58g[index].split("HT")[1] + 'MHz</option>';
                } else {
                    content_HTML += '<option value="' + htmode_58g[index] + '" selected>' + htmode_58g[index].split("HT")[1] + 'MHz</option>';
                }
            }
        }
        d(id).html(content_HTML);
    };
});
