views.WidgetOutput = Backbone.View.extend({
    el: '#embed',
    initialize: function () {
        var view = this;
        this.render();
    },

    render: function(keypress) {
        this.$el.empty().append(templates.embed());
        return this;
    }
});
