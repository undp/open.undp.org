// Models
models.TopDonor = Backbone.Model.extend({
});

// Collections
models.TopDonors = Backbone.Collection.extend({
    initialize: function(options) {
        this.type = options.type;
    },
    
    model: models.TopDonor,
    
    comparator: function(model) {
        return -1 * model.get(this.type);
    }
});