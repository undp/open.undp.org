views.Map = Backbone.View.extend({
    initialize: function() {
        this.render();
        this.collection.on('update', this.render, this);
    },
    render: function() {
        this.$el.empty();
        this.buildMap();
        return this;
    },
    buildMap: function() {
        var locations = [];
        
        if (this.collection) {
            var c = this.collection;
            
            // turn into function
            $.getJSON('api/operating-unit-index.json', function(data) {
                for (var i = 0; i < data.length; i++) {
                    var o = data[i];
                    if (c.operating_unit[o.id]) {
                        locations.push({
                            geometry: {
                                coordinates: [
                                    o.lon,
                                    o.lat]
                            },
                            properties: {
                                id: o.id,
                                name: o.name,
                                'marker-color': '#316593',
                                count: c.operating_unit[o.id],
                                budget: c.operating_unitBudget[o.id]
                            }
                        });
                    }
                }
            });
        } else {
            var unit = this.model.get('operating_unit');
            
            $.getJSON('api/operating-unit-index.json', function(data) {
                for (var i = 0; i < data.length; i++) {
                    var o = data[i];
                    if (o.id === unit && o.lon) {
                        locations.push({
                            geometry: {
                                coordinates: [
                                    o.lon,
                                    o.lat]
                            },
                            properties: {
                                id: o.id,
                                name: o.name,
                                'marker-color': '#316593'
                            }
                        });
                    }
                }
            });
        }
        
        mapbox.auto(this.el, 'mapbox.mapbox-light', function(map) {
            console.log(locations);
            
            map.ui.zoomer.remove();
            map.ui.attribution.remove();
            var markersLayer = mapbox.markers.layer();
            mapbox.markers.interaction(markersLayer);
            markersLayer.features(locations);
            map.addLayer(markersLayer);
            map.extent(markersLayer.extent());
            if (locations.length === 1){map.zoom(4);}
        });
    }
});