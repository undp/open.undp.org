views.Description = Backbone.View.extend({
	initialize: function(){
		this.render();
	},
	render: function(){
        // modify the description based on the active model passed in
		var model = this.options.activeModel,
            facetName = this.options.facetName,
            donorCountry = this.options.donorCountry;

        var subject = model.get('name').toLowerCase().toTitleCase(),
            verbFund = 'funds';

        if (facetName === 'operating_unit') {
            global.description.push(' for the ' + util.bold(subject) + ' office');
        }
        if (facetName === 'region') {
            global.description.push(' in the ' + util.bold(subject) + ' region');
        }
        if (facetName === 'donor_countries') {
            if (donorCountry === 'MULTI_AGY') {
                subject = 'Multi-Lateral Agencies';
                verbFund = 'fund';
            } else if (donorCountry === 'OTH') {
                subject = 'Uncategorized Organizations';
                verbFund = 'fund';
            }

            global.donorTitle = subject;

            //Check if it's part of core
            var id = model.get('id')
            var opUnitFilter =_(global.processedFacets).findWhere({collection:"operating_unit"});
            var donors =_(global.processedFacets).findWhere({collection:"donors"});
            // core fund donor
            if (_(global.coreFund).contains(id) && !opUnitFilter && !donors) {

                var coreProjects = global.projects.filter(function(project) {
                    var isCore = _(project.attributes.donors).contains('00012');
                    return (isCore && !_(project.attributes.donor_countries).contains(id));
                })
                global.donorDescription = [
                    util.bold(subject),
                    verbFund,
                    util.bold(global.projects.length - coreProjects.length),
                    'projects through direct funding'
                ].join(' ');
                // core fund donor will have a line noting the number of projects in core
                global.description.push(' and ' + util.bold(coreProjects.length) + ' projects through ' + util.bold('UNDP Regular Resources'));
            } else {
                global.donorDescription = [util.bold(subject), verbFund, util.bold(global.projects.length), 'projects'].join(' ');
            }
        }
        
        
        if (facetName === 'donors') {
            global.description.push(' through ' + util.bold(subject));
        }
        if (facetName === 'focus_area') {
            global.description.push(' with a focus on ' + util.bold(subject));
        }

    }
})