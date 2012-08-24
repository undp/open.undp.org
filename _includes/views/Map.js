views.Map = Backbone.View.extend({
    initialize: function() {
        this.render();
    },
    render: function() {
        this.buildMap();
        return this;
    },
    buildMap: function() {
        var locations = [],
            unit = this.model.get('operating_unit');
        
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
        
        mapbox.auto('profilemap', 'mapbox.mapbox-light', function(map) {
            map.ui.zoomer.remove();
            map.ui.attribution.remove();
            var markersLayer = mapbox.markers.layer();
            mapbox.markers.interaction(markersLayer);
            markersLayer.features(locations);
            map.addLayer(markersLayer);
            map.extent(markersLayer.extent());
            map.zoom(5);
        });
    }
});