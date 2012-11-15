views.Widget = Backbone.View.extend({
    el: '#widget',
    events: {
       'click a': 'toggle' 
    },
    initialize: function () {
        this.render();

        // Widget configuration/modal
        this.widgetOpts = ['title', 'stats', 'map'];

        // TODO Turn off menu options depending on views.options.context
        // Project rules
        // $('.widget-options ul li.main-opt').hide();
        // $('.widget-options ul li.proj-opt').show();
        // Set available widget components
        // $('.widget-options ul li.proj-opt').hide();
        // $('.widget-options ul li.main-opt').show();

    },
    render: function(keypress) {
        var view = this;
        this.$el.empty().append(templates.widget());
        return this;
    }
});
        

        $('a.widget-config').click(function () {
            if (location.hash == '') {
                var path = '#widget/';
            } else {
                var path = location.hash.replace('filter', 'widget').replace('project', 'widget/project');
                if (location.hash.split('/')[0] === '#project') {
                    widgetOpts.push('descr');
                }
            }
            var widgetCode = '<iframe src="http://localhost:4000/undp-projects/' + path + '?' + widgetOpts.join('&') + '" width="500" height="350" frameborder="0"> </iframe>';

            $('.widget-preview', view.$el).html(widgetCode);
            $('.widget-code', view.$el)
                .val(widgetCode)
                .focus()
                .select();
        });

        $('#widget-config .switch').click(function () {
            if (location.hash == '') {
                var path = '#widget/';
            } else {
                var path = location.hash.replace('filter', 'widget').replace('project', 'widget/project');
            }

            var opt = $(this).prop('value');

            if ($(this).prop('checked')) {
                widgetOpts.push(opt);
            } else {
                widgetOpts.splice(widgetOpts.indexOf(opt), 1);
            }

            var widgetCode = '<iframe src="http://localhost:4000/undp-projects/' + path + '?' + widgetOpts.join('&') + '" width="500" height="350" frameborder="0"> </iframe>';

            $('#widget-config .widget-preview').html(widgetCode);
            $('#widget-config .widget-code').val(widgetCode).focus().select();
        });

