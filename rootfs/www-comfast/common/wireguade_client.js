define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, wireguade_info, flag = false

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
        g.volide('.shbox', nowLang, device);
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
        martop = (d(window).height() - d('.set_seat').height() - 100) / 2;
        if(martop >= 0) d('.set_seat').css({'top': martop + 'px'});
        

        f.getMConfig('wireguade_config_get', '', function (data) {
            if (data && !data.errCode) {
                wireguade_info = { wireguard_local: data.wireguard_local, wireguard_peer: data.wireguard_peer }
                refresh_wireguade();
            }
        });
    }

    function refresh_wireguade() {
        d("#wireguade_switch").val(wireguade_info.wireguard_local[0].enable);
        d("#wireguade_public_1").val(wireguade_info.wireguard_local[0].public_key)
        d("#wireguade_Private").val(wireguade_info.wireguard_local[0].private_key);
        d("#wireguade_port").val(wireguade_info.wireguard_local[0].listen_port);


        g.setvalue("#wireguade_ip", wireguade_info.wireguard_local[0].addresses)


        d("#wireguade_describe").val(wireguade_info.wireguard_peer[0].description);
        d("#wireguade_public").val(wireguade_info.wireguard_peer[0].public_key);
        d("#wireguade_Private_2").val(wireguade_info.wireguard_peer[0].private_key)
        d("#wireguade_shared").val(wireguade_info.wireguard_peer[0].preshared_key);


        g.setvalue("#wireguade_allowip", wireguade_info.wireguard_peer[0].allowed_ips)


        d("#wireguade_selectip").val(wireguade_info.wireguard_peer[0].route_allowed_ips || '0');
        d("#wireguade_host").val(wireguade_info.wireguard_peer[0].endpoint_host);
        d("#wireguade_port_d").val(wireguade_info.wireguard_peer[0].endpoint_port);
        d("#wireguade_keepalive").val(wireguade_info.wireguard_peer[0].persistent_keepalive);

        // d("#wireguade_describe2").val(wireguade_info.wireguard_peer[1].description);
        // d("#wireguade_public2").val(wireguade_info.wireguard_peer[1].public_key);
        // d("#wireguade_shared2").val(wireguade_info.wireguard_peer[1].preshared_key);


        // g.setvalue("#wireguade_allowip2", wireguade_info.wireguard_peer[1].allowed_ips)


        // d("#wireguade_selectip2").val(wireguade_info.wireguard_peer[1].route_allowed_ips || '0');
        // d("#wireguade_host2").val(wireguade_info.wireguard_peer[1].endpoint_host);
        // d("#wireguade_port_d2").val(wireguade_info.wireguard_peer[1].endpoint_port);
        // d("#wireguade_keepalive2").val(wireguade_info.wireguard_peer[1].persistent_keepalive);
        

        et.enableConfig()
    }

    et.enableConfig = function () {
        if (d("#wireguade_switch").val() == 0) {
            d(".find_dis").find('input').prop('disabled', true).removeClass('borError')
            d(".find_dis").find('select').prop('disabled', true)
            d('.onError').remove();
            d("#wireguade_switch").removeAttr("disabled");
        } else {
            d(".find_dis").find('input').removeAttr("disabled")
            d(".find_dis").find('select').removeAttr("disabled");

        }
    }
    et.get_key = function () {
        f.getMConfig('wireguade_server_key_generation', '', function (data) {
            if (data && !data.errCode) {
                d("#wireguade_public_1").val(data.wireguade_ser_key['server-publickey'])
                d("#wireguade_Private").val(data.wireguade_ser_key['server-privatekey'])
            }
        });
    }
    et.get_key_2 = function () {
        f.getMConfig('wireguade_peer_key_generation', '', function (data) {
            if (data && !data.errCode) {
                d("#wireguade_public").val(data.wireguade_peer_key['client-publickey'])
                d("#wireguade_Private_2").val(data.wireguade_peer_key['client-privatekey'])
                d("#wireguade_shared").val(data.wireguade_peer_key['share-key'])
            }
        });
    }

    et.check_key = function (evt) {
        if (d(evt).hasClass('show_ssid')) {
            d(evt).attr('data-value', '1').removeClass('show_ssid').addClass('hidden_ssid');
            d(evt).siblings("input").attr("type", "password")
        } else {
            d(evt).attr('data-value', '0').removeClass('hidden_ssid').addClass('show_ssid');
            d(evt).siblings("input").attr("type", "text")
        }
    };
    
    // et.go_set = function () {
    //     if (!g.volide_ok('.div_left')) {
    //         g.shconfirm(nowLang, SHtips.set_tip[nowLang], "error");
    //         return;
    //     }
    //     if(!flag) {
    //         d('.div_left').css({
    //             transform: 'perspective(1000px) rotateY(-180deg)'
    //         });
    //         d('.div_right').css({
    //             transform: 'perspective(1000px) rotateY(0deg)'
    //         });
    //         d("#go_set").text(SHpack.wireguade_goBack[nowLang])
    //     } else {
    //         d('.div_left').css({
    //             transform: 'perspective(1000px) rotateY(0deg)'
    //         });
    //         d('.div_right').css({
    //             transform: 'perspective(1000px) rotateY(180deg)'
    //         });
    //         d("#go_set").text(SHpack.wireguade_goSet[nowLang])
    //     }
    //     flag = !flag
    // }

    et.set_config = function () {
        if (!g.volide_ok('.shbox')) {
            g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            return;
        }
        
        wireguade_info.wireguard_local[0].enable = d("#wireguade_switch").val()
        wireguade_info.wireguard_local[0].public_key = d("#wireguade_public_1").val()
        wireguade_info.wireguard_local[0].private_key = d("#wireguade_Private").val()
        wireguade_info.wireguard_local[0].listen_port = d("#wireguade_port").val()
        wireguade_info.wireguard_local[0].addresses = d("#wireguade_ip").val()
        
        wireguade_info.wireguard_peer[0].description = d("#wireguade_describe").val()
        wireguade_info.wireguard_peer[0].public_key = d("#wireguade_public").val()
        wireguade_info.wireguard_peer[0].private_key = d("#wireguade_Private_2").val()
        wireguade_info.wireguard_peer[0].preshared_key = d("#wireguade_shared").val()
        wireguade_info.wireguard_peer[0].allowed_ips = d("#wireguade_allowip").val()
        wireguade_info.wireguard_peer[0].route_allowed_ips = d("#wireguade_selectip").val()
        wireguade_info.wireguard_peer[0].endpoint_host = d("#wireguade_host").val()
        wireguade_info.wireguard_peer[0].endpoint_port = d("#wireguade_port_d").val()
        wireguade_info.wireguard_peer[0].persistent_keepalive = d("#wireguade_keepalive").val()
        
        // if(flag) {
        //     wireguade_info.wireguard_peer[1].description = d("#wireguade_describe2").val()
        //     wireguade_info.wireguard_peer[1].public_key = d("#wireguade_public2").val()
        //     wireguade_info.wireguard_peer[1].preshared_key = d("#wireguade_shared2").val()
        //     wireguade_info.wireguard_peer[1].allowed_ips = d("#wireguade_allowip2").val()
        //     wireguade_info.wireguard_peer[1].route_allowed_ips = d("#wireguade_selectip2").val()
        //     wireguade_info.wireguard_peer[1].endpoint_host = d("#wireguade_host2").val()
        //     wireguade_info.wireguard_peer[1].endpoint_port = d("#wireguade_port_d2").val()
        //     wireguade_info.wireguard_peer[1].persistent_keepalive = d("#wireguade_keepalive2").val()
        // }
        wireguade_set(wireguade_info);
    }

    function wireguade_set(arg) {
        f.setMConfig('wireguade_config_set', arg, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            } else {
                g.loading_box(SHpack['tip'][nowLang]);
				g.animationWidth(30, gohref);
            }
        })
    }
    function gohref() {
        window.location.href = location.href;
    }
});
