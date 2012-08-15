// Model
models.Filter = Backbone.Model.extend({
    initialize: function() {
        this.update();
    },
    update: function() {
        var that = this,
            count = app.projects.filter(function(model) {
                var collection = model.get(that.collection.id);
    
                if (_(collection).isString()) {
                    return (collection === that.get('id'));
                } else if (_(collection).isArray()) {
                    return (collection.indexOf(that.get('id')) == true);
                }
            });

        this.set('count', count.length);
    }
});

// Collections
models.Filters = Backbone.Collection.extend({
    model: models.Filter,
    comparator: function(model) {
        return -1 * model.get('count');
    }
});
