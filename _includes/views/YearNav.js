views.YearNav = Backbone.View.extend({
	el:'#year .filter-items',
	template:_.template('<li><a id="year-<%= y %>" href="#" class="filter"><%= y %></a></li>'),
	initialize: function(){
		this.render();
	},
	render: function(){
		var template = this.template,

			years = _.map(FISCALYEARS,function(y){
				var year = {'y':y}; // construct year into a key-value pair for template
				return template(year);
			});
		this.$el.html(years.join());
	}
});