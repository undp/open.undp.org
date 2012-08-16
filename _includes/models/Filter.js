// Model
models.Filter = Backbone.Model.extend({
    defaults: {
        active: false
    }
});

// Collections
models.Filters = Backbone.Collection.extend({
    watch: function() {
        this.update();
        app.projects.on('change', this.update, this);
    },
    update: function() {
        var collection = this,
            active = _(app.app.filters).find(function(filter) {
                return (collection.id === filter.collection); 
            });

        _(collection.where({active: true })).each(function(model) { model.set('active', false) });

        if (active) {
            var model = this.get(active.id);
            var count = app.projects[collection.id][model.id];
            model.set({
                active: true,
                count: count
            });
        } else {
            collection.each(function(model) {
                var count = app.projects[collection.id][model.id];
                model.set('count', count);
            });
            collection.sort();
        }
        this.trigger('change');
    },
    model: models.Filter,
    comparator: function(model) {
        return -1 * model.get('count');
    }
});
