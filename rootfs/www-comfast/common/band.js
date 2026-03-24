define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, data_info;
    let ltelband = [
        { name: 1,  value: '101' },
        { name: 3,  value: '103' },
        { name: 5,  value: '105' },
        { name: 7,  value: '107' },
        { name: 8,  value: '108' },
        { name: 20, value: '120' },
        { name: 38, value: '138' },
        { name: 40, value: '140' },
        { name: 41, value: '141' }
    ]

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
        });
    }

    function refresh_init() {
        var martop;
        martop = (d(window).height() - d('.set_seat').height() - 120) / 2;
        d('.set_seat').css({'top': martop + 'px'});

        f.getMConfig('lte_band_get', '', function (data) {
            if (data.errCode == 0) {
                data_info = data.lteband[0]
                band_init();
            }
        });
        band_init();
    }

    function band_init() {
        let str = ''
        // 4G
            let selectedl = data_info.band.split(',')
            ltelband.forEach(element => {
                const name = 'BAND' + element.name
                const id = 'bandl' + element.name
                str +=    '<div class="list col-xs-6">'
                if(selectedl.indexOf(element.value) > -1) {
                    str +=        `<div class="row"><span>${name}</span><input class="option-input" id="${id}" type="checkbox" checked="true"></div>`
                } else {
                    str +=        `<div class="row"><span>${name}</span><input class="option-input" id="${id}" type="checkbox"></div>`
                }
                str +=    '</div>'
            });
        d("#band-content").append(str);
    }

    et.save_config = function () {
        let obj = {
            band: { num: '' }
        }
        let strl = ''
        ltelband.forEach(element => {
            const id = 'bandl' + element.name
            if (d("#" + id).is(':checked')) {
                strl += element.value + ','
            }
        });
        if(strl == '') return
        obj.band.num = strl.slice(0, -1)
        set(obj );
    }

    function set(arg) {
        f.setMConfig('4g_band', arg, function (data) {
            if (data.errCode != 0) {
                if(data.errCode == -32017) {
                    g.shconfirm(nowLang, SHtips.band_err[nowLang], "error");
                    
                } else {
                    g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
                }
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
				g.animationWidth(30, gohref);
            }
        })
    }

    function gohref() {
		location.href = location.href;
	}

});
