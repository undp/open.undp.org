// Model
models.TopDonor = Backbone.Model;

// Collection
models.TopDonors = Backbone.Collection.extend({
    url: 'api/top-donor-gross-index.json',
    model: models.TopDonor,
    comparator: function(model) {
      return -1 * model.get('amount');
    }
});