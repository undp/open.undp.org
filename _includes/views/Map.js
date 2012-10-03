views.Map = Backbone.View.extend({
    events: {
        'click .map-fullscreen': 'fullscreen'
    },
    initialize: function() {
        this.render();

        if (this.collection) {
            this.collection.on('update', this.render, this);
        }
    },
    render: function() {
        $('#chart-hdi').css('display','none');
        var that = this,
            unit = (this.collection) ? this.collection 
                : this.model.get('operating_unit_id');
        
        // Get HDI data
        $.getJSON('api/hdi.json', function(data) {
        
            var hdiWorld = _.find(data,function(d){return d.name == 'World';});
        
            var hdiArray = _.reduce(data, function(res,obj) {
                if ((_.isObject(unit)) ? unit.operating_unit[obj.id] : obj.id === unit) {
                    res[obj.id] = {
                        hdi: obj.hdi,
                        health: obj.health,
                        education: obj.education,
                        living: obj.income,
                        rank: obj.rank
                    };
                }
                return res;
            }, {});
            
            if (that.collection) {
                that.collection.hdi = hdiArray;
                that.collection.hdiWorld = hdiWorld;
                if ($('#operating_unit .filter').hasClass('active')) {
                    var hdi = _.filter(data, function(d) {
                        return d.id == _.keys(unit.operating_unit);
                    });
                    
                    $('.map-btn[data-value="hdi"] .date').empty();
                    if (_.size(hdiArray) > 0) {
                        $('#hdi').html(hdi[0].hdi);
                        that.hdiChart(hdi[0],hdiWorld);
                    } else {
                        $('#hdi').html('no data').css('color','#ccc');
                    }
                } else {
                    $('#hdi').html(hdiWorld.hdi).css('color','#265F91');
                    $('.map-btn[data-value="hdi"] .date').html('World');
                }
            } else {
                that.model.set('hdi',hdiArray[unit]);
                that.model.set('hdiWorld',hdiWorld);
            }
            
            //(that.collection) ? that.collection.hdi = hdiArray : that.model.set('hdi',hdiArray[unit]);
            //(that.collection) ? that.collection.hdiWorld = hdiWorld : that.model.set('hdiWorld',hdiWorld);
        }).success(function() {
            //if (!that.map) {
                that.$el.empty().append('<div class="inner-shadow"></div>');
                that.buildMap($('.map-btn.active').attr('data-value') || 'budget');
            //} else {
            //    that.updateMap($('.map-btn.active').attr('data-value'));
            //}
        });
        
        return this;
    },
    hdiChart: function(country,world) {
        $('#chart-hdi').css('display','block');
        $('.data', '#chart-hdi').empty().append(
            '<div class="total" style="width:' + country.hdi*100 + '%">' + country.hdi + '</div>'
            + '<div class="subdata total" style="width:' + world.hdi*100 + '%;"></div>'
            + '<div class="health" style="width:' + country.health*100 + '%">' + country.health + '</div>'
            + '<div class="subdata health" style="width:' + world.health*100 + '%;"></div>'
            + '<div class="education" style="width:' + country.education*100 + '%">' + country.education + '</div>'
            + '<div class="subdata education" style="width:' + world.education*100 + '%;"></div>'
            + '<div class="living" style="width:' + country.income*100 + '%">' + country.income + '</div>'
            + '<div class="subdata living" style="width:' + world.income*100 + '%;"></div>'
        );
        $('#chart-hdi .rank').html(country.rank);
    },
    scale: function(cat,x) {
        if (cat == 'budget' || cat == 'expenditure') {
            return Math.round(x.properties[cat] / 100000);
        } else if (cat == 'hdi') {
            return Math.round(Math.pow(x.properties[cat],2) / .0008);
        } else {
            return Math.round(x.properties[cat] / .05);
        }
    },
    updateMap: function(layer) {
        var that = this,
            markers = this.map.layers[2],
        
            radii = function(f) {
                f.properties.description = that.tooltip(layer,f.properties);
                return clustr.area_to_radius(
                    Math.round(that.scale(layer,f))
                );
            };
            
        markers.sort(function(a,b){ return b.properties[layer] - a.properties[layer]; })
            .factory(clustr.scale_factory(radii, "rgba(2,56,109,0.6)", "#01386C"));
                
        //console.log(markers.extent());
    },
    buildMap: function(layer) {
        var that = this,
            locations = [],
            count, sources, budget, description, hdi, hdi_health, hdi_education, hdi_living,
            unit = (this.collection) ? this.collection 
                : this.model.get('operating_unit_id'),
            
            // if unit is an object we're working with the homepage map, else the project map
            homepage = _.isObject(unit);

        mapbox.auto(this.el, 'dhcole.map-75gxxhee', function(map) {
            that.map = map;
            map.setZoomRange(2, 17);
            
            $(that.el).append('<a href="#" class="map-fullscreen"></a>');

            var radii = function(f) {
                f.properties.description = that.tooltip(layer,f.properties);
                return clustr.area_to_radius(
                    Math.round(that.scale(layer,f))
                );
            }
            
            var markers = mapbox.markers.layer()
                .factory(clustr.scale_factory(radii, "rgba(2,56,109,0.6)", "#01386C"))
                .sort(function(a,b){ return b.properties[layer] - a.properties[layer]; });

            $.getJSON('api/operating-unit-index.json', function(data) {
                for (var i = 0; i < data.length; i++) {
                    var o = data[i];
                    if ((homepage) ? unit.operating_unit[o.id] : o.id === unit) {
                    
                        if (!homepage) { that.getwebData(o); }
                        
                        if (o.lon) {
                            (homepage) ? count = unit.operating_unit[o.id] : count = false;
                            (homepage) ? sources = unit.operating_unitSources[o.id] : sources = false;
                            (homepage) ? budget = unit.operating_unitBudget[o.id] : budget = that.model.get('budget');
                            (homepage) ? expenditure = unit.operating_unitExpenditure[o.id] : expenditure = that.model.get('expenditure');
                            if ((homepage) ? unit.hdi[o.id] : that.model.get('hdi')) {
                                (homepage) ? hdi = unit.hdi[o.id].hdi : hdi = that.model.get('hdi').hdi;
                                (homepage) ? hdi_health = unit.hdi[o.id].health : hdi_health = that.model.get('hdi').health;
                                (homepage) ? hdi_education = unit.hdi[o.id].education : hdi_education = that.model.get('hdi').education;
                                (homepage) ? hdi_living = unit.hdi[o.id].living : hdi_living = that.model.get('hdi').living;
                                (homepage) ? hdi_rank = unit.hdi[o.id].rank : hdi_rank = that.model.get('hdi').rank;
                            } else {
                                hdi = hdi_health = hdi_education = hdi_living = hdi_rank = 'no data';
                            }
                            
                            locations.push({
                                geometry: {
                                    coordinates: [
                                        o.lon,
                                        o.lat
                                    ]
                                },
                                properties: {
                                    id: o.id,
                                    title: (homepage) ? o.name : that.model.get('project_title') + '<div class="subtitle">' + o.name + '</div>',
                                    count: count,
                                    sources: sources,
                                    budget: budget,
                                    expenditure: expenditure,
                                    hdi: hdi,
                                    hdi_health: hdi_health,
                                    hdi_education: hdi_education,
                                    hdi_living: hdi_living,
                                    hdi_rank: hdi_rank
                                }
                            });
                        }
                    }
                }
                
                if (locations.length != 0) {
                    markers.features(locations);
                    mapbox.markers.interaction(markers);
                    map.extent(markers.extent());
                    map.addLayer(markers);
                    if (locations.length === 1) {
                        map.zoom(4);
                    }
                } else {
                    map.centerzoom({lat:20,lon:0},2);
                }
            });
        });
    },
    
    tooltip: function(layer,data) {
        var description;
        if (layer == 'hdi') {
            description = '<div class="hdirank">rank: ' + data.hdi_rank + '</div>'
                + '<div class="hdi data"><div class="total" style="width:' + data.hdi*200 + 'px">' + data.hdi + '</div>'
                + '<div class="subdata total" style="width:' + this.collection.hdiWorld.hdi*200 + 'px;"></div>'
                + '<div class="health" style="width:' + data.hdi_health*200 + 'px">' + data.hdi_health + '</div>'
                + '<div class="subdata health" style="width:' + this.collection.hdiWorld.health*200 + 'px;"></div>'
                + '<div class="education" style="width:' + data.hdi_education*200 + 'px">' + data.hdi_education + '</div>'
                + '<div class="subdata education" style="width:' + this.collection.hdiWorld.education*200 + 'px;"></div>'
                + '<div class="living" style="width:' + data.hdi_living*200 + 'px">' + data.hdi_living + '</div>'
                + '<div class="subdata living" style="width:' + this.collection.hdiWorld.income*200 + 'px;"></div></div>';
        } else {
            description = '<div class="stat">Budget: <span class="value">'
                + accounting.formatMoney(data.budget) + '</span></div>'
                + '<div class="stat">Expenditure: <span class="value">'
                + accounting.formatMoney(data.expenditure) + '</span></div>'
                + '<div class="stat">HDI: <span class="value">'
                + data.hdi + '</span></div>';
            
            if (data.count) {
                description = '<div class="stat">Projects: <span class="value">'
                    + data.count + '</span></div>'
                    + ((data.sources > 1) ? ('<div class="stat">Funding Sources: <span class="value">'
                    + data.sources + '</span></div>') : '')
                    + description;
            }
        }
        
        return description;
    },
    
    fullscreen: function(e) {
        e.preventDefault();

        this.$el.toggleClass('full');
        this.map.setSize({ x: this.$el.width(), y: this.$el.height() });
    },
    
    getwebData: function(data) {
        var that = this,
            baseUrl;
        
        _.each(['web','email','facebook','twitter','flickr'], function(v) {
            if (v === 'flickr') {
                // if no flickr account, use general UNDP account
                var link = data[v] || 'http://www.flickr.com/photos/unitednationsdevelopmentprogramme/',
                    name = ((data[v]) ? '' : data['name']);
                that.flickr(name,link);
            }
            if (data[v]) {
                if (v == 'twitter' || v == 'email') {
                    baseUrl = ((v == 'email') ? 'mailto:' : 'http://twitter.com/');
                } else {
                    baseUrl = '';
                }
                
                // Fill contact modal
                $('#unit-contact .modal-body').append(
                      '<div class="row-fluid">'
                    +     '<div class="contacts span2">'
                    +         '<p>' + ((v == 'web') ? 'Homepage' : v.capitalize()) +'</p>'
                    +     '</div>'
                    +     '<div class="span10">'
                    +         '<p><a href="' + baseUrl + ((v == 'twitter') ? data[v].replace('@','') : data[v]) + '">' + data[v] + '</a></p>'
                    +     '</div>'
                    + '</div>'
                );
                
                if (v === 'twitter' && data[v]) {
                    that.twitter(data[v]);
                }
            }
        });
    },
    
    twitter: function(username) {
        var user = username.replace('@','');
        $(".tweet").tweet({
            username: user,
            avatar_size: 32,
            count: 3,
            template: "{avatar}<div>{text}</div><div class='actions'>{time} &#183; {reply_action} &#183; {retweet_action} &#183; {favorite_action}</div>",
            loading_text: "loading tweets..."
        });
        
        $('#twitter').html('<p class="label"><span class="twitter"></span><a href="http://twitter.com/' + user + '">' + username + '</a></p>');
    },
    
    flickr: function(office, url) {
        var apiBase = 'http://api.flickr.com/services/rest/?format=json&jsoncallback=?&method=',
            apiKey = '6a12a7e8c27f63a85bb39ee2b692822c',
            userid, username,
            
            searchFirst = this.model.get('project_id'),
            searchSecond = office,
            //searchSecond = this.model.get('project_title').replace(/ /g,'+'),
            attempt = 0;
        
        // Get user info based on flickr link
        $.getJSON(apiBase + 'flickr.urls.lookupUser&api_key=' + apiKey + '&url=' + url, function(f) {
            userid = f.user.id,
            username = f.user.username._content;
            
            searchPhotos(userid, searchFirst);
        });
        
        // Search Flickr based on search terms. Try project_id, then country office.
        function searchPhotos(id, search) {
            $.getJSON(apiBase + 'flickr.photos.search&api_key=' + apiKey + '&user_id=' + userid + '&text=' + search,
                function(f) {
                    if (f.photos.total == '0') {
                        attempt += 1;
                        switch (attempt) {
                            case 1:
                                searchPhotos(userid, searchSecond);
                                break;
                            case 2:
                                $('#profile .glance').css('display','none');
                                break;
                        }
                    } else {
                        var photos = f.photos.photo;
                        var i = 0;
                        
                        // Load single photo from array
                        function loadPhoto(x) {
                            var photoid = photos[x].id;
                            
                            // Get photo info based on id
                            $.getJSON(apiBase + 'flickr.photos.getInfo&api_key=' + apiKey + '&photo_id=' + photoid, function(info) {
                                
                                var description = info.photo.description._content,
                                    source = 'http://farm' + photos[x].farm
                                        + '.staticflickr.com/' + photos[x].server
                                        + '/' + photoid + '_' + photos[x].secret + '_b.jpg';
                                
                                // Get photo dimensions, checking for portrait vs. landscape
                                $.getJSON(apiBase + 'flickr.photos.getSizes&api_key=' + apiKey + '&photo_id=' + photoid, function(s) {
                                    
                                    if (s.sizes.size[6].height > s.sizes.size[6].width) {
                                        $('#flickr').css('background','url("' + source + '") center 38% no-repeat');
                                        $('#flickr').css('background-size','cover');
                                    } else {
                                        $('#flickr').css('background','url("' + source + '") center 25% no-repeat');
                                        $('#flickr').css('background-size','cover');
                                    }
                                    
                                    var date = (new Date(info.photo.dates.taken)).toLocaleDateString();
                                    
                                    // Fill in date & description
                                    $('#flickr .meta').html('<p class="label">' + date
                                        + '<span class="iconlink"><a href="'
                                        + 'link' + photoid + '/in/photostream/" title="See our photos on Flickr">'
                                        + '<img src="http://l.yimg.com/g/images/goodies/white-small-chiclet.png" '
                                        + 'width="23" height="23" alt=""></a></span></p>'
                                        + '<p>' + description + '</p>');
                                });
                            });
                        }
                        
                        loadPhoto(i);
                        
                        // Show description & nav when hovering over photo
                        $('#flickr').hover(
                            function() {
                                $('#flickr .meta').fadeIn();
                                $('#flickr .resize').fadeIn();
                                if (photos.length > 1) {
                                    if (i == 0) {
                                        $('#flickr .next').fadeIn();
                                    } else if (i == photos.length - 1) {
                                        $('#flickr .prev').fadeIn();
                                    } else {
                                        $('#flickr .control').fadeIn();
                                    }
                                }
                            },
                            function() {
                                $('#flickr .meta').fadeOut();
                                $('#flickr .control').fadeOut();
                            }
                        );
                        
                        // Cycle through photo array
                        $('#flickr .next').click(function() {
                            if (i == 0) {
                                $('#flickr .prev').css('display','block');
                            }
                            i += 1;
                            if (i == photos.length - 1) {
                                $('#flickr .next').css('display','none');
                            }
                            loadPhoto(i);
                        });
                        $('#flickr .prev').click(function() {
                            if (i == photos.length - 1) {
                                $('#flickr .next').css('display','block');
                            }
                            i -= 1;
                            if (i == 0) {
                                $('#flickr .prev').css('display','none');
                            }
                            loadPhoto(i);
                        });
                        
                        // Toggle resizing of photo to fit container
                        $('#flickr .resize').click(function() {
                            if ($(this).children().hasClass('icon-resize-small')) {
                                $('#flickr').css('background-size','contain');
                                $(this).children().attr('class','icon-resize-full');
                            } else {
                                $('#flickr').css('background-size','cover');
                                $(this).children().attr('class','icon-resize-small');
                            }
                        });
                    }
                }
            );
        }
    }
});