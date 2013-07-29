views.Map2 = Backbone.View.extend({

    events: {
        'click img.mapmarker': 'mapClick',
        'click img.simplestyle-marker': 'mapClick',
    },

    initialize: function() {
        if (this.options.render) this.render();
    },

    render: function() {
        var view = this;
        // Condition for embed
        if (!view.options.embed) {
            layer = $('.map-btn.active').attr('data-value');
        } else {
            layer = 'budget';
        }
        
        // Give map an inner shadow unless browser is IE
        var IE = $.browser.msie;
        view.$el.empty();
        if (!IE) view.$el.append('<div class="inner-shadow"></div>');
        view.buildMap(layer);
    },

    // UTIL set marker scale depending on type of data
    scale: function(cat,x) {
        if (cat == 'budget' || cat == 'expenditure') {
            return Math.round(x.properties[cat] / 100000);
        } else if (cat == 'hdi') {
            return Math.round(Math.pow(x.properties[cat],2) / 0.0008);
        } else {
            return Math.round(x.properties[cat] / 0.05);
        }
    },
    //UTIL format description for popup
    popup: function(layer, data) {
        var description = '<div class="stat' + ((layer == 'budget') ? ' active' : '') + '">Budget: <span class="value">' +
            accounting.formatMoney(data.budget) + '</span></div>' +
            '<div class="stat' + ((layer == 'expenditure') ? ' active' : '') + '">Expenditure: <span class="value">' +
            accounting.formatMoney(data.expenditure) + '</span></div>';

        if (data.count) { // if data has project nubmer count
            description = '<div class="stat' + ((layer == 'count') ? ' active' : '') + '">Projects: <span class="value">' +
                 data.count + '</span></div>' +
                 ((data.sources > 1) ? ('<div class="stat' + ((layer == 'sources') ? ' active' : '') + '">Budget Sources: <span class="value">' +
                 data.sources + '</span></div>') : '') +
                 description + // all data
                 '<div class="stat' + ((layer == 'hdi') ? ' active' : '') + '">HDI: <span class="value">' +
                 data.hdi + '</span></div>';
        }

        return description;
    },
    //UTIL set popup description and return the radius for circles

    buildMap: function(layer) {
        var view = this,
            locations = [],
            count, sources, budget, title, hdi, hdi_health, hdi_education, hdi_income,
            unit = this.collection;

        var radius =  function(f){
            var r = Math.round(Math.sqrt(view.scale(layer,f)/ Math.PI));
            return r
            };

        // Map setup with mapbox.js 1.3.1
        view.map = L.mapbox.map(this.el,TJ.id,{ //basemap tilejson is hardcoded into the site as variable TJ
                center: [0,0],
                zoom: 2,
                minZoom: TJ.minzoom,
                maxZoom: TJ.maxzoom
            });

        // operating-unit-index.json cointains coords for country centroids
        $.getJSON('api/operating-unit-index.json', function(data) {
            for (var i = 0; i < data.length; i++) {
                var o = data[i];
                if (unit.operating_unit[o.id] && o.lon) {
                    count = unit.operating_unit[o.id];
                    sources = (unit.donorID) ? false : unit.operating_unitSources[o.id];
                    budget = (unit.donorID && _.size(unit.operating_unit)) ? unit.donorBudget[unit.donorID] : unit.operating_unitBudget[o.id];
                    expenditure = (unit.donorID && _.size(unit.operating_unit)) ? unit.donorExpenditure[unit.donorID] : unit.operating_unitExpenditure[o.id];
                    
                    // Collect HDI data, create HDI graph view if filtered on a single operating_unit
                    if ((HDI[o.id]) ? HDI[o.id].hdi != '' : HDI[o.id]) {
                        hdi = _.last(HDI[o.id].hdi)[1];
                        hdi_health = _.last(HDI[o.id].health)[1];
                        hdi_education = _.last(HDI[o.id].education)[1];
                        hdi_income = _.last(HDI[o.id].income)[1];
                        hdi_rank = HDI[o.id].rank;

                    } else {
                        hdi = hdi_health = hdi_education = hdi_income = hdi_rank = 'no data';
                    }
                    // Create location geojson with tooltip info (properties) for each active country marker
                    locations.push({
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [
                                o.lat,
                                o.lon
                            ]
                        },
                        properties: {
                            id: o.id,
                            title: o.name,
                            count: count,
                            sources: sources,
                            budget: budget,
                            expenditure: expenditure,
                            hdi: hdi
                        }
                    });
                }
            }

            if (locations.length !== 0) {
                var circleOptions = {
                    radius:radius(feature),
                    color:"#fff",
                    opacity:1,
                    fillColor: "#0055aa",
                    fillOpacity: 0.6
                };
                // using pointToLayer to make locations into a circleMarker vector layer
                // turn this into a function
                // read up http://leafletjs.com/examples/geojson.html
                var circles = function(loc,feature,options){
                    L.geoJson(loc,{
                        pointToLayer:function(feature,latlng){
                            return.cicleMarker(latlng,options);
                        }
                    }).addTo(view.map);
                }

                // view.map.markerLayer.on("layeradd", function(o) {
                //     var marker = o.layer, //acesses all the method of marker
                //         feature = marker.feature;
                //     // Create custom popup content
                //     var popupContent =  view.popup(layer, feature.properties);
                //     var circles = L.circleMarker(feature.geometry.coordinates, radius(feature),{
                //         stroke:false,
                //         color: "#fff",
                //         fillColor: "#0055aa",
                //     }).bindPopup(popupContent,{
                //         closeButton: false,
                //         minWidth: 180
                //     });
                // });

                // Add features to the map
                // view.map.markerLayer.setGeoJSON({
                //     type:"FeatureCollection",
                //     features:locations
                // });
                (locations.length === 1) ? view.map.setZoom(4) : view.map.setZoom(2)
            }
        });
    },
    
    // Update map when switching between layer types
    updateMap: function(layer) {
        console.log('this is triggered by clicking categories');
        // var view = this;
        // markers = this.map.layers[1],

        // radii = function(f) {
        //     f.properties.description = view.popup(layer, f.properties);
        //     return clustr.area_to_radius(
        //         Math.round(view.scale(layer,f))
        //     );
        // };

        // if (markers) {
        //     markers.sort(function(a,b){ return b.properties[layer] - a.properties[layer]; })
        //         .factory(clustr.scale_factory(radii, 'rgba(0,85,170,0.6)', '#FFF'));
        // }
    },
    
    // Enable clicking on markers to choose country, needs to be updated with circleClick
    mapClick: function(e) {
        var $target = $(e.target),
            drag = false,
            view = this;

        this.map.addCallback('panned', function() {
            drag = true;
        });

        // if map has been panned do not fire click
        $target.on('mouseup', function(e) {
            var path;
            if (drag) {
                e.preventDefault();
            } else {
                path = '#filter/operating_unit-' + $target.attr('id');
                app.navigate(path, { trigger: true });
                $('#browser .summary').removeClass('off');
            }
        });
    }
});
