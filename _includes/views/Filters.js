views.Filters = Backbone.View.extend({
    initialize: function () {
        this.render();
        app.projects.on('reset', this.render, this);        

    },
    render: function() {
        var that = this,
            models = [];

        this.collection.each(function(model) {
            model.update();
        });

        this.collection.sort();

        models = _(this.collection.filter(function(model) {
            return model.get('count');
        })).first(5);

        this.$el.html(templates.filters(this));

        _(models).each(function(model) {
            that.$('.filter-items').append(templates.filter({ model: model }));
        });

        var max = models[0].get('count');

        // Build charts
        $('.data', '#chart-' + this.collection.id).empty();
        $('.caption', '#chart-' + this.collection.id).empty();

        _(models).each(function(model) {
            var label = (model.get('count') / max * 100) > 15 ? model.get('count') : '';
            $('.data', '#chart-' + model.collection.id).append(
                '<div style="width: ' + (model.get('count')/ max * 100) + '%">' + label + '</div>'
            );
            $('.caption', '#chart-' + model.collection.id).append(
                '<div>' + model.get('name').toLowerCase() + '</div>'
            );
        });

        return this;
    }
});
