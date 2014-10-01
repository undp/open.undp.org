views.YearNav = Backbone.View.extend({
	el:'#year .filter-items',
	template:_.template('<li><a id="year-<%= y %>" href="#" class="filter"><%= y %></a></li>'),
	initialize: function(){
		this.render();
	},
	render: function(){
		var years = _.map(FISCALYEARS,function(y){
				var year = {'y':y}; // construct year into a key-value pair for template
				return this.template(year);
			},this);

		this.$el.html(years.join(''));
	
		// Set up menu
        $('#app .view, #mainnav .profile').hide();
        $('#browser, #mainnav .browser').show();
        $('#nav-side.not-filter').remove();
        $('#mainnav li').removeClass('active');
        $('#mainnav li').first().addClass('active');

        // Set up about
        $('#mainnav a.parent-link').click(function(e) {
            e.preventDefault();
            var $target = $(e.target);
            if ($target.parent().hasClass('parent-active')) {
                $target.parent().removeClass('parent-active');
            } else {
                $target.parent().addClass('parent-active');
            }
        });
	}
});