// Model
models.Filter = Backbone.Model.extend({
    count: function() {
        var obj = {};
        obj[this.collection.id] = this.get('id');
        return app.projects.where(obj).length;
    }
});

// Collections
models.Filters = Backbone.Collection.extend({
    model: models.Filter,
    comparator: function(model) {
        return -1 * model.count();
    }
});
