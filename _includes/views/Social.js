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
	}
})