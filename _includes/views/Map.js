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
        this.$el.empty().append('<div class="inner-shadow"></div>');
        this.buildMap();
        return this;
    },
    buildMap: function() {
        var that = this,
            locations = [],
            count, budget, description,
            unit = (this.collection) ? this.collection 
                : this.model.get('operating_unit_id'),
            objCheck = _.isObject(unit);

        mapbox.auto(this.el, 'dhcole.map-75gxxhee', function(map) {
            that.map = map;
            map.setZoomRange(2, 17);
            
            $(that.el).append('<a href="#" class="map-fullscreen"></a>');

            var radii = function(f) {
                return clustr.area_to_radius(
                    Math.round(f.properties.budget / 100000)
                );
            }
            
            var markers = mapbox.markers.layer()
                .factory(clustr.scale_factory(radii, "rgba(2,56,109,0.6)", "#01386C"))
                .sort(function(a,b){ return b.properties.budget - a.properties.budget; });

            $.getJSON('api/operating-unit-index.json', function(data) {
                for (var i = 0; i < data.length; i++) {
                    var o = data[i];
                    if ((objCheck) ? unit.operating_unit[o.id] : o.id === unit) {
                    
                        if (!objCheck) { that.getwebData(o); }
                        
                        if (o.lon) {
                            (objCheck) ? count = unit.operating_unit[o.id] : count = false;
                            (objCheck) ? budget = unit.operating_unitBudget[o.id] : budget = that.model.get('budget');
                            description = '<div class="stat">Budget: <span class="value">'
                                          + accounting.formatMoney(budget) + '</span></div>';
                            if (objCheck) {
                                description += '<div class="stat">Projects: <span class="value">'
                                            + count + '</span></div>';
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
                                    title: (objCheck) ? o.name : that.model.get('project_title') + '<div class="subtitle">' + o.name + '</div>',
                                    count: count,
                                    budget: budget,
                                    description: description
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
    
    fullscreen: function(e) {
        e.preventDefault();

        this.$el.toggleClass('full');
        this.map.setSize({ x: this.$el.width(), y: this.$el.height() });
    },
    
    getwebData: function(data) {
        var that = this,
            baseUrl;
            
        _.each(['web','email','facebook','twitter','flickr'], function(v) {
            if (data[v]) {
                if (v == 'twitter' || v == 'email') {
                    baseUrl = ((v == 'email') ? 'mailto:' : 'http://twitter.com/');
                } else {
                    baseUrl = '';
                }
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
                
                if (v === 'flickr') {
                    $.getJSON('http://api.flickr.com/services/rest/?format=json&jsoncallback=?&method=flickr.urls.lookupUser&api_key=6a12a7e8c27f63a85bb39ee2b692822c&url=' + data[v], function(f) {
                    
                        var userid = f.user.id,
                            username = f.user.username._content;
                            
                        $.getJSON('http://api.flickr.com/services/feeds/photos_public.gne?id=' + userid + '&lang=en-us&format=json&jsoncallback=?',
                            function(d){
                                var photos = d.items,
                                    regex = /<p>(.*?)<\/p>/g,
                                    i = 0;
                                    
                                console.log(d);
                                
                                function loadPhoto(x) {
                                    var source = photos[x].media.m.replace('m.jpg','b.jpg');
                                    var photoid = photos[x].link.split('/')[5];
                                    var desc = photos[x].description;
                                    var sizeCheck;
                                
                                    if (regex.test(desc)) {
                                        photos[x].description = desc.match(regex)[2];
                                        if (photos[x].description != undefined) {
                                            photos[x].description = photos[x].description.replace('<p>','').replace('</p>','');
                                        }
                                    }
                                    
                                    $.getJSON('http://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=22f440f4e37605b01ca22823dbc9b05d&photo_id=' + photoid + '&format=json&nojsoncallback=1', function(s) {
                                      sizeCheck = s.sizes.size[7].height;
                                    });
                                    
                                    if (sizeCheck === 1024) { //not working?
                                        $('#flickr').css('background','url("' + source + '") center -400px no-repeat');
                                        $('#flickr').css('background-size','cover');
                                    } else {
                                        $('#flickr').css('background','url("' + source + '") center -100px no-repeat');
                                        $('#flickr').css('background-size','cover');
                                    }
                                        
                                    $('#flickr .meta .label').html('<img src="http://flickr.com/buddyicons/' + userid + '.jpg"> '
                                        + username + '<span class="iconlink"><a href="'
                                        + d.link + '" title="See our photos on Flickr">'
                                        + '<img src="http://l.yimg.com/g/images/goodies/white-small-chiclet.png" '
                                        + 'width="23" height="23" alt=""></a>'
                                    );
                                    
                                    $('#flickr .meta').html('<p>' + photos[x].date_taken.split('T')[0] + '</p>'
                                        + '<p>' + photos[x].description + '</p>');
                                }
                                
                                loadPhoto(i);
                                    
                                $('#flickr .next').click(function() {
                                    i += 1;
                                    loadPhoto(i);
                                });
                                $('#flickr .prev').click(function() {
                                    i -= 1;
                                    loadPhoto(i);
                                });
                            }
                        );
                    });
                    
                }
                
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
    }
});