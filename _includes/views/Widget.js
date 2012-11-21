views.Widget = Backbone.View.extend({
    el: '#widget',

    events: {
       'click .widget-options a': 'widgetOptions'
    },

    initialize: function () {
        var view = this;
        view.path = '#widget/';
        view.widgetOpts = ['title', 'stats', 'map', 'descr'];

        if (location.hash !== '') {
            view.path = location.hash
                .replace('filter', 'widget')
                .replace('project', 'widget/project');
        }
        this.render();
    },

    render: function(keypress) {
        var view = this;

        this.$el.empty().append(templates.widget());

        if (view.options.context === 'projects') {
            $('.proj-opt', view.$el).hide();
            $('.main-opt', view.$el).show();
        } else {
            $('.main-opt', view.$el).hide();
            $('.proj-opt', view.$el).show();
        }

        return this;
    },

    widgetOptions: function(e) {
        var view = this;
        var $el = $(e.target);
        var opt = $el.attr('data-value');

        if ($el.hasClass('active')) {
            $el.removeClass('active');
            view.widgetOpts.splice(view.widgetOpts.indexOf(opt), 1);
        } else {
            $el.addClass('active');
            view.widgetOpts.push(opt);
        }

        if (view.widgetOpts.length !== 0) {
            view.widgetCode = '<iframe src="' + BASE_URL + 'embed.html' + view.path + '?' + view.widgetOpts.join('&') + '" width="500" height="360" frameborder="0"> </iframe>';

            $('.widget-preview', view.$el).html(view.widgetCode);
            $('.widget-code', view.$el)
                .show()
                .val(view.widgetCode)
                .focus()
                .select();
        } else {
            $('.widget-preview', view.$el).html('<h3 class="empty">To use this widget choose some options on the left.</h3>');
            $('.widget-code', view.$el)
                .hide();
        }

        return false;
    }
});
