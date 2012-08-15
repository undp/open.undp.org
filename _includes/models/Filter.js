// Model
models.Filter = Backbone.Model.extend({
    initialize: function() {
        this.update();
    },
    update: function() {
        var obj = {};
        obj[this.collection.id] = this.get('id');
        this.set('count', app.projects.where(obj).length);
    }
});

// Collections
models.Filters = Backbone.Collection.extend({
    model: models.Filter,
    comparator: function(model) {
        return -1 * model.get('count');
    }
});
