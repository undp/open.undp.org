views.ProjectMap = Backbone.View.extend({
    events: {
        'click .map-fullscreen': 'fullscreen',
    },
    template:_.template($('#projectMapCountrySummary').html()),
    initialize: function() {
        this.$summaryEl = $('#country-summary');

        this.nations = new Nationals();

        this.listenTo(this.nations,'sync',this.render);

        this.nations.fetch();

        _.bindAll(this,'draw','onEachFeature');
    },
    render: function() {
        var view = this,
            wheelZoom = true;

        // match project operating unit with operating unit index
        this.opUnit = this.nations.findWhere({
            'id':this.model.get('operating_unit_id')
        });
        // fill in country summary
        this.$summaryEl.html(this.template({
            count: this.opUnit.get('project_count'),
            fund: this.opUnit.get('funding_sources_count'),
            budget: this.opUnit.get('budget_sum'),
            expenditure: this.opUnit.get('expenditure_sume')
        }));

        if (!this.options.embed) {
            // fire up social media spreadsheet
            this.getwebData(this.nations.models);
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
        var oldOptions = {
            'marker-size':'small',
            'marker-color':feature.properties['marker-color']
        }
        var newOptions = {
            'marker-size':'small',
        }
        var newColors = [
            {'color': '689A46', 'id': '4'},
            {'color': '218DB6', 'id': '2'},
            {'color': 'AAA922', 'id': '1'},
            {'color': 'D15A4B', 'id': '3'}
        ]
        // Match focus area ID to newColors array
        _(newColors).each(function(color){
            if (color.id == feature.properties.focus_area){
               return newOptions['marker-color'] = color.color;
            };
        })
        var clusterBrief = L.popup({
                closeButton:true,
                offset: new L.Point(0,-20)
            }).setContent(feature.properties.description);
        layer.on('click',function(){
            clusterBrief.setLatLng(this.getLatLng());
            this.map.openPopup(clusterBrief);
            layer.setIcon(L.mapbox.marker.icon(newOptions));
        }).on('mouseout',function(){
            layer.setIcon(L.mapbox.marker.icon(oldOptions));
        })
    },
    tooltip: function(data, g) {
        var type = g.type[data.type],
            precision = g.precision[data.precision],
            output = data.outputID,
            focus_clean = (data.focus_area_descr).replace(/\s+/g, '-').toLowerCase().split('-')[0],
            focus_area = (data.focus_area_descr).toTitleCase();

        var description =  '<div class="popup top">'
                        + '<table><tr><td>Output</td><td>' + output + '</td></tr></table>'  
                         + '<div class="focus"><span class="'+focus_clean+'"></span><p class="space">' + focus_area + '<p></div></div>'
                        + '<div class="popup bottom"><div><b>Location type:</b> <span class="value">' + type + '</span></div>'
                        + '<div><b>Precision:</b> <span class="value">' + precision + '</span></div></div>';
        return description;
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
    getwebData: function(data) {
        var view = this,
            photos = [],
            coContact = {
                twitter: [],
                flickr: [],
                facebook: []
            };

        // Get social media accounts from UNDP-maintained spreadsheet
        var spreadsheet = '//spreadsheets.google.com/feeds/list/0Airl6dsmcbKodHB4SlVfeVRHeWoyWTdKcDY5UW1xaEE/1/public/values?alt=json-in-script&callback=?';

        queue()
            .defer($.getJSON,spreadsheet)
            .await(view.socialReady);

        function contacts(allSocialAccts) {
            var accts = ['web','email','twitter','flickr','facebook'],
                pageUrl = "http%3A%2F%2Fopen.undp.org%2F%23project/"+view.model.get('project_id'),
                pageUrl = BASE_URL + "#project/" + view.model.get('project_id'),
                socialBaseUrl = '';
                tweetButton = {
                    "data-url": '"' + pageUrl + '"',
                    "data-hashtags": '"project' + view.model.get('project_id') + '"',
                    "data-text": '"' + view.model.get('project_title').toLowerCase().toTitleCase() + '"',
                    "data-via":"",
                    "data-counturl": '"' + pageUrl + '"'
                },
                followButton = '',
                tweetScript = '<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>';

            // looping through all five possible social accounts
            _(accts).each(function(acct) {
                var link = '',
                    i = 0;

                if (acct == 'twitter') socialBaseUrl = 'http://twitter.com/';
                if (acct == 'email') socialBaseUrl = 'mailto:';
                if (acct == 'flickr') socialBaseUrl = 'http://flickr.com/photos/';

                // hide unit contact if there's no social media accounts available
                if ((_.flatten(_.values(allSocialAccts)).length)) {
                    _(allSocialAccts[acct]).each(function() {
                        i += 1;
                        link += '<a target="_blank" href="' + socialBaseUrl + allSocialAccts[acct] + '">' +
                                ((acct == 'twitter') ? '@' + allSocialAccts[acct] : allSocialAccts[acct]) + '</a>';
                        if (i < allSocialAccts[acct].length) link += ', ';

                        // populate: via @country-office to tweet button
                        // and follow button
                        if (acct=='twitter'){
                            tweetButton["data-via"] = allSocialAccts[acct][0];
                            followButton = '<a href="https://twitter.com/'+ allSocialAccts[acct][0] + '" class="twitter-follow-button" data-show-count="true">Follow @' + allSocialAccts[acct][0] + '</a>'
                        }
                    })
                } else if (data[acct]) {
                    link += '<a target="_blank" href="' + data[acct] + '">' + data[acct] + '</a>';
                }

                if (link.length > 0) {
                    $('#unit-contact .contact-info').append(
                        '<li class="row-fluid">' +
                            '<div class="label">' +
                                '<p>' + ((acct == 'web') ? 'Website' : acct.capitalize()) +'</p>' +
                            '</div>' +
                            '<div>' +
                                '<p>' + link + '</p>' +
                            '</div>' +
                        '</li>'
                    );
                }
            });

            $('#tweet-button').append(
                '<a href="https://twitter.com/share" class="twitter-share-button" ' +
                'data-count="none"' +
                'data-url='      + tweetButton["data-url"]       + ' ' +
                'data-hashtags=' + tweetButton["data-hashtags"]  + ' ' +
                'data-text='     + tweetButton["data-text"]      + ' ' +
                //'data-counturl=' + tweetButton["data-counturl"]  + ' ' +
                'data-via='      + ((tweetButton["data-via"].length) ? tweetButton["data-via"] : "OpenUNDP") + ' ' +
                '></a>' +
                followButton +
                tweetScript
            );

            if (data['email'] || data['web'] || (_.flatten(_.values(allSocialAccts)).length)) {
                $('#unit-contact').show();
                $('#unit-contact h3').html('Contact UNDP ' + data.name);
            } else {
                $('#unit-contact').hide();
            }
        }
    },

    socialReady: function(g){
        var twitterAcct,
            flickrAccts = [],
            fbAccts = [],
            q = queue(1);

        q.defer(function(cb) {
            _(g.feed.entry).each(function(row) {
                var acctType = row.gsx$type.$t,
                    acctId = row.gsx$id.$t,
                    twitterAcct = row.gsx$twitter.$t,
                    flickrAcct = row.gsx$flickr.$t,
                    fbAcct = row.gsx$facebook.$t;

                if (acctType === 'Global' || (acctType === 'HQ' && acctId === view.model.get('region_id'))) {
                    if (flickrAcct) flickrAccts.push(flickrAcct);
                    if (fbAcct) fbAccts.push(fbAcct);
                    }
                if (acctType === 'CO' && acctId === data.id) {
                    if (twitterAcct) {
                        coContact.twitter.push(twitterAcct.replace('@',''));
                    }
                    if (flickrAcct) {
                        flickrAccts.unshift(flickrAcct);
                        coContact.flickr.push(flickrAcct);
                    }
                    if (fbAcct) {
                        fbAccts.unshift(fbAcct);
                        coContact.facebook.push(fbAcct);
                    }
                }
            });
            contacts(coContact);
            cb();
        });
        
        // Gather photos from documents and flickr, in that order
        q.defer(function(cb) {
            if (that.model.get('document_name')) {
                _(that.model.get('document_name')[0]).each(function (photo, i) {
                    try {
                        var filetype = photo.split('.')[1].toLowerCase();
                    }
                    catch(err) {
                        var filetype = '';
                    }
                    var source = that.model.get('document_name')[1][i];
                        
                    if (filetype === 'jpg' || filetype === 'jpeg' || filetype === 'png' || filetype === 'gif') {
                        var img = new Image();
                        photos.push({
                            'title': photo.split('.')[0],
                            'source': source,
                            'image': img
                        });
                        img.src = source;
                    }
                });
            }

            cb();
        });
        q.await(function() {
            view.flickr(flickrAccts,photos);
        }); 
    },

    flickr: function(account, photos) {
        var apiBase = 'https://api.flickr.com/services/rest/?format=json&jsoncallback=?&method=',
            apiKey = '1da8476bfea197f692c2334997c10c87', //from UNDP's main account (unitednationsdevelopmentprogramme)
            attempt = 0,
            i = 0,
            $el = $('#flickr'),
            tagCollection = [],
            search;

        tagCollection.push(this.model.get('project_id'));
        _.each(this.model.get('outputs'),function(output){
            tagCollection.push(output["output_id"]);
        });
        _.each(tagCollection, function(tag){
            var noZero = parseInt(tag);
            tagCollection.push(noZero);
        });

        search = tagCollection.join(',');

        if (!account.length && photos.length) { // show photos from the document
            $el.show();
            loadPhoto(i);
        } else {
            _(account).each(function(acct) {
                // Get user info based on flickr link
                $.getJSON(apiBase + 'flickr.urls.lookupUser&api_key=' + apiKey + '&url=http://www.flickr.com/photos/' + acct, function(f) {
                    searchPhotos(f.user.id, search);
                });
            });
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
