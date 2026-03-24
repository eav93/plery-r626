define(function (require, exports) {
    var d = require("jquery"),
        e = require("mbox"),
        f = require("util"),
        g = require("function"),
        nowLang,
        et = {};

    var device, wireguard_info, flag = false

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
        

        f.getMConfig('wirguard_local_get', '', function (localData) {
            f.getMConfig('wirguard_peer_get', '', function (peerData) {
                if (localData && !localData.errCode && peerData && !peerData.errCode) {
                    wireguard_info = { wireguard_local: localData.wireguard_local, wireguard_peer: peerData.wireguard_peer }
                    refresh_wireguard();
                }
            });
        });
    }

    function refresh_wireguard() {
        d("#wireguard_switch").val(wireguard_info.wireguard_local[0].enable);
        d("#wireguard_public_1").val(wireguard_info.wireguard_local[0].public_key)
        d("#wireguard_Private").val(wireguard_info.wireguard_local[0].private_key);
        d("#wireguard_port").val(wireguard_info.wireguard_local[0].listen_port);


        g.setvalue("#wireguard_ip", wireguard_info.wireguard_local[0].addresses)


        d("#wireguard_describe").val(wireguard_info.wireguard_peer[0].description);
        d("#wireguard_public").val(wireguard_info.wireguard_peer[0].public_key);
        d("#wireguard_Private_2").val(wireguard_info.wireguard_peer[0].private_key)
        d("#wireguard_shared").val(wireguard_info.wireguard_peer[0].preshared_key);


        g.setvalue("#wireguard_allowip", wireguard_info.wireguard_peer[0].allowed_ips)


        d("#wireguard_selectip").val(wireguard_info.wireguard_peer[0].route_allowed_ips || '0');
        d("#wireguard_host").val(wireguard_info.wireguard_peer[0].endpoint_host);
        d("#wireguard_port_d").val(wireguard_info.wireguard_peer[0].endpoint_port);
        d("#wireguard_keepalive").val(wireguard_info.wireguard_peer[0].persistent_keepalive);

        // d("#wireguard_describe2").val(wireguard_info.wireguard_peer[1].description);
        // d("#wireguard_public2").val(wireguard_info.wireguard_peer[1].public_key);
        // d("#wireguard_shared2").val(wireguard_info.wireguard_peer[1].preshared_key);


        // g.setvalue("#wireguard_allowip2", wireguard_info.wireguard_peer[1].allowed_ips)


        // d("#wireguard_selectip2").val(wireguard_info.wireguard_peer[1].route_allowed_ips || '0');
        // d("#wireguard_host2").val(wireguard_info.wireguard_peer[1].endpoint_host);
        // d("#wireguard_port_d2").val(wireguard_info.wireguard_peer[1].endpoint_port);
        // d("#wireguard_keepalive2").val(wireguard_info.wireguard_peer[1].persistent_keepalive);
        

        et.enableConfig()
    }

    et.enableConfig = function () {
        if (d("#wireguard_switch").val() == 0) {
            d(".find_dis").find('input').prop('disabled', true).removeClass('borError')
            d(".find_dis").find('select').prop('disabled', true)
            d('.onError').remove();
            d("#wireguard_switch").removeAttr("disabled");
        } else {
            d(".find_dis").find('input').removeAttr("disabled")
            d(".find_dis").find('select').removeAttr("disabled");

        }
    }
    et.get_key = function () {
        f.getMConfig('wireguade_server_key_generation', '', function (data) {
            if (data && !data.errCode) {
                d("#wireguard_public_1").val(data.wireguade_ser_key['server-publickey'])
                d("#wireguard_Private").val(data.wireguade_ser_key['server-privatekey'])
            }
        });
    }
    et.get_key_2 = function () {
        f.getMConfig('wireguade_peer_key_generation', '', function (data) {
            if (data && !data.errCode) {
                d("#wireguard_public").val(data.wireguade_peer_key['client-publickey'])
                d("#wireguard_Private_2").val(data.wireguade_peer_key['client-privatekey'])
                d("#wireguard_shared").val(data.wireguade_peer_key['share-key'])
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
    //         d("#go_set").text(SHpack.wireguard_goBack[nowLang])
    //     } else {
    //         d('.div_left').css({
    //             transform: 'perspective(1000px) rotateY(0deg)'
    //         });
    //         d('.div_right').css({
    //             transform: 'perspective(1000px) rotateY(180deg)'
    //         });
    //         d("#go_set").text(SHpack.wireguard_goSet[nowLang])
    //     }
    //     flag = !flag
    // }

    et.set_config = function () {
        if (!wireguard_info || !wireguard_info.wireguard_local || !wireguard_info.wireguard_peer) {
            return;
        }
        if (!g.volide_ok('.shbox')) {
            g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
            return;
        }

        wireguard_info.wireguard_local[0].enable = d("#wireguard_switch").val()
        wireguard_info.wireguard_local[0].public_key = d("#wireguard_public_1").val()
        wireguard_info.wireguard_local[0].private_key = d("#wireguard_Private").val()
        wireguard_info.wireguard_local[0].listen_port = d("#wireguard_port").val()
        wireguard_info.wireguard_local[0].addresses = d("#wireguard_ip").val()
        
        wireguard_info.wireguard_peer[0].description = d("#wireguard_describe").val()
        wireguard_info.wireguard_peer[0].public_key = d("#wireguard_public").val()
        wireguard_info.wireguard_peer[0].private_key = d("#wireguard_Private_2").val()
        wireguard_info.wireguard_peer[0].preshared_key = d("#wireguard_shared").val()
        wireguard_info.wireguard_peer[0].allowed_ips = d("#wireguard_allowip").val()
        wireguard_info.wireguard_peer[0].route_allowed_ips = d("#wireguard_selectip").val()
        wireguard_info.wireguard_peer[0].endpoint_host = d("#wireguard_host").val()
        wireguard_info.wireguard_peer[0].endpoint_port = d("#wireguard_port_d").val()
        wireguard_info.wireguard_peer[0].persistent_keepalive = d("#wireguard_keepalive").val()
        
        // if(flag) {
        //     wireguard_info.wireguard_peer[1].description = d("#wireguard_describe2").val()
        //     wireguard_info.wireguard_peer[1].public_key = d("#wireguard_public2").val()
        //     wireguard_info.wireguard_peer[1].preshared_key = d("#wireguard_shared2").val()
        //     wireguard_info.wireguard_peer[1].allowed_ips = d("#wireguard_allowip2").val()
        //     wireguard_info.wireguard_peer[1].route_allowed_ips = d("#wireguard_selectip2").val()
        //     wireguard_info.wireguard_peer[1].endpoint_host = d("#wireguard_host2").val()
        //     wireguard_info.wireguard_peer[1].endpoint_port = d("#wireguard_port_d2").val()
        //     wireguard_info.wireguard_peer[1].persistent_keepalive = d("#wireguard_keepalive2").val()
        // }
        wireguard_set(wireguard_info);
    }

    function wireguard_set(arg) {
        f.setMConfig('wirguard_local_set', { wireguard_local: arg.wireguard_local }, function (data) {
            if (data.errCode != 0) {
                g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
                return;
            }
            f.setMConfig('wirguard_peer_set', { wireguard_peer: arg.wireguard_peer }, function (data2) {
                if (data2.errCode != 0) {
                    g.shconfirm(nowLang, SHtips.set_err[nowLang], "error");
                } else {
                    g.loading_box(SHpack['tip'][nowLang]);
                    g.animationWidth(30, gohref);
                }
            });
        });
    }
    function gohref() {
        window.location.href = location.href;
    }
});
