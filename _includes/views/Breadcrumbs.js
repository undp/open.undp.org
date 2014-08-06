views.Breadcrumbs = Backbone.View.extend({
	el:'#breadcrumbs ul',
	home: {
		name: 'home',
		link: 'http://www.undp.org/content/undp/en/home.html'
	},
	ourProjects: {
		name: 'our projects',
		link: BASE_URL
	},
	topDonors: {
		name: 'top donors',
		link: '#top-donors/regular'
	},
	about: {
		name: '',
		link: ''
	},
	template: _.template('<li><a href="<%= link%>"><%= name%></a></li>'),
	initialize: function(options){
		this.options = options || false;
		this.render();
	},
	render: function(){
		var base = this.template(this.home) + this.template(this.ourProjects);
		// static links
		if (!this.options) this.$el.html(base);
		if (this.options.add === 'topDonors') {this.$el.html(base + this.template(this.topDonors))};
		if (this.options.add === 'about') {

			this.about.name = 'About: ' + this.options.subnav.replace('info','');  // contactinfo is used across the site for Prose.io tags, keep as is
			this.about.link = '#about/' + this.options.subnav.replace('info','');
			this.$el.html(base + this.template(this.about));
		}
		// TODO model links
	}
})


