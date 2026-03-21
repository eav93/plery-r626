define(function (require, exports) {

    exports.isEnglish = function (mask) {
        var regExp = new RegExp(/[^\x00-\xff]/);
        return regExp.test(mask);
    };

    exports.isBaseFun = function (str) {
	    const regExp = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
	    return regExp.test(str);
    };
    
    exports.isGwIp = function (str) {
	    const regExp = /^[0-9./ ]*$/
	    return regExp.test(str);
    };

    exports.psk_special = function (str) {
        var pattern;
        pattern = /[\·\'\"\(\)\<\>\\\/\-]/im;
        if (pattern.test(str)) {
            return false;
        }
        return true;
    };

    exports.special = function (str) {
        var pattern;
        pattern = /[\·\'\"\(\)\<\>\&\\\/\-]/im;
        if (pattern.test(str)) {
            return false;
        }
        return true;
    };

    exports.checkChar = function (Message, MaxValue) {
        var ByteCount = 0;
        var StrLength = Message.length;
        for (var i = 0; i < StrLength; i++) {
            ByteCount = (Message.charCodeAt(i) < 128) ? ByteCount + 1 : ByteCount + 3;
        }
        return ByteCount;
    };

    exports.isDomain = function (domain) {
        if (domain.length >= 68)
            return false;
        var regExp = new RegExp(/^[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?$/);
        if (regExp.test(domain)) {
            return true;
        }
        return false;
    };

    exports.isDomainName = function (domain) {
        if (domain.length >= 33)
            return false;
        var regExp = new RegExp(/^[0-9a-zA-Z]*$/);
        if (regExp.test(domain)) {
            return true;
        }
        return false;
    };

    exports.isIp = function (ip) {
        var regExp = new RegExp(/^(?:(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)|([1-9])))$/);
        if (regExp.test(ip)) {
            return true;
        } else {
            return false;
        }
    };

    exports.isIpaddr = function (ip) {
        var regExp = new RegExp(/^(?:(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)|([1-9])))$/);
        var ip_array;
        if (regExp.test(ip)) {
            ip_array = ip.split('.');
        }
        if (!regExp.test(ip) || IpToNumber(ip) < 16777216 || IpToNumber(ip) == 4294967295 || ip_array[3] == 0) {
            return false;
        } else {
            return true;
        }
    };

    exports.isTime = function (str) {
        var regExp = new RegExp("^(([1-9]{1})|([0-1][0-9])|([1-2][0-3])):([0-5][0-9])$");
        if (regExp.test(str)) {
            return true;
        }
        return false;
    };

    exports.isNetmask = function (mask) {
        var correct_range = {128: 1, 192: 1, 224: 1, 240: 1, 248: 1, 252: 1, 254: 1, 255: 1, 0: 1};
        var m = mask.split('.');
        if (m.length != 4)
            return false;

        for (var i = 0; i < 4; i++) {
            if (!(m[i] in correct_range) ||
                (i < 3 && m[i] > 0 && m[i] < 255 && m[i + 1] != 0)) {
                return false;
            }
        }
        return true;
    };

    exports.isNum = function (str) {
        var num = str.match(/^(0|[1-9]\d*)$/g);
        if (num == '' || num == null) {
            return false;
        }
        else {
            return true;
        }
    };

    exports.isMac = function (str) {
        var reg1 = new RegExp(/^[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}$/);
        return reg1.test(str);
    };

    exports.isUrl = function (str) {
        var reg = /[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/;
        return (reg.test(str));
    };

    exports.isRangNum = function (num, min, max) {//
        if (exports.isNum(num)) {
            if (num >= min && num <= max) return true;
        }
        return false;
    };

    function IpToNumber(ip) {
        var num = 0;
        if (ip == "") {
            return num;
        }
        var aNum = ip.split(".");
        if (aNum.length != 4) {
            return num;
        }
        num += parseInt(aNum[0]) << 24;
        num += parseInt(aNum[1]) << 16;
        num += parseInt(aNum[2]) << 8;
        num += parseInt(aNum[3]) << 0;
        num = num >>> 0;
        return num;
    }

});