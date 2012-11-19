views.WidgetOutput = Backbone.View.extend({
    el: '#embed',
    initialize: function () {
        var view = this;
        this.render();
    },

    render: function() {
        var options = {}

        _(this.options.options).each(function(o) {
            options[o] = templates[o]();
        });

        this.$el.empty().append(templates.embed({
            options:options
        }));

        return this;
    }
});
