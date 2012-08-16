views.Filters = Backbone.View.extend({
    initialize: function () {
        this.collection.on('change', this.render, this);
    },
    render: function() {
        var view = this,
            models = [],
            active = this.collection.where({ active: true });

        if(active.length) {
            models = active;
        } else {
            console.log(this.collection.pluck('count'));
            models = _(this.collection.filter(function(model) {
                return (model.get('count') > 0);
            })).first(5);
        }
    
        if (!models.length) return this;

        this.$el.html(templates.filters(this));

        _(models).each(function(model) {
            view.$('.filter-items').append(templates.filter({ model: model }));
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
