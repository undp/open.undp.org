views.Map = Backbone.View.extend({
    initialize: function() {
        this.render();
        if (this.collection) {
            this.collection.on('update', this.render, this);
        }
    },
    render: function() {
        this.$el.empty();
        this.buildMap();
        return this;
    },
    buildMap: function() {
        var that = this,
            locations = [],
            unit = (this.collection) ? this.collection 
                : this.model.get('operating_unit'),
            objCheck = _.isObject(unit);

        mapbox.auto(this.el, 'mapbox.mapbox-light', function(map) {
            map.ui.zoomer.remove();
            map.ui.attribution.remove();
            map.setZoomRange(2, 17);

            var radii = function(f) {
                return clustr.area_to_radius(
                    Math.round(f.properties.budget / 100000)
                );
            }

            var markers = mapbox.markers.layer()
                .factory(clustr.scale_factory(radii, "rgba(2,56,109,0.6)", "#01386C"));

            $.getJSON('api/operating-unit-index.json', function(data) {
                for (var i = 0; i < data.length; i++) {
                    var o = data[i];
                    if ((objCheck) ? unit.operating_unit[o.id] && o.lon : o.id === unit && o.lon) {
                        locations.push({
                            geometry: {
                                coordinates: [
                                    o.lon,
                                    o.lat
                                ]
                            },
                            properties: {
                                id: o.id,
                                title: o.name,
                                'marker-color': '#316593',
                                count: (objCheck) ? unit.operating_unit[o.id] : false,
                                budget: (objCheck) ? unit.operating_unitBudget[o.id] : that.model.get('budget')
                            }
                        });
                    }
                }
                markers.features(locations);
                mapbox.markers.interaction(markers);
                map.extent(markers.extent());
                if (locations.length === 1){map.zoom(4);}
                map.addLayer(markers);
    
            });

        });
    }
});