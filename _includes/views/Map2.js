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
            layer = $('.map-btn.active').attr('data-value'); //the layer name is coded in app._
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
    //UTIL format description for popup (html structure)
    popup: function(layer, data) {
        var title = '<div class="title">' + data.properties.title + '</div>'
        var description = title +
            '<div class="stat' + ((layer == 'budget') ? ' active' : '') + '">Budget: <span class="value">' +
            accounting.formatMoney(data.properties.budget) + '</span></div>' +
            '<div class="stat' + ((layer == 'expenditure') ? ' active' : '') + '">Expenditure: <span class="value">' +
            accounting.formatMoney(data.properties.expenditure) + '</span></div>';

        if (data.count) { // if data has project nubmer count
            description = title +
                '<div class="stat' + ((layer == 'count') ? ' active' : '') + '">Projects: <span class="value">' +
                data.properties.count + '</span></div>' +
                ((data.sources > 1) ? ('<div class="stat' + ((layer == 'sources') ? ' active' : '') + '">Budget Sources: <span class="value">' +
                data.properties.sources + '</span></div>') : '') +
                description + // all data
                '<div class="stat' + ((layer == 'hdi') ? ' active' : '') + '">HDI: <span class="value">' +
                data.properties.hdi + '</span></div>';
        }

        return description;
    },
    //UTIL set popup description and return the radius for circles
    buildMap: function(layer) {
        var view = this,
            locations = [],
            count, sources, budget, title, hdi, hdi_health, hdi_education, hdi_income,
            unit = this.collection;

        // Create the map with mapbox.js 1.3.1
        // http://www.mapbox.com/mapbox.js/api/v1.3.1/#L.mapbox.map
        view.map = L.mapbox.map(this.el,TJ.id,{ //basemap tilejson is hardcoded into the site as variable TJ
                center: [0,0],
                zoom: 2,
                minZoom: TJ.minzoom,
                maxZoom: TJ.maxzoom,
                noWrap: true // TODO avoid continous world
            });
        // calculate the radius
        var radius =  function(f){
            var r = Math.round(Math.sqrt(view.scale(layer,f)/ Math.PI));
            return r
            };
        // highlight/selected
        var markerState = function(layer,options){
            if (!options){options = {}}
            layer.setStyle({
                color: options.color || '#fff',
                weight: options.weight || 1,
                opacity: options.opacity || 1,
                fillColor: options.fillColor || '#0055aa',
                fillOpacity: options.fillOpacity || 0.6
            })
        }
        // using pointToLayer to make location points into a circleMarker vector layer
        // http://leafletjs.com/examples/geojson.html
        var circle = function(geoJsonFeature,options,popup){
            L.geoJson(geoJsonFeature,{
                pointToLayer:function(feature,latlng){
                    return L.circleMarker(latlng,options
                        ).bindPopup(popup,{
                            closeButton: false,
                            offset:(0,0)
                        }).on('mouseover',function(circleMarker){
                            if (!this._popup._isOpen){
                                markerState(circleMarker.target,{color:'#0055aa',weight:2})
                            }
                        }).on('mouseout',function(circleMarker){
                            if (!this._popup._isOpen){
                                markerState(circleMarker.target)
                            }
                        })
                }
            }).addTo(view.map);
        };

        view.map.on('popupopen',function(e){
            var marker = e.popup._source;
            markerState(marker,{fillColor:'#eaac54'})
        }).on('popupclose',function(e){
            var marker= e.popup._source;
            markerState(marker);
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

                _.each(locations, function(o){
                    var popupContent = view.popup(layer,o),
                        circleOptions = {
                            radius: radius(o),
                            color:"#fff",
                            weight:1,
                            opacity:1,
                            fillColor: "#0055aa",
                            fillOpacity: 0.6
                        };
                    circle(o,circleOptions,popupContent);
                });

                (locations.length === 1) ? view.map.setZoom(4) : view.map.setZoom(2)
            }
        });
    },
    
    // Update map when switching between layer types
    updateMap: function(layer) {
        var view = this;
        view.buildMap(layer);
    },
    
    // TODO - needs update: Enable clicking on markers to choose country
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
