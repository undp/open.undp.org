views.Map = Backbone.View.extend({
    initialize: function() {
        if (this.options.render) this.render();
    },
    render: function() {
        var view = this;
        if (view.map){view.map.remove()} // remove previous map, same concept as view.$el.empty() for updating, http://leafletjs.com/reference.html#map-remove

        // Give map an inner shadow unless browser is IE
        var IE = $.browser.msie;
        if (!IE) view.$el.append('<div class="inner-shadow"></div>');

        // Create the map with mapbox.js 1.3.1
        view.map = L.mapbox.map(this.el,TJ.id,{ //basemap tilejson is hardcoded into the site as variable TJ
            center: [0,0],
            zoom: TJ.minzoom,
            minZoom: TJ.minzoom,
            maxZoom: TJ.maxzoom
            // worldCopyJump: true <-- buggy http://leafletjs.com/reference.html#map-worldcopyjump
        });

        // among all the filters find the operating unit filter
        view.opUnitFilter =_(app.app.filters).findWhere({collection:"operating_unit"});

        if (_.isObject(view.opUnitFilter)){
            view.markers = new L.MarkerClusterGroup({
                showCoverageOnHover:false
            });
        } else {
            view.markers = new L.featureGroup()
        };

        view.buildLayer('budget');//budget is the default layer
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
    goToLink: function(path){
        app.navigate(path, { trigger: true });
        $('#browser .summary').removeClass('off');
    },
    popup: function(layer, data) {
        var description = '<div class="title"><b>' + data.properties.title + '</b></div>' +
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
        var project = data.project,
            title = data.title,
            type = (g.type[data.type]) ? g.type[data.type].split(':')[0] : 'unknown',
            scope = (g.scope[data.scope]) ? g.scope[data.scope].split(':')[0] : 'unknown',
            precision = (g.precision[data.precision]) ? g.precision[data.precision].split(' ')[0] : 'unknown';

        var description = '<div><b>Project: </b>' + project + '</div>'
                        + '<div><b>Name: </b>' + title + '</div>'
                        + '<div><b>Location type: </b>' + type + '</div>'
                        + '<div><b>Scope: </b>' + scope + '</div>'
                        + '<div><b>Precision: </b>' + precision + '</div>';
        return description;
    },
    buildLayer: function(layer,mapFilter){
        var view = this;

        view.map.removeLayer(view.markers); //remove the marker featureGroup from view.map
        view.markers.clearLayers(); // inside of marker featureGroup, clear the layers from the previous build

        var locations = [],
            count, sources, budget, title, hdi, hdi_health, hdi_education, hdi_income,
            unit = this.collection; //unit == app.projects

        var circleHighlight = function(e,options){
            if (!options){options = {}}
            $target = e.target;
            $target.setStyle({
                color: options.color || '#fff',
                weight: options.weight || 1,
                opacity: options.opacity || 1,
                fillColor: options.fillColor || '#0055aa',
                fillOpacity: options.fillOpacity || 0.6
            })
        }

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
        }

        var renderClusters = function(collection){
            var filteredMarkers = [],
                noGeo = 0;
                hasGeo = false;

            _(collection.models).each(function(model){
                if (model.geojson){
                    hasGeo = true;
                    filteredMarkers.push(model.geojson);
                } else {
                    noGeo += 1;
                }
            });

            filteredMarkers = _(filteredMarkers).flatten(false).filter(function(o){return _.isObject(o)}); //filter out those null

            // append sub-national location paragraph directly to the DOM
            // since it is in the filter collection
            if (noGeo != 0 && !hasGeo){
                $('#description p.geography').html(' None of these projects have associated geography.');
            } else if (noGeo != 0 && hasGeo){
                var noGeoParagraph = " <b>" + noGeo
                    + "</b> of them do not have associated geography; the remaining <b>"
                    + (filteredSubs.length - noGeo)
                    + "</b> have <b>"
                    + filteredMarkers.length
                    + "</b> sub-national locations in total."
                $('#description p.geography').html(noGeoParagraph);
            }

            // create clustered markers
            $.getJSON('api/subnational-locs-index.json', function(subLocIndex){
                var markerOptions = {
                    'marker-color': '0055aa',
                    'marker-size': 'small'
                    };

                var filteredMarkersLayer = L.geoJson({
                    "type":"FeatureCollection",
                    "features":filteredMarkers
                }, {
                    filter: function(feature, layer, filter) { // only two cases for type, hard code is fine
                        var subFilter = mapFilter || "0";
                        if (subFilter === "0"){
                            return feature.properties
                        } else {
                            return feature.properties['type'] === subFilter
                        }
                    },
                    pointToLayer: function(feature,latlon){
                        return L.marker(latlon,{
                            icon: L.mapbox.marker.icon(markerOptions) // use MapBox style markers
                        })
                    },
                    onEachFeature: function (feature, layer) {
                        var clusterBrief = L.popup({
                                closeButton:false,
                                offset: new L.Point(0,-20)
                            }).setContent(view.clusterPopup(feature.properties, subLocIndex));
                        layer.on('mouseover',function(){
                            clusterBrief.setLatLng(this.getLatLng());
                            view.map.openPopup(clusterBrief);
                        }).on('mouseout',function(){
                            view.map.closePopup(clusterBrief);
                        }).on('click',function(){
                            path = '#project/'+ feature.properties.project
                            view.goToLink(path);
                        });
                    }
                });
                view.markers.addLayer(filteredMarkersLayer);
            });
        };

        var circle = function(geoJsonFeature,options,hoverPop){
            var brief = L.popup({
                    closeButton:false
                }).setContent(hoverPop);
            var circleLayer = L.geoJson(geoJsonFeature,{
                pointToLayer:function(feature,latlng){
                    return L.circleMarker(latlng,options
                        ).on('mouseover',function(circleMarker){
                            brief.setLatLng(latlng);
                            view.map.openPopup(brief);
                            circleHighlight(circleMarker,{color:'#0055aa',weight:2});
                        }).on('mouseout',function(circleMarker){
                            view.map.closePopup(brief);
                            circleHighlight(circleMarker);
                        }).on('click',function(e){
                            path = '#filter/operating_unit-' + e.target.feature.properties.id;
                            view.goToLink(path);
                        })
                }
            });
            view.markers.addLayer(circleLayer);
        };

        view.map.addLayer(view.markers);

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
            _(locations).each(function(feature){
                var popupContent = view.popup(layer,feature),
                    circleOptions = {
                        radius: view.radius(view.scale(layer,feature)),
                        color:"#fff",
                        weight:1,
                        opacity:1,
                        fillColor: "#0055aa",
                        fillOpacity: 0.6
                    };
                if (locations.length > 1){
                    circle(feature,circleOptions,popupContent)
                } else if (locations.length === 1 ){
                    view.map.setView([
                        locations[0].geometry.coordinates[1],
                        locations[0].geometry.coordinates[0]
                    ],3);
                }
            });
        });
    }
});
