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
        view.markers = new L.featureGroup();

        // Create the map with mapbox.js 1.3.1
        view.map = L.mapbox.map(this.el,TJ.id,{ //basemap tilejson is hardcoded into the site as variable TJ
            center: [0,0],
            zoom: 2,
            minZoom: TJ.minzoom,
            maxZoom: TJ.maxzoom,
            noWrap: true // TODO avoid continous world
        });
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
    //UTIL set popup description and return the radius for circles
    buildLayer: function(layer) {

        var view = this,
            locations = [],
            count, sources, budget, title, hdi, hdi_health, hdi_education, hdi_income,
            unit = this.collection; //unit also == app.projects

        view.map.removeLayer(view.markers); //remove the marker featureGroup from view.map
        view.markers.clearLayers(); // inside of marker featureGroup, clear the layers from the previous build

         // among all the filters find the operating unit filter
        var opUnitFilter =_(app.app.filters).findWhere({collection:"operating_unit"});

        // if the operating unit filter exists, aka if it is an object
        if(_.isObject(opUnitFilter)){

            var renderClusters = function(){
                var cluster = new L.MarkerClusterGroup();
            };

            subs = new models.Subnationals();
            subs.fetch({
                url:"/api/units-temp/AFG.json", // placeholder, the actually url will be 'api/units/' + opUnitFilter.id + '.json'
                success:function(){
                    if (subs.length <= unit.length){
                    // there are fewer projects in the subnational collection than in the unit
                        filteredSubs = subs;
                    } else {
                    // the projects in subs need to be matched to the unit models
                    // matching subs.models and unit.models on id and set the visible ones
                    _(unit.models).each(function(model){
                        if (subs.get(model.id) != undefined){subs.get(model.id).set({visible:true})}
                    })
                        filteredSubs = subs.update();
                    }
                }
            });
        }
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
        // use pointToLayer to make location points into a circleMarker vector layer
        // http://leafletjs.com/examples/geojson.html
        var circle = function(geoJsonFeature,options,hoverPop,clickPop){
            var brief = L.popup({closeButton:false})
                .setContent(hoverPop);
            L.geoJson(geoJsonFeature,{
                pointToLayer:function(feature,latlng){
                    return L.circleMarker(latlng,options
                        ).bindPopup(clickPop,  {
                            closeButton:false,
                            offset:new L.Point(-10,100) //offset has centering problem? or is this related to the circle radius?
                        }).on('mouseover',function(circleMarker){
                            brief.setLatLng(latlng);
                            view.map.openPopup(brief);
                            if (!this._popup._isOpen){ //if the popup of the layer is not open
                                markerState(circleMarker.target,{color:'#0055aa',weight:2});
                            }
                        }).on('mouseout',function(circleMarker){
                            view.map.closePopup(brief);
                            if (!this._popup._isOpen){
                                markerState(circleMarker.target);
                            }
                        })
                }
            }).addTo(view.markers);
        };

        view.map.addLayer(view.markers); //add newly generated marker featureGroup to the map

        view.map.on('popupopen',function(e){
            var marker = e.popup._source; // marker is the layer the popup is bound to, only applicable to those that used bindPopup()
            if (marker != undefined){markerState(marker,{fillColor:'#eaac54'})} //undefined means the popup does not have a marker it is attached to
        }).on('popupclose',function(e){
            var marker= e.popup._source;
            if (marker != undefined){markerState(marker);}
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
            if (locations.length !==0 && locations.length !==1 ) {
                _.each(locations, function(o){
                    var country = o.properties.title,
                        popupContent = view.popup(layer,o),
                        circleOptions = {
                            radius: view.radius(view.scale(layer,o)),
                            color:"#fff",
                            weight:1,
                            opacity:1,
                            fillColor: "#0055aa",
                            fillOpacity: 0.6
                        };
                    circle(o,circleOptions,country,popupContent);
                });
            }
        });
    }
});
