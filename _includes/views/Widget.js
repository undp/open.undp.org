views.Widget = Backbone.View.extend({
    el: '#widget',
    template: _.template($('#widgetTemplate').html()),
    events: {
       'click .widget-options a': 'widgetOptions',
       'click .widget-code': 'inputSelect'
    },

    initialize: function () {
        this.destroy();
        this.render();
    },

    render: function(keypress) {
        this.$el.html(this.template());

        if (this.options.context === 'projects') {
            $('.proj-opt', this.$el).hide();
            $('.main-opt', this.$el).show();
        } else {
            $('.main-opt', this.$el).hide();
            $('.proj-opt', this.$el).show();
        }
        // add custom donor content option when a donor country is filtered
        if (global.app) {
            var donorCountryOption = "<li class='main-opt donor-specific-opt'>"
                + "<a href='#' data-value='donor-specific'>Custom Donor Content</a>"
                + "</li>";
            if (global.donorCountry){
                $('.widget-options').prepend(donorCountryOption)
            }
        }

        return this;
    },

    destroy: function() {
        this.undelegateEvents();
        this.$el.removeData().unbind();
    },

    widgetOptions: function(e) {
        this.path = '#widget/';

        if (location.hash.split('/').length === 1) {
            this.path = location.hash + '/widget/';
        } else {
            this.path = location.hash
                .replace('filter', 'widget')
                .replace('project', 'widget/project');
        }

        var widgetAnchors = $('.widget-options').find('a.active'),
            widgetOpts = [],
            $optionEl = $(e.target),
            opt = $optionEl.attr('data-value');

        _(widgetAnchors).each(function(anchor){
            var widgetTitle = $(anchor).attr('data-value');
            widgetOpts.push(widgetTitle);
        })

        if ($optionEl.hasClass('active')) {
            $optionEl.removeClass('active');
            widgetOpts.splice(widgetOpts.indexOf(opt), 1);
        } else {
            $optionEl.addClass('active');
            widgetOpts.push(opt);
        }

        if (widgetOpts.length !== 0) {
            widgetCode = '<iframe src="{{site.baseurl}}/' +
                'embed.html' + this.path + '?' + widgetOpts.join('&') +
                '" width="100%" height="100%" frameborder="0"> </iframe>';

            $('.widget-preview', this.$el).html(widgetCode);
            $('.widget-code', this.$el)
                .val(widgetCode.replace('src="{{site.baseurl}}/','src="' + Backbone.history.location.origin + '/'))
                .select();
        } else {
            $('.widget-preview', this.$el).html('<h3 class="empty">To use this widget choose options from above.</h3>');
        }

        return false;
    },

    inputSelect: function(e) {
        $(e.target).select();
    }
});
