views.Map2 = Backbone.View.extend({
    events: {
        'click img.mapmarker': 'mapClick',
        'click img.simplestyle-marker': 'mapClick',
        'mouseover img.mapmarker': 'tooltipFlip'
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

    buildMap: function(layer) {
        var view = this,
            locations = [],
            count, sources, budget, title, hdi, hdi_health, hdi_education, hdi_income,
            unit = this.collection;

        // Map set up, uses mapbox.js 1.3.1
        view.map = L.mapbox.map(this.el,TJ.id,{ //basemap tilejson is hardcoded into the site as variable TJ
                center: [0,0],
                zoom: 2,
                minZoom: TJ.minzoom,
                maxZoom: TJ.maxzoom
            });

        // new marker setup
        var markers = L.mapbox.markerLayer()
            .addTo(view.map);  
        
        var radii = function(f) {
            console.log(f);
            f.properties.description = view.tooltip(layer, f.properties);
            return clustr.area_to_radius(
                Math.round(view.scale(layer,f))
            );
        };

        // Use clustr.js to generate scaled markers
        // markers.factory(clustr.scale_factory(radii, 'rgba(0,85,170,0.6)', '#FFF')).sort(function(a, b) {
        //     return b.properties[layer] - a.properties[layer];
        // });    

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
                        /*
                        view.hdi = new views.HDI({
                            unit: o.id
                        });
                        */
                        
                    } else {
                        hdi = hdi_health = hdi_education = hdi_income = hdi_rank = 'no data';
                    }
                    
                    // Create location and tooltip info for each active country marker
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
                markers.features(locations);
                mapbox.markers.interaction(markers);
                view.map.extent(markers.extent());
                view.map.addLayer(markers);
                if (locations.length === 1) {
                    view.map.zoom(4);
                }
            } else {
                view.map.centerzoom({lat:20, lon:0}, 2);
            }
        });
    },
    
    // Update map when switching between layer types
    updateMap: function(layer) {
        var view = this,
            markers = this.map.layers[1],

            radii = function(f) {
                f.properties.description = view.tooltip(layer, f.properties);
                return clustr.area_to_radius(
                    Math.round(view.scale(layer,f))
                );
            };

        if (markers) {
            markers.sort(function(a,b){ return b.properties[layer] - a.properties[layer]; })
                .factory(clustr.scale_factory(radii, 'rgba(0,85,170,0.6)', '#FFF'));
        }
    },
    
    // Set marker scale depending on type of data
    scale: function(cat,x) {
        if (cat == 'budget' || cat == 'expenditure') {
            return Math.round(x.properties[cat] / 100000);
        } else if (cat == 'hdi') {
            return Math.round(Math.pow(x.properties[cat],2) / 0.0008);
        } else {
            return Math.round(x.properties[cat] / 0.05);
        }
    },
    
    // Enable clicking on markers to choose country
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
    },

    tooltip: function(layer, data) {
        var description = '<div class="stat' + ((layer == 'budget') ? ' active' : '') + '">Budget: <span class="value">' +
            accounting.formatMoney(data.budget) + '</span></div>' +
            '<div class="stat' + ((layer == 'expenditure') ? ' active' : '') + '">Expenditure: <span class="value">' +
            accounting.formatMoney(data.expenditure) + '</span></div>';
            
        if (data.count) {
            description = '<div class="stat' + ((layer == 'count') ? ' active' : '') + '">Projects: <span class="value">' +
                 data.count + '</span></div>' +
                 ((data.sources > 1) ? ('<div class="stat' + ((layer == 'sources') ? ' active' : '') + '">Budget Sources: <span class="value">' +
                 data.sources + '</span></div>') : '') +
                 description +
                 '<div class="stat' + ((layer == 'hdi') ? ' active' : '') + '">HDI: <span class="value">' +
                 data.hdi + '</span></div>';
        }
        return description;
    },

    tooltipFlip: function(e) {
        var $target = $(e.target),
            top = $target.offset().top - this.$el.offset().top;
        if (top <= 150) {
            var tipSize = $('.marker-popup').height() + 50;
            $('.marker-tooltip')
                .addClass('flip')
                .css('margin-top',tipSize + $target.height());
        }
    }
});
