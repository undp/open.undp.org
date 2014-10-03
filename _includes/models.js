National = Backbone.Model.extend({
    initialize:function(){
        this.lon = this.get('lon');
        this.lat = this.get('lat');
        this.fund_type = this.get('fund_type');
        this.centroid = {
            "type":"Feature",
            "properties":{
                "id":this.get('id'),
                "title":this.get('name')
            },
            "geometry":{
                "type":"Point",
                "coordinates":[parseFloat(this.lon),parseFloat(this.lat)]
            }
        };
    }
});

Subnational = Backbone.Model.extend({
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

Filter = Backbone.Model.extend({
    // by default filter models are active false
    defaults: {
        active: false,
        visible: true
    },
    initialize: function() {
        if (this.collection.id === 'donors' && this.id === '00012') {
            this.set({ name: 'UNDP Regular Resources' }, { silent: true });
        }
    }
});

Project = Backbone.Model.extend({
    defaults: {
        visible: true
    },
    url: function() {
        return 'api/projects/' + this.get('id') + '.json';
    }
});

Facet = Backbone.Model.extend({
    defaults: {
        id:'',
        name:'',
        url:''
    },
    initialize: function(){
        var that = this;
        // create the filters under each Facet model
        this.subCollection = new Filters();

        // the subCollection (aka Filters) inherit the facets fields
        this.subCollection.id = this.get('id');
        this.subCollection.name = this.get('name');
        this.subCollection.url = this.get('url');
    }
});

TopDonor = Backbone.Model.extend({});