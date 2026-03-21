define(function () {
    return function (jquery) {
        (function ($) {
            var nowLang;
            var ms = {
                init: function (PageCode, PageInfo, args) {
                    return (function () {
                        ms.fillHtml(PageCode, args);
                        ms.bindEvent(PageCode, PageInfo, args);
                        ms.pageinfo(PageInfo, args)
                    })();
                },

                fillHtml: function (obj, args) {
                    return (function () {
                        obj.empty();
                        if (!args.current){
                            return;
                        }
                        //上一页
                        if (args.current > 1) {
                            obj.append('<a href="javascript:;" class="prevPage">' + SHpack['previous'][nowLang] + '</a>');
                        } else {
                            obj.remove('.prevPage');
                            obj.append('<span class="disabled">' + SHpack['previous'][nowLang] + '</span>');
                        }
                        //中间页码
                        if (args.current != 1 && args.current > 4) {
                            obj.append('<a href="javascript:;" class="tcdNumber">' + 1 + '</a>');
                        }
                        if (args.current - 2 > 2 && args.current <= args.pageCount && args.pageCount > 5) {
                            obj.append('<span class="more">...</span>');
                        }
                        var start = args.current - 2, end = args.current + 2;
                        if ((start > 1 && args.current < 4) || args.current == 1) {
                            end++;
                        }
                        if (args.current > args.pageCount - 4 && args.current >= args.pageCount) {
                            start--;
                        }
                        for (; start <= end; start++) {
                            if (start <= args.pageCount && start >= 1) {
                                if (start != args.current) {
                                    obj.append('<a href="javascript:;" class="tcdNumber">' + start + '</a>');
                                } else {
                                    obj.append('<span class="current">' + start + '</span>');
                                }
                            }
                        }
                        if (args.current + 2 < args.pageCount - 1 && args.current >= 1 && args.pageCount > 5) {
                            obj.append('<span class="more">...</span>');
                        }
                        if (args.current != args.pageCount && args.current < args.pageCount - 2 && args.pageCount != 4) {
                            obj.append('<a href="javascript:;" class="tcdNumber">' + args.pageCount + '</a>');
                        }
                        //下一页
                        if (args.current < args.pageCount) {
                            obj.append('<a href="javascript:;" class="nextPage">' + SHpack['nextpage'][nowLang] + '</a>');
                        } else {
                            obj.remove('.nextPage');
                            obj.append('<span class="disabled">' + SHpack['nextpage'][nowLang] + '</span>');
                        }
                    })();
                },

                pageinfo: function (obj, args) {
                    obj.empty();
                    obj.append('<label>' + args.current + '/' + args.pageCount + SHpack['page'][nowLang] + '</label>,<label>' + SHpack['altogether'][nowLang] +'&nbsp;'+ args.total +'&nbsp;'+ SHpack['item'][nowLang] + '</label>')
                },
                //绑定事件
                bindEvent: function (PageCode, PageInfo, args) {
                    PageCode.off("click");
                    return (function () {
                        PageCode.on("click", "a.tcdNumber", function () {
                            var current = parseInt($(this).text());
                            var arg = {"current": current, "pageCount": args.pageCount, "total": args.total};
                            ms.fillHtml(PageCode, arg);
                            ms.pageinfo(PageInfo, arg)
                            if (typeof(args.PageFn) == "function") {
                                args.PageFn(current);
                            }
                        });
                        //上一页
                        PageCode.on("click", "a.prevPage", function () {
                            var current = parseInt(PageCode.children("span.current").text());
                            var arg = {"current": current - 1, "pageCount": args.pageCount, "total": args.total};
                            ms.fillHtml(PageCode, arg);
                            ms.pageinfo(PageInfo, arg)
                            if (typeof(args.PageFn) == "function") {
                                args.PageFn(current - 1);
                            }
                        });
                        //下一页
                        PageCode.on("click", "a.nextPage", function () {
                            var current = parseInt(PageCode.children("span.current").text());
                            var arg = {"current": current + 1, "pageCount": args.pageCount, "total": args.total}
                            ms.fillHtml(PageCode, arg);
                            ms.pageinfo(PageInfo, arg)
                            if (typeof(args.PageFn) == "function") {
                                args.PageFn(current + 1);
                            }
                        });
                    })();
                }
            }
            $.fn.SHPages = function (options, Lang) {
                nowLang = Lang;
                if (!options.total) {
                    return;
                }
                options.pageCount = Math.ceil(options.total / options.pageTotal);
                var args = $.extend({
                    pageCount : 10,
                    current : 1,
                    PageFn : function(){}
                },options);
                var PageCode =  this.children('.PageCode');
                var PageInfo =  this.children('.PageInfo');
                ms.init(PageCode,PageInfo,args);
            }
        })(jQuery);
    }
})