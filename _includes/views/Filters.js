views.Filters = Backbone.View.extend({
    initialize: function () {
        this.render();
    },
    render: function() {
        var that = this;
        this.$el.html(templates.filters(this));
        _(this.collection.first(5)).each(function(model) {
            that.$('.filter-items').append(templates.filter({ model: model }));
        });
        return this;
    }
});
