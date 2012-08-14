// Model
models.Filter = Backbone.Model.extend({});

// Collections
models.Filters = Backbone.Collection.extend({
    model: models.Filter,
    topFive: function() {
        return this.first(5);
    }
});
