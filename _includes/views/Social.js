views.Social = Backbone.View.extend({
	el: '#unit-contact',
	template: _.template($('#contactInfo').html()),
	initialize:function(){
        this.twitterTemplate = _.template($('#tweetButton').html());

        this.$twitterEl = $('#tweet-button'); // orginiated in ProjectProfile.js
        this.$flickrEl = $('#flickr');

        this.render();
	},
	render: function(){
		var unit = this.options.unit;
			project = this.options.model;
        // contact block
        this.$el.html(this.template({
            unit: unit.get('name'),
            website: unit.get('web'),
            email: unit.get('email'),
            twitter: unit.twitter,
            flickr: unit.flickr,
            facebook: unit.facebook
        }))
        // tweet buttons
        this.$twitterEl.html(this.twitterTemplate({
            'url': BASE_URL + '#project/' + project.get('project_id'),
            'hashtags': 'project' + project.get('project_id'),
            'text': project.get('project_title').toLowerCase().toTitleCase(),
            'via':unit.twitter.length > 0 ? unit.twitter  : 'OpenUNDP',
            'twitter': unit.twitter.length > 0 ? unit.twitter  : 'OpenUNDP'
        }))
       	// append script to avoid double loading in the template
        // this.$twitterEl.append('<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>');
	},
    flickr: function(account) {
    	var photos = this.options.photos;

        var apiBase = 'https://api.flickr.com/services/rest/?format=json&jsoncallback=?&method=',
            apiKey = '1da8476bfea197f692c2334997c10c87', //from UNDP's main account (unitednationsdevelopmentprogramme)
            attempt = 0,
            i = 0;

        // api methods
        var apiLookupUser = 'flickr.urls.lookupUser&api_key=',
            apiSearch = 'flickr.photos.search&api_key=';

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

        if (!account.length && photos.length) { // no flickr account but document contains photos
            $el.show();
            loadPhoto(i);
        } else if (account.length){
            _(account).each(function(acct) {
                // Get user info based on flickr link
                $.getJSON(apiBase + apiLookupUser + apiKey + '&url=http://www.flickr.com/photos/' + acct, function(f) {
                    searchPhotos(f.user.id, tagCollection.join(','));
                });
            });
        } else {
            return false
        }

        // Search Flickr based on project ID.
        function searchPhotos(id, tags) {
            attempt += 1;
            $.getJSON(apiBase + apiSearch + apiKey + '&user_id=' + id + '&tags=' + tags,
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
})