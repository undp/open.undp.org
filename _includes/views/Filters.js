views.Filters = Backbone.View.extend({
    initialize: function () {
        this.render();
        app.projects.on('reset', this.render, this);        

    },
    render: function() {
        var that = this,
            models = _(this.collection.filter(function(model) {
                return model.count();
            })).first(5);

        this.collection.sort();
        this.$el.html(templates.filters(this));

        _(models).each(function(model) {
            that.$('.filter-items').append(templates.filter({ model: model }));
        });
        return this;
    }
});
