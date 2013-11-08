// Model
models.Subnational = Backbone.Model.extend({
    defaults: {visible:false},
    initialize:function(){ // can this happen on a collection level?
        model = this;
        sub = model.get('subnational');
        if (sub.length === 0 ) {
            model.geojson = null;
        } else {
            geojson = [];
            _(sub).each(function(data){
                
                var feature = {
                    "type":"Feature",
                    "properties":{
                        project:model.get('id'),
                        output_id: data.outputID,
                        title:model.get('title'),
                        precision: data.precision,
                        scope: data.scope,
                        focus_area: data.focus_area,
                        focus_descr: data.focus_area_descr,
                        type: data.type,
                        'marker-size': 'small'
                        },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [parseFloat(data.lon),parseFloat(data.lat)]
                        }
                    };
                geojson.push(feature);   
            })
            model.geojson = geojson;
        }
    }
});

// Collection
models.Subnationals = Backbone.Collection.extend({
    model: models.Subnational,
    parse: function(response){
        return response.projects
    },
    filtered: function() {
        visible = this.filter(function(model) {
          return model.get("visible") === true;
        });
        return new models.Subnationals(visible);
    }
});