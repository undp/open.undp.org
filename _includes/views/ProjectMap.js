views.ProjectMap = Backbone.View.extend({
    events: {
        'click .map-fullscreen': 'fullscreen',
    },
    initialize: function() {
        this.summaryTemplate = _.template($('#projectMapCountrySummary').html()),
        this.tooltipTemplate = _.template($('#projectMapTooltip').html());
        this.contactTemplate = _.template($('#contactInfo').html());

        this.$summaryEl = $('#country-summary');
        this.$contactEl = $('#unit-contact'); // originated in Nav.js

        this.nations = new Nationals();

        this.listenTo(this.nations,'sync',this.render);

        this.nations.fetch();

        _.bindAll(this,'draw','onEachFeature','photosFromDocument','socialReady','flickr');
    },
    render: function() {
        var view = this,
            wheelZoom = true;

        // match project operating unit with operating unit index
        this.opUnit = this.nations.findWhere({
            'id':this.model.get('operating_unit_id')
        });
        // fill in country summary
        this.$summaryEl.html(this.summaryTemplate({
            count: this.opUnit.get('project_count'),
            fund: this.opUnit.get('funding_sources_count'),
            budget: this.opUnit.get('budget_sum'),
            expenditure: this.opUnit.get('expenditure_sume')
        }));

        // this.$contactEl.html(this.contactTemplate({
        //     unit: this.opUnit.get('name'),
        //     website: this.opUnit.get('web'),
        //     email: this.opUnit.get('email')
        // }))

        if (!this.options.embed) {
            // fire up social media spreadsheet
            this.loadSocialSpreadsheet(this.nations.models);
            // adding faux fullscreen control
           $('#profilemap').append('<div class="full-control"><a href="#" class="icon map-fullscreen"></a></div>');
        } else {
            wheelZoom = false;
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
            scrollWheelZoom: wheelZoom
        });

        if (this.model.get('document_name')) {
            this.photosFromDocument();
        }

        // load in necessary geography
        // and lookup jsons for drawing the map
        queue()
            .defer(util.request,'api/world.json')
            .defer(util.request,'api/india_admin0.json')
            .defer(util.request,'api/subnational-locs-index.json')
            .defer(util.request,'api/focus-area-index.json')
            .await(this.draw);
    },

    draw: function(error, world, india,subLocIndex,focusIndex){
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
            var locations = _(subLocations).map(function(subLoc) {

                var markerColor = _(focusIndex).find(function(f){
                    return f.id === subLoc.focus_area
                    }).color

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
                        'marker-color': markerColor
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
                    _(topoFeatures).each(function(f){
                        this.outline.addData(f)
                            .setStyle(outlineStyle);
                    });
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

        view.$el.toggleClass('full');
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
    // TODO change photo array into this.photos
    photosFromDocument: function(){
        var files = _.first(this.model.get('document_name')),
            fileSrc = _.last(this.model.get('document_name'));
            this.photos = [];

        _(files).each(function (file, i) {
            var filetype,
                source;

            try {
                filetype = file.split('.')[1].toLowerCase();
            }
            catch(err) {
                filetype = '';
            }

            source = fileSrc[i];

            if (filetype === 'jpg' || filetype === 'jpeg' || filetype === 'png' || filetype === 'gif') {
                var img = new Image();
                img.src = source;

                this.photos.push({
                    'title': photo.split('.')[0],
                    'source': source,
                    'image': img
                });
            }
        });
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
            .await(this.socialReady)
    },
    socialReady: function(error,spreadsheet){
        var flickrAccts = [],
            fbAccts = [];

        this.opUnit.twitter = '';
        this.opUnit.flickr = '';
        this.opUnit.facebook = '';

        var spreadsheetContent = spreadsheet.feed.entry;

        // extract content from google spreadsheet
        _(spreadsheetContent).each(function(row) {
            var accountType = row.gsx$type.$t,
                accountId = row.gsx$id.$t,
                twitterAcct = row.gsx$twitter.$t,
                flickrAcct = row.gsx$flickr.$t,
                fbAcct = row.gsx$facebook.$t;

            // global and regional headquarters
            if (accountType === 'Global' || (accountType === 'HQ' && accountId === this.model.get('region_id'))) {
                if (flickrAcct) flickrAccts.push(flickrAcct);
                if (fbAccts) fbAccts.push(fbAcct);
                }
            // country office
            // add to the global/regional flickr and fb account array
            if (accountType === 'CO' && accountId === this.model.id) {
                if (twitterAcct) {
                    unitContact.twitter = twitterAcct.replace('@','');
                }
                if (flickrAcct) {
                    flickrAccts.unshift(flickrAcct);
                    unitContact.flickr = flickrAcct;
                }
                if (fbAcct) {
                    fbAccts.unshift(fbAcct);
                    unitContact.facebook = fbAcct;
                }
            }
        },this);

        var pageUrl = BASE_URL + "#project/" + this.model.get('project_id'),
            flickrBaseUrl = 'https://flickr.com/photos/',
            fbBaseUrl = 'https://facebook.com/';

        var twitterBaseUrl = 'https://twitter.com/',
            tweetScript = '<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>';
            tweetButton = {
                'url': pageUrl,
                'hashtags': 'project' + this.model.get('project_id'),
                'text': this.model.get('project_title').toLowerCase().toTitleCase(),
                'via':this.opUnit.twitter.length > 0 ? this.opUnit.twitter  : '',
            };

        // tweetButton["data-via"] = unitContact)[acct][0];
        // followButton = '<a href="https://twitter.com/'+ unitContact)[acct][0] + '" class="twitter-follow-button" data-show-count="true">Follow @' + unitContact)[acct][0] + '</a>'


        $('#tweet-button').append(
            '<a href="https://twitter.com/share" class="twitter-share-button" ' +
            'data-count="none"' +
            'data-url='      + tweetButton.url       + ' ' +
            'data-hashtags=' + tweetButton.hashtags  + ' ' +
            'data-text='     + toString(tweetButton.text)      + ' ' +
            'data-via='      + ((tweetButton.via.length) ? tweetButton.via : "OpenUNDP") + ' ' +
            '></a>' +
            // followButton +
            tweetScript
        );

        // queue(1).await(function() {
        //     this.flickr(flickrAccts);
        // }); 
    },
    flickr: function(account) {
        var apiBase = 'https://api.flickr.com/services/rest/?format=json&jsoncallback=?&method=',
            apiKey = '1da8476bfea197f692c2334997c10c87', //from UNDP's main account (unitednationsdevelopmentprogramme)
            attempt = 0,
            i = 0,
            $el = $('#flickr'),
            search;

        // get ouput id for flickr tag
        var tagCollection = _.map(this.model.get('outputs'),function(output){
            return output['ouput_id']
        });
        // get project id for flickr tag
        tagCollection.push(this.model.get('project_id'));

        // turn all tags into numbers -- TODO necessary?
        tagCollection = _.map(tagCollection,function(num){
            return parseInt(num)
        })

        search = tagCollection.join(',');

        if (!account.length && this.photos.length) { // no flickr account but document contains photos
            $el.show();
            loadPhoto(i);
        } else if (account.length){
            _(account).each(function(acct) {
                // Get user info based on flickr link
                $.getJSON(apiBase + 'flickr.urls.lookupUser&api_key=' + apiKey + '&url=http://www.flickr.com/photos/' + acct, function(f) {
                    searchPhotos(f.user.id, search);
                });
            });
        } else {
            return false
        }

        // Search Flickr based on project ID.
        function searchPhotos(id, tags) {
            attempt += 1;
            $.getJSON(apiBase + 'flickr.photos.search&api_key=' + apiKey + '&user_id=' + id + '&tags=' + tags,
                function(f) {
                    if (f.photos.total != '0') {
                        photos = photos.concat(f.photos.photo);
                    }
                    if (attempt == account.length) {
                        if (photos.length) {
                            $el.show();
                            loadPhoto(i);
                        }
                    }
                }
            );
        }

        // Load single photo from array
        function loadPhoto(x) {
            $el.find('.meta').hide();

            if (x === 0) $('.control.prev', $el).addClass('inactive');
            if (x === photos.length - 1) $('.control.next', $el).addClass('inactive');

            if (photos[x].id) {
                var photoid = photos[x].id,
                    source,
                    attempt = 0;
                // Get photo info based on id
                $.getJSON(apiBase + 'flickr.photos.getInfo&api_key=' + apiKey + '&photo_id=' + photoid, function(info) {

                    var description = info.photo.description._content,
                        date = (new Date(info.photo.dates.taken)).toLocaleDateString(),
                        url = info.photo.urls.url[0]._content;

                    // Get available sizes
                    $.getJSON(apiBase + 'flickr.photos.getSizes&api_key=' + apiKey + '&photo_id=' + photoid, function(s) {
                        getSize('Medium 800');
                        function getSize(sizeName) {
                            _(s.sizes.size).each(function(z) {
                                if (z.label == sizeName) {
                                    source = z.source;
                                }
                            });

                            if (!source) {
                                attempt += 1;
                                switch (attempt) {
                                    case 1:
                                        getSize('Medium 640');
                                        break;
                                    case 2:
                                        getSize('Large');
                                        break;
                                    case 3:
                                        getSize('Original');
                                        break;
                                }
                            }
                        }

                        // Fill in date & description
                        $('.meta', $el).show().html('<div class="meta-inner"><span class="date">' + date + '</span>' +
                            '<p>' + description +
                            '<a href="' + url + 'in/photostream/" title="See our photos on Flickr"> Source</a></p></div>');

                        insertPhoto(source);
                    });
                });

            } else if (photos[x].date) {
                $('.meta', $el).show().html('<div class="meta-inner"><span class="date">' + photos[x].date.toLocaleDateString() + '</span>' +
                    '<p>' + photos[x].description +
                    '<a href="' + photos[x].link + '/in/photostream/" title="See our photos on Flickr"> Source</a></p></div>');

                insertPhoto(photos[x].source);
            } else {
                $('.meta-inner', $el).empty();
                insertPhoto(photos[x].source);
            }

        }
        function insertPhoto(src){
            $el.find('.spin').spin({ color:'#000' });
            $el.find('img')
                .attr('src',src)
                .addClass('in')
                .on('load',function(){
                    $el.find('.spin').remove();
                })
        }

        // Cycle through photo array
        $('.control.next', $el).click(function(e) {
            e.preventDefault();
            if (!$('.next', $el).hasClass('inactive')) {
                if (i === 0) {
                    $('.control.prev', $el).removeClass('inactive');
                }
                i += 1;
                if (i == photos.length - 1) {
                    $('.control.next', $el).addClass('inactive');
                }
                loadPhoto(i);
            }
        });
        $('.control.prev', $el).click(function(e) {
            e.preventDefault();
            if (!$('.control.prev', $el).hasClass('inactive')) {
                if (i === photos.length - 1) {
                    $('.control.next', $el).removeClass('inactive');
                }
                i -= 1;
                if (i === 0) {
                    $('.control.prev', $el).addClass('inactive');
                }
                loadPhoto(i);
            }
        });
    }
});
