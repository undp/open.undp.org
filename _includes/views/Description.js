views.Description = Backbone.View.extend({
	initialize: function(){
		this.render();
	},
	render: function(){
		var model = this.options.activeModel;
        // this can benefit from smaller views where each
        // facet has its own description
        if (this.collection.id === 'operating_unit') {
            global.description.push(' for the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> office');
        }
        if (this.collection.id === 'region') {
            global.description.push(' in the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> region');
        }
        if (this.collection.id === 'donor_countries') {
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
        if (this.collection.id === 'donors') {
            global.description.push(' through <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');

        }
        if (this.collection.id === 'focus_area') {
            global.description.push(' with a focus on <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');
        }
    }
})