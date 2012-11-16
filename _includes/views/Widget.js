views.Widget = Backbone.View.extend({
    el: '#widget',

    events: {
       'click .widget-options a': 'widgetOptions'
    },

    initialize: function () {
        var view = this;
        view.path = '#widget/';
        view.widgetOpts = ['title', 'stats', 'map'];

        if (location.hash !== '') {
            view.path = location.hash
                .replace('filter', 'widget')
                .replace('project', 'widget/project');
            if (location.hash.split('/')[0] === '#project') {
                view.widgetOpts.push('descr');
            }
        }

        this.render();
    },

    render: function(keypress) {
        var view = this;

        view.widgetCode = '<iframe src="http://localhost:4000/undp-projects/' + view.path + '?' + view.widgetOpts.join('&') + '" width="500" height="320" frameborder="0"> </iframe>';

        this.$el.empty().append(templates.widget());

        if (view.options.context === 'projects') {
            $('.proj-opt', view.$el).hide();
            $('.main-opt', view.$el).show();
        } else {
            $('.main-opt', view.$el).hide();
            $('.proj-opt', view.$el).show();
        }

        $('.widget-preview', view.$el).html(view.widgetCode);
        $('.widget-code', view.$el).val(view.widgetCode)

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

        view.widgetCode = '<iframe src="http://localhost:4000/undp-projects/' + view.path + '?' + view.widgetOpts.join('&') + '" width="500" height="320" frameborder="0"> </iframe>';

        $('.widget-preview', view.$el).html(view.widgetCode);
        $('.widget-code', view.$el)
            .val(view.widgetCode)
            .focus()
            .select();

        return false;
    }
});
