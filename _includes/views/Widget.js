views.Widget = Backbone.View.extend({
    el: '#widget',

    events: {
       'click .widget-options a': 'widgetOptions',
       'click .widget-code': 'inputSelect'
    },

    initialize: function () {
        this.destroy();
        this.render();
    },

    render: function(keypress) {
        var view = this;

        $(this.el).empty().append(templates.widget());

        if (view.options.context === 'projects') {
            $('.proj-opt', view.$el).hide();
            $('.main-opt', view.$el).show();
        } else {
            $('.main-opt', view.$el).hide();
            $('.proj-opt', view.$el).show();
        }
        // add custom donor content option when a donor country is filtered
        if (app.app) {
            var donorCountryFilter = _(app.app.filters).findWhere({collection:"donor_countries"}),
                donorCountryOption = "<li class='main-opt donor-specific-opt'>"
                + "<a href='#' data-value='donor-specific'>Custom Donor Content</a>"
                + "</li>";
            if (_.isObject(donorCountryFilter)){
                $('.widget-options').prepend(donorCountryOption)
            }
        }

        return this;
    },

    destroy: function() {
        this.undelegateEvents();
        $(this.el).removeData().unbind();
    },

    widgetOptions: function(e) {
        var view = this;
            view.path = '#widget/';

        if (location.hash.split('/').length === 1) {
            view.path = location.hash + '/widget/';
        } else {
            view.path = location.hash
                .replace('filter', 'widget')
                .replace('project', 'widget/project');
        }

        var widgetAnchors = $('.widget-options').find('a.active'),
            widgetOpts = [],
            $el = $(e.target),
            opt = $el.attr('data-value');

        _(widgetAnchors).each(function(anchor){
            var widgetTitle = $(anchor).attr('data-value');
            widgetOpts.push(widgetTitle);
        })

        if ($el.hasClass('active')) {
            $el.removeClass('active');
            widgetOpts.splice(widgetOpts.indexOf(opt), 1);
        } else {
            $el.addClass('active');
            widgetOpts.push(opt);
        }

        if (widgetOpts.length !== 0) {
            view.widgetCode = '<iframe src="{{site.baseurl}}/' +
                'embed.html' + view.path + '?' + widgetOpts.join('&') +
                '" width="100%" height="100%" frameborder="0"> </iframe>';

            $('.widget-preview', view.$el).html(view.widgetCode);
            $('.widget-code', view.$el)
                .val(view.widgetCode.replace('src="{{site.baseurl}}/','src="' + BASE_URL))
                .select();
        } else {
            $('.widget-preview', view.$el).html('<h3 class="empty">To use this widget choose options from above.</h3>');
        }

        return false;
    },

    inputSelect: function(e) {
        $(e.target).select();
    }
});
