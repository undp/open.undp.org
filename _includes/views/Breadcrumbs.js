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
	topDonors: {},
	about: {},
	activeFilter: {},
	activeProject: {},
	template: _.template('<li><a href="<%= link%>"><%= name%></a></li>'),
	initialize: function(options){
		this.render();
	},
	render: function(){
		var base = this.template(this.home) + this.template(this.ourProjects);

		// static links
		if (!this.options) this.$el.html(base);
		if (this.options.add === 'topDonors') {
			this.topDonors.name = 'Top Donors: ' + this.options.category;
			this.topDonors.link = '#top-donors/' + this.options.category;
			this.$el.html(base + this.template(this.topDonors));
		};
		if (this.options.add === 'about') {

			this.about.name = 'About: ' + this.options.subnav.replace('info','');  // contactinfo is used across the site for Prose.io tags, keep as is
			this.about.link = '#about/' + this.options.subnav.replace('info','');
			this.$el.html(base + this.template(this.about));
		}
		if (this.options.add === 'activeFilter') {

			this.activeFilter.name = this.options.filterName;
			this.activeFilter.link = ['#', CURRENT_YR, '/filter/',this.options.filterCollection,'-',this.options.filterId].join('');
			this.$el.html(base + this.template(this.activeFilter));
		}
		if (this.options.add === 'activeProject'){

			this.activeProject.name = this.options.projectName;
			this.activeProject.link = ['#project/',this.options.projectName].join('');

			var unit = {
				name: this.options.projectUnitName,
				link: ['#',CURRENT_YR,'/filter/operating_unit-',this.options.projectUnitId].join('')
			};

			this.$el.html(base + this.template(unit) + this.template(this.activeProject));
		}

	}
})


