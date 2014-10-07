views.Social = Backbone.View.extend({
	el: '#unit-contact',
	template: _.template($('#contactInfo').html()),
	flickrApi: {
		base:'https://api.flickr.com/services/rest/?format=json&jsoncallback=?&method=',
		key:'1da8476bfea197f692c2334997c10c87',//from UNDP's main account (unitednationsdevelopmentprogramme)
		methodLookupUser:'flickr.urls.lookupUser&api_key=',
		methodSearch:'flickr.photos.search&api_key=',
		methodGetInfo: 'flickr.photos.getInfo&api_key='
	},
	initialize:function(){
        this.twitterTemplate = _.template($('#tweetButton').html());
        this.flickrTemplate = _.template($('#flickrImage').html());

        this.$twitterEl = $('#tweet-button'); // orginiated in ProjectProfile.js
        this.$flickrEl = $('#flickr-images');

        this.render();
        _.bindAll(this,'flickr');
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

        this.flickr();
	},
    flickr: function(account) {
        var view = this; // this is necessary since there're a lot of async loading
    	var photos = this.options.photos,
    		accounts = this.options.allFlickr,
			attempt = 0;

        // localize view settings
        var base = this.flickrApi.base,
        	key = this.flickrApi.key,
        	lookup = this.flickrApi.methodLookupUser,
        	search = this.flickrApi.methodSearch,
            info = this.flickrApi.methodGetInfo;

        // get ouput id for flickr tag
        var tagCollection = _.map(this.model.get('outputs'),function(output){
            return output['output_id']
        });
        // get project id for flickr tag
        tagCollection.push(this.model.get('project_id'));

		if (accounts.length){
           	var lookupLink = base +
           		lookup +
           		key +
           		'&url=http://www.flickr.com/photos/';

           	// look up one account at a time
            _(accounts).each(function(account) {
                // Get user info based on flickr link
                queue()
                	.defer($.getJSON, lookupLink + account) // use $.getJSON for json callback
                	.await(searchPhotos)
            },this);
 		// if there's no flickr account but document contains photos,
        } else if (!account.length && photos.length) {
            insertPhotos(photos);
        }

        // photo-related code are within the same scope
	    // Search Flickr based on project ID.
		function searchPhotos(resp1) {
	        var id = resp1.user.id,
	        	tags = tagCollection.join(',');

	  		var tagLink = base +
	  			search +
	  			key +
	  			'&user_id=' + id +
	  			'&tags=' + tags;

	        attempt += 1;

	   		queue()
	   			.defer($.getJSON, tagLink)
	   			.await(loadPhotos)

	    }

        function loadPhotos(resp2){
            var size = 'q'; // square 150

            if (resp2.photos.total != '0') {
                var photosFromFlickr = resp2.photos.photo,
                    // construct photos from flickr array
                    processedPhotosFromFlickr = _.map(photosFromFlickr,function(photo){
                        var source = 'https://farm' + photo.farm + '.staticflickr.com/' +
                            photo.server + '/' +
                            photo.id + '_' + photo.secret +'_' + size +
                            '.jpg';

                        return  {
                            'title': photo.title,
                            'source': source,
                            'url': 'https://flickr.com/photos/' + view.options.unit.flickr + '/' + photo.id
                        }
                    });
                
                photos = photos.concat(processedPhotosFromFlickr);
            }

            // when all accounts are looped through, put the photos in DOM
            if (attempt === accounts.length && photos.length){
                insertPhotos(photos);
            }
        }

        function insertPhotos(photos){
            $('#flickr').show();

            var spinTarget = document.getElementById('flickr');
            view.spinner = new Spinner(global.spinOpts).spin(spinTarget);

            var flickrHTML = '';

            _.each(photos,function(photo,i){
                flickrHTML += view.flickrTemplate(photo);
            });

            view.$flickrEl.html(flickrHTML);

            view.spinner.stop();
        }
    }
})