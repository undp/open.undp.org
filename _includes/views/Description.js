views.Description = Backbone.View.extend({
	initialize: function(){
		this.render();
	},
	render: function(){
		var model = this.options.activeModel,
            facetName = this.options.facetName,
            donorCountry = this.options.donorCountry;
        // this can benefit from smaller views where each
        // facet has its own description
        if (facetName === 'operating_unit') {
            global.description.push(' for the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> office');
        }
        if (facetName === 'region') {
            global.description.push(' in the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> region');
        }
        if (facetName === 'donor_countries') {
            if (donorCountry === 'MULTI_AGY') {
                global.donorTitle = '<strong>Multi-Lateral Agencies</strong>';
                global.donorDescription = '<strong>Multi-Lateral Agencies</strong> fund <strong>' + global.projects.length +'</strong> ';
            } else if (donorCountry === 'OTH') {
                global.donorTitle = '<strong>Uncategorized Organizations</strong>';
                global.donorDescription = '<strong>Uncategorized Organizations</strong> fund <strong>' + global.projects.length +'</strong> ';
            } else {
                global.donorTitle = '<strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>';
                global.donorDescription = '<strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> funds <strong>' + global.projects.length +'</strong> ';
            }
        }
        if (facetName === 'donors') {
            global.description.push(' through <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');

        }
        if (facetName === 'focus_area') {
            global.description.push(' with a focus on <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');
        }
    }
})