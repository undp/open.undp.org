views.Map = Backbone.View.extend({
    initialize: function() {
        this.render();
        if (this.collection) {
            this.collection.on('update', this.render, this);
        }
    },
    render: function() {
        this.$el.empty().append('<div class="inner-shadow"></div>');
        this.buildMap();
        return this;
    },
    buildMap: function() {
        var that = this,
            locations = [],
            count, budget, description,
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
                .factory(clustr.scale_factory(radii, "rgba(2,56,109,0.6)", "#01386C"))
                .sort(function(a,b){ return b.properties.budget - a.properties.budget; });

            $.getJSON('api/operating-unit-index.json', function(data) {
                for (var i = 0; i < data.length; i++) {
                    var o = data[i];
                    if ((objCheck) ? unit.operating_unit[o.id] && o.lon : o.id === unit && o.lon) {
                    
                        (objCheck) ? count = unit.operating_unit[o.id] : count = false;
                        (objCheck) ? budget = unit.operating_unitBudget[o.id] : budget = that.model.get('budget');
                        description = '<div class="stat">Budget: <span class="value">'
                                      + accounting.formatMoney(budget) + '</span></div>';
                        if (objCheck) {
                            description += '<div class="stat">Projects: <span class="value">'
                                        + count + '</span></div>';
                        }
                        
                        locations.push({
                            geometry: {
                                coordinates: [
                                    o.lon,
                                    o.lat
                                ]
                            },
                            properties: {
                                id: o.id,
                                name: o.name,
                                title: (objCheck) ? o.name : that.model.get('title') + '<div class="subtitle">' + o.name + '</div>',
                                count: count,
                                budget: budget,
                                description: description
                            }
                        });
                    }
                }
                
                if (locations.length != 0) {
                    markers.features(locations);
                    mapbox.markers.interaction(markers);
                    map.extent(markers.extent());
                    map.addLayer(markers);
                    if (locations.length === 1) {
                        map.zoom(4);
                        $('p[data-category="op_unit"]').html(locations[0].properties.name);
                    }
                } else {
                    map.centerzoom({lat:20,lon:0},2);
                }
            });

        });
    }
});