views.Map = Backbone.View.extend({
    initialize: function() {
        if (this.options.render) this.render();
    },
    render: function() {
        var view = this;
        // new instance of the map does not work
        if (view.map){view.map.remove()}
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

        // among all the filters find the operating unit filter
        view.opUnitFilter =_(app.app.filters).findWhere({collection:"operating_unit"});

        // Create the map with mapbox.js 1.3.1
        view.map = L.mapbox.map(this.el,TJ.id,{ //basemap tilejson is hardcoded into the site as variable TJ
            center: [0,0],
            zoom: 2,
            minZoom: TJ.minzoom,
            maxZoom: TJ.maxzoom,
            noWrap: true // TODO avoid continous world
        });

        if (_.isObject(view.opUnitFilter)){
            view.markers = new L.MarkerClusterGroup({showCoverageOnHover:false});
        } else {
            view.markers = new L.featureGroup()
        };

        view.buildLayer(layer);
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
    //UTIL calculate the radius
    radius: function(scaleResult){
        var r = Math.round(Math.sqrt(scaleResult/ Math.PI));
        return r
    },
    //UTIL format description for popup (html structure)
    popup: function(layer, data) {
        var description = '<div class="title">' + data.properties.title + '</div>' +
            '<div class="stat' + ((layer == 'count') ? ' active' : '') + '">Projects: <span class="value">' +
            data.properties.count + '</span></div>' +
            ((data.sources > 1) ? ('<div class="stat' + ((layer == 'sources') ? ' active' : '') + '">Budget Sources: <span class="value">' +
            data.properties.sources + '</span></div>') : '') +
            '<div class="stat' + ((layer == 'budget') ? ' active' : '') + '">Budget: <span class="value">' +
            accounting.formatMoney(data.properties.budget) + '</span></div>' +
            '<div class="stat' + ((layer == 'expenditure') ? ' active' : '') + '">Expenditure: <span class="value">' +
            accounting.formatMoney(data.properties.expenditure) + '</span></div>' +
            '<div class="stat' + ((layer == 'hdi') ? ' active' : '') + '">HDI: <span class="value">' +
            data.properties.hdi + '</span></div>';
        return description;
    },
    clusterPopup: function(data, g) {
        var scope = (g.scope[data.scope]) ? g.scope[data.scope].split(':')[0] : 'unknown',
            type = (g.type[data.type]) ? g.type[data.type].split(':')[0] : 'unknown',
            precision = (g.precision[data.precision]) ? g.precision[data.precision].split(' ')[0] : 'unknown';

        var description = '<div><b>Location type:</b> <span class="value">' + type + '</span></div>'
                        + '<div><b>Scope:</b> <span class="value">' + scope + '</span></div>'
                        + '<div><b>Precision:</b> <span class="value">' + precision + '</span></div>';
        return description;
    },
    buildLayer: function(layer) {

        var view = this;

        view.map.removeLayer(view.markers); //remove the marker featureGroup from view.map
        view.markers.clearLayers(); // inside of marker featureGroup, clear the layers from the previous build

        var locations = [],
            count, sources, budget, title, hdi, hdi_health, hdi_education, hdi_income,
            unit = this.collection; //unit == app.projects

        var renderClusters = function(collection){

            var filteredMarkers = [];
            _(collection.models).each(function(model){
                filteredMarkers.push(model.geojson)
            });

            filteredMarkers = _(filteredMarkers).flatten(false).filter(function(o){return _.isObject(o)}); //filter out those with no geo locations


            $.getJSON('api/subnational-locs-index.json', function(subLocIndex){ // get the 
                _(filteredMarkers).each(function(o){
                    var marker = L.marker(new L.LatLng(o.geometry.coordinates[0], o.geometry.coordinates[1]), {
                        icon: L.mapbox.marker.icon({
                            'marker-color': '0055aa',
                            'marker-size': 'small'
                        })
                    });
                    marker.bindPopup(view.clusterPopup(o, subLocIndex));
                    view.markers.addLayer(marker);
                });
            });
            view.map.addLayer(view.markers);
        };

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

        // if the operating unit filter exists, aka if it is an object
        // TODO there certain countries are not being passed in as an op unit filter (PER, LBN)
        if(_.isObject(view.opUnitFilter)){

            subs = new models.Subnationals();
            subs.fetch({
                url: 'api/units/' + view.opUnitFilter.id + '.json',
                success:function(){
                    if (subs.length <= unit.length){
                    // there are fewer projects in the subnational collection than in the unit
                    // then there's no need to filter these sub projects
                        filteredSubs = subs;
                    } else {
                    // the projects in subs need to be matched to the unit models
                    // matching subs.models and unit.models on id and set the visible ones
                        _(unit.models).each(function(model){
                            if (subs.get(model.id) != undefined){
                                subs.get(model.id).set({visible:true}
                            )}
                        })
                        filteredSubs = subs.filtered(); //update is a method in the collection
                    }
                    // create the clusters
                    renderClusters(filteredSubs);
                }
            });
            //zoom to the centroid of the country
            //view.map.setView()
        }
        // use pointToLayer to make location points into a circleMarker vector layer
        // http://leafletjs.com/examples/geojson.html
        var circle = function(geoJsonFeature,options,hoverPop){
            var brief = L.popup({closeButton:false})
                .setContent(hoverPop);
            L.geoJson(geoJsonFeature,{
                pointToLayer:function(feature,latlng){
                    return L.circleMarker(latlng,options
                        ).on('mouseover',function(circleMarker){
                            brief.setLatLng(latlng);
                            view.map.openPopup(brief);
                            markerState(circleMarker.target,{color:'#0055aa',weight:2});
                        }).on('mouseout',function(circleMarker){
                            view.map.closePopup(brief);
                            markerState(circleMarker.target);
                        }).on('click',function(e){
                            // clicking on the circle marker will re-route and trigger the opUnitFilter
                            var opUnit = e.target.feature.properties.id;
                            path = '#filter/operating_unit-' + opUnit;
                            app.navigate(path, { trigger: true });
                            $('#browser .summary').removeClass('off');
                        })
                }
            }).addTo(view.markers);
        };

        view.map.addLayer(view.markers); //add newly generated marker featureGroup to the map

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
            };
            _.each(locations, function(feature){
                var popupContent = view.popup(layer,feature),
                    circleOptions = {
                        radius: view.radius(view.scale(layer,feature)),
                        color:"#fff",
                        weight:1,
                        opacity:1,
                        fillColor: "#0055aa",
                        fillOpacity: 0.6
                    };
                circle(feature,circleOptions,popupContent);
            });
        });
    }
});
