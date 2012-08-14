views.App = Backbone.View.extend({
    events: {},
    initialize: function(options) {
        this.render();
    },
    render: function() {
        this.$el.empty().append(templates.app(this));
        return this;
    }
});
