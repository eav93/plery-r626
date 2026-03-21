define(function () {
    return function (jquery) {
        (function ($) {
            $.fn.MCheckbox = function (options) {

                options = $.extend({
                    labels: ['ON', 'OFF']
                }, options);

                return this.each(function () {
                    var originalCheckBox = $(this),
                        labels = [];

                    if (originalCheckBox.data('on')) {
                        labels[0] = originalCheckBox.data('on');
                        labels[1] = originalCheckBox.data('off');
                    }
                    else labels = options.labels;

                    var checkBox = $('<span>', {
                        html: '<span class="MCB_Content">' + labels[this.checked ? 0 : 1] +
                        '</span><span class="MCB_Part"></span>'
                    });

                    this.checked ? checkBox.addClass('MCBox checked') : checkBox.addClass('MCBox');


                    checkBox.insertAfter(originalCheckBox.hide());

                    checkBox.click(function () {
                        checkBox.toggleClass('checked');

                        var isChecked = checkBox.hasClass('checked');

                        originalCheckBox.attr('checked', isChecked);
                        checkBox.find('.MCB_Content').html(labels[isChecked ? 0 : 1]);
                    });

                    originalCheckBox.bind('change', function () {
                        checkBox.click();
                    });
                });
            };
        })(jQuery);
    }
})