views.ProjectMap = Backbone.View.extend({
    events: {
        'click .map-fullscreen': 'fullscreen',
    },
    initialize: function() {
        if (this.options.render) this.render();
    },
    tooltip: function(data, g) {
        var //scope = g.scope[data.scope',
            type = g.type[data.type],
            precision = g.precision[data.precision],
            output = data.outputID,
            focus_clean = (data.focus_area_descr).replace(/\s+/g, '-').toLowerCase().split('-')[0],
            focus_area = (data.focus_area_descr).toTitleCase();

        var description =  '<div class="popup top">'
                        + '<table><tr><td>Output</td><td>' + output + '</td></tr></table>'  
                         + '<div class="focus"><span class="'+focus_clean+'"></span><p class="space">' + focus_area + '<p></div></div>'
                        //+ '<div><b>Scope:</b> <span class="value">' + scope + '</span></div>'
                        + '<div class="popup bottom"><div><b>Location type:</b> <span class="value">' + type + '</span></div>'
                        + '<div><b>Precision:</b> <span class="value">' + precision + '</span></div></div>';
        return description;
    },
    render: function() {
        var view = this,
            locations = [],
            unit = this.model.get('operating_unit_id'),
            subLocations = this.model.get('subnational'),
            wheelZoom = true;
            
            // adding faux fullscreen control
         if (!view.options.embed) {
           $('#profilemap').append('<div class="full-control"><a href="#" class="icon map-fullscreen"></a></div>');
        } else {
            wheelZoom = false;
        }
        // create a cluster
        view.markers = new L.MarkerClusterGroup({
            showCoverageOnHover:false,
            maxClusterRadius:40
        });
        // create map
        view.map = L.mapbox.map(this.el,TJ.id,{
            minZoom: 1,
            maxZoom: 10,
            scrollWheelZoom: wheelZoom
            });

        
        $.getJSON('api/operating-unit-index.json', function(data) {
            for (var i = 0; i < data.length; i++) {
                var o = data[i];
                if (o.id === unit) {
                    if (!view.options.embed) view.getwebData(o);
                    $('#country-summary').html(templates.ctrySummary(o));

                    if (!o.lon) {// if the unit has no geography
                        view.$el.prev().hide();
                        view.$el.next().addClass('nogeo');
                        view.$el.hide();
                    } else {
                        var iso = parseInt(o.iso_num);
                            // second try
                            if (!IE || IE_VERSION > 8){
                            view.outline = new L.GeoJSON();
                            $.getJSON('api/world-50m-s.json',function(world){
                                var topoFeatures = topojson.feature(world, world.objects.countries).features,
                                    selectedFeature = _(topoFeatures).findWhere({id:iso}),
                                    coords = selectedFeature.geometry.coordinates,
                                    outlineStyle = {
                                            "color": "#b5b5b5",
                                            "weight": 0,
                                            clickable: false
                                    };
                                if (iso == 356) {
                                   $.getJSON('api/india_admin0.json',function(india){
                                        var topoFeatures = topojson.feature(india, india.objects.india_admin0).features;
                                        _(topoFeatures).each(function(f){
                                            view.outline.addData(f)
                                                .setStyle(outlineStyle);
                                        });
                                    });
                                } else {
                                    view.outline.addData(selectedFeature)
                                        .setStyle(outlineStyle);
                                }

                                if (iso == 643) {
                                    view.map.setView([55,65],2);
                                } else {
                                    view.map.fitBounds(ctyBounds(coords));
                                }

                                view.outline.addTo(view.map);
                            });
                        } else {
                            view.map.setView([o.lat,o.lon],3);
                        }
                        var markerOptions = {
                            'marker-size': 'small'
                        };
                        
                        $.getJSON('api/subnational-locs-index.json', function(g) {
                             $.getJSON('api/focus-area-index.json', function(focusIndex){
                                _(subLocations).each(function(o) {
                                    var markerColor;
                                    _(focusIndex).each(function(f){
                                        if (f.id == o.focus_area){
                                            return markerColor = f.color;
                                        };
                                    });
 
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
                                            id: o.awardID,
                                            outputID: o.outputID,
                                            precision: o.precision,
                                            type: o.type,
                                            scope: o.scope,
                                            project: view.model.get('project_title'),
                                            name: o.name,
                                            focus_area: o.focus_area,
                                            description: view.tooltip(o, g),
                                            'marker-size': 'small',
                                            'marker-color': markerColor
                                        } 
                                    });
                                });
                        
                                function onEachFeature(feature, layer) {
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
                                            closeButton:false,
                                            offset: new L.Point(0,-20)
                                        }).setContent(feature.properties.description);
                                    layer.on('mouseover',function(){
                                        clusterBrief.setLatLng(this.getLatLng());
                                        view.map.openPopup(clusterBrief);
                                        layer.setIcon(L.mapbox.marker.icon(newOptions));
                                    }).on('mouseout',function(){
                                        view.map.closePopup(clusterBrief);
                                        layer.setIcon(L.mapbox.marker.icon(oldOptions));
                                    })
                                }
                                
                                // Create a geoJSON with locations
                                var markerLayer = L.geoJson(locations, {
                                    pointToLayer: L.mapbox.marker.style,
                                    onEachFeature: onEachFeature
                                });
                                // Add the geoJSON to the cluster layer
                                view.markers.addLayer(markerLayer);
                                // Add cluster layer to map
                                view.map.addLayer(view.markers);
                            });
                        });
                    }
                }
            }
        });
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
        $.getJSON('//spreadsheets.google.com/feeds/list/0Airl6dsmcbKodHB4SlVfeVRHeWoyWTdKcDY5UW1xaEE/1/public/values?alt=json-in-script&callback=?', function(g) {
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
        });

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
                'data-url='      + tweetButton["data-url"]       + ' ' +
                'data-hashtags=' + tweetButton["data-hashtags"]  + ' ' +
                'data-text='     + tweetButton["data-text"]      + ' ' +
                'data-counturl=' + tweetButton["data-counturl"]  + ' ' +
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

    flickr: function(account, photos) {
        var apiBase = 'http://api.flickr.com/services/rest/?format=json&jsoncallback=?&method=',
            apiKey = '1da8476bfea197f692c2334997c10c87', //from UNDP's main account (unitednationsdevelopmentprogramme)
            search = this.model.get('project_id'),
            attempt = 0,
            i = 0,
            $el = $('#flickr');

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
                    console.log('loaded')
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
