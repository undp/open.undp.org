views.ProjectMap = Backbone.View.extend({
    events: {
        'click .map-fullscreen': 'fullscreen',
    },
    initialize: function() {
        this.summaryTemplate = _.template($('#projectMapCountrySummary').html());
        this.tooltipTemplate = _.template($('#projectMapTooltip').html());

        this.$summaryEl = $('#country-summary'),

        // photos setup
        //this.photos = [];
        //this.flickrAccts = [];

        this.nations = new Nationals();

        this.listenTo(this.nations,'sync',this.render);

        this.nations.fetch();

        _.bindAll(this,'draw','onEachFeature');//,'photosFromDocument','processSheet'
    },
    render: function() {
        // match project operating unit with operating unit index
        this.opUnit = this.nations.findWhere({
            'id':this.model.get('operating_unit_id')
        });

        // fill in country summary under the map
        this.$summaryEl.html(this.summaryTemplate({
            count: this.opUnit.get('project_count'),
            fund: this.opUnit.get('funding_sources_count'),
            budget: this.opUnit.get('budget_sum'),
            expenditure: this.opUnit.get('expenditure_sum')
        }));

        if (!this.options.embed) {
            // fire up social media spreadsheet
            //this.loadSocialSpreadsheet(this.nations.models);
            // adding faux fullscreen control
           $('#profilemap').append('<div class="full-control"><a href="#" class="icon map-fullscreen"></a></div>');
        }

        // create a cluster
        this.markers = new L.MarkerClusterGroup({
            showCoverageOnHover:false,
            maxClusterRadius:40
        });

        // create map
        this.map = L.mapbox.map(this.el,MAPID,{
            minZoom: 1,
            maxZoom: 10,
            scrollWheelZoom: this.options.embed ? false : true,
            legendControl: false
        });

        //this.map.attributionControl.addAttribution('<a href="http://www.undp.org/operations/copyright_and_termsofuse">Disclaimer</a>');

        /*if (this.model.get('document_name')) {
            this.photosFromDocument();
        }*/

        // load in necessary geography
        // and lookup jsons for drawing the map
        queue()
            .defer(util.request,'api/world.json')
            .defer(util.request,'api/india_admin0.json')
            .defer(util.request,'api/subnational-locs-index.json')
            .defer(util.request,'api/focus-area-index.json')
            .await(this.draw);
    },

    draw: function(error, world, india, subLocIndex, focusIndex){
        var view = this,
            subLocations = this.model.get('subnational');

        // if the unit has no geography do not show map
        if (!this.opUnit.lon) {
            this.$el.prev().hide();
            this.$el.next().addClass('nogeo');
            this.$el.hide();
        } else {
            var iso = parseInt(this.opUnit.get('iso_num'));
            // a list of sub location points
            var locations = _.map(subLocations,function(subLoc) {

                var markerFocus = _.find(focusIndex,function(f){
                        return f.id === subLoc.focus_area
                    });

                return {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [
                            subLoc.lon,
                            subLoc.lat
                        ]
                    },
                    properties: {
                        id: subLoc.awardID,
                        outputID: subLoc.outputID,
                        precision: subLoc.precision,
                        type: subLoc.type,
                        scope: subLoc.scope,
                        project: this.model.get('project_title'),
                        name: subLoc.name,
                        focus_area: subLoc.focus_area,
                        description: this.tooltip(subLoc, subLocIndex),
                        'marker-size': 'small',
                        'marker-color': (markerFocus != undefined) ? markerFocus.color : '#888'
                    }
                }

            },this);

            // add country outline
            if (!IE || IE_VERSION > 8){

                this.outline = new L.GeoJSON();

                var topoFeatures = topojson.feature(world, world.objects.countries).features,
                    selectedFeature = _(topoFeatures).findWhere({id:iso}),
                    coords = selectedFeature.geometry.coordinates,
                    outlineStyle = {
                        "color": "#b5b5b5",
                        "weight": 0,
                        clickable: false
                    };

                // India border
                if (iso == 356) {
                    var topoFeatures = topojson.feature(india, india.objects.india_admin0).features;

                    _(topoFeatures).each(function(feature){
                        this.outline.addData(feature)
                            .setStyle(outlineStyle);
                    },this);
                } else {
                    this.outline.addData(selectedFeature)
                        .setStyle(outlineStyle);
                }

                // Russia center
                if (iso == 643) {
                    this.map.setView([55,65],2);
                } else {
                    this.map.fitBounds(util.ctyBounds(coords));
                }

                this.outline.addTo(this.map);
            } else {
                this.map.setView([this.opUnit.lat,this.opUnit.lon],3);
            }

            // Create a geoJSON with locations
            var markerLayer = L.geoJson(locations, {
                pointToLayer: L.mapbox.marker.style,
                onEachFeature: this.onEachFeature
            });
            // Add the geoJSON to the cluster layer
            this.markers.addLayer(markerLayer);
            // Add cluster layer to map
            this.map.addLayer(this.markers);
        }
    },
    onEachFeature: function(feature, layer) {
        var view = this;
        var clusterBrief = L.popup({
                closeButton:true,
                offset: new L.Point(0,-20)
            }).setContent(feature.properties.description);

        layer.on('click',function(){
            clusterBrief.setLatLng(this.getLatLng());
            view.map.openPopup(clusterBrief);
        })
    },
    tooltip: function(loc, index) {
        return this.tooltipTemplate({
            type: index.type[loc.type],
            precision: index.precision[loc.precision],
            output: loc.outputID,
            focus_clean: (loc.focus_area_descr).replace(/\s+/g, '-').toLowerCase().split('-')[0],
            focus_area: (loc.focus_area_descr).toTitleCase()
        })
    },
    fullscreen: function(e) {
        e.preventDefault();
        var view = this;

        this.$el.toggleClass('full');
        setTimeout(function(){
            view.map.invalidateSize();
            if (view.$el.hasClass('full')) {
                view.map.zoomIn(1,{animate:false});
            } else {
                view.map.zoomOut(1,{animate:false});
            }
        }, 250);

        $('a.map-fullscreen').toggleClass('full');
        $('.country-profile').toggleClass('full');
    },
    photosFromDocument: function(){
        /*var files = _.first(this.model.get('document_name')),
            fileSrc = _.last(this.model.get('document_name'));*/
        var files = this.model.get('document_name');
        _(files[1]).each(function (file, i) {
            var chopped = file.split('.');
            var filetype = chopped[chopped.length-1].toLowerCase();
            /*	filetype,
                source;
            
            try {
                filetype = chopped[chopped.length-1].toLowerCase();
            }
            catch(err) {
                filetype = '';
            }

            source = fileSrc[i];*/

            if (filetype === 'jpg' || filetype === 'jpeg' || filetype === 'png' || filetype === 'gif') {
                this.photos.push({
                    'title': files[0][i],
                    'source': file,
                    'url': file
                });
            }
        },this);
        //console.log(this.photos);
    },
    loadSocialSpreadsheet: function(data) {
        // Get social media google spreadsheet
        var sheetId = '0Airl6dsmcbKodHB4SlVfeVRHeWoyWTdKcDY5UW1xaEE',
            sheetNum = '1';
        var sheetUrl= 'https://spreadsheets.google.com/feeds/list/'+
            sheetId + '/' + sheetNum +
            '/public/values?alt=json';

        queue()
            .defer(util.request,sheetUrl)
            .await(this.processSheet)
    },
    processSheet: function(error,spreadsheet){

        this.opUnit.twitter = '';
        this.opUnit.flickr = '';
        this.opUnit.facebook = '';

        // extract content from google spreadsheet
        // go through each row and record all the type, id, twitter, flickr, fb info
        _(spreadsheet.feed.entry).each(function(row) {
            var accountType = row.gsx$type.$t,
                accountId = row.gsx$id.$t,
                twitterAcct = row.gsx$twitter.$t,
                flickrAcct = row.gsx$flickr.$t,
                fbAcct = row.gsx$facebook.$t;

            // global and regional headquarters
            if (accountType === 'Global' || (accountType === 'HQ' && accountId === this.model.get('region_id'))) {
                if (flickrAcct) this.flickrAccts.push(flickrAcct);
                }
            // country office
            // add to the global/regional flickr and fb account array
            if (accountType === 'CO' && accountId === this.opUnit.id) {
                if (twitterAcct) {
                    this.opUnit.twitter = twitterAcct.replace('@','');
                }
                if (flickrAcct) {
                    this.flickrAccts.unshift(flickrAcct);
                    this.opUnit.flickr = flickrAcct;
                }
                if (fbAcct) {
                    this.opUnit.facebook = fbAcct;
                }
            }
        },this)

        new views.Social({
            unit: this.opUnit,
            model: this.model,
            photos: this.photos,
            allFlickr: this.flickrAccts,
        });
    }
});
