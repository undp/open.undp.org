// Model
models.Subnational = Backbone.Model.extend({
    defaults: {visible:false},
    initialize:function(){
        this.url = 'api/projects/' + this.get('id') + '.json' // on instantiating, the url of the model becomes the url of the project
    }
});

// Collection
models.Subnationals = Backbone.Collection.extend({
    model: models.Subnational,
    update: function() {
        filtered = this.filter(function(model) {
          return model.get("visible") === true;
        });
        return new models.Subnationals(filtered);
    }
});
