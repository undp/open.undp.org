function renderFocusAreaChart(chartData, rootPath, view) {
    var $el = $('#chart-focus_area');
    $el.empty();
    
    this.pageType = Backbone.history.location.hash.split('/')[1];

    // Calculate budget for each focus area
    var totalBudget = _(chartData).reduce(function(budget, focusArea) {
        return budget + (focusArea.get('budget') || 0);
    }, 0) || 0;

    var pageType = Backbone.history.location.hash.split('/')[1];

    // Template for each row
    var template = '';
    var pageType = Backbone.history.location.hash.split('/')[1];
    if (pageType === 'widget') {
        template = _.template($("#embedFocusAreaItemTemplate").html());
    } else {
        template = _.template($("#focusAreaItemTemplate").html());
    }

    _(chartData).each(function(model, index) {
        var focusIconClass = model.get('name').replace(/\s+/g, '-').toLowerCase().split('-')[0];
        var focusName = model.get('name').toLowerCase().toTitleCase();
        var value = _(((model.get('budget') || 0) / totalBudget)).isNaN() ? 0 :
                    ((model.get('budget') || 0) / totalBudget * 100).toFixed(0);
        if (value > 0) {
            $el.append(template({
                id: model.id,
                path: rootPath + view.collection.id + '-' + model.id,
                focusName: focusName,
                focusIconClass: focusIconClass,
                value: value
            }))

            //Set css for each item
            $('.fa' + (model.id) + ' .pct span')
            .css('width', value * 2) // the width of the percentage block corresponds to the value visually, times 2 to make it legible
            .css('background', value === '0' ? '#999' : '')
            .text(value === '0' ? '<1%' : value + '%');
        }
    });

    //Add title
    $el.prepend('<h3 id="focus">Themes <span>% of budget</span></h3>');
}

function setBudgetHTML(donorInfo, model, notOperatingUnit, pathTo) {
    var donorBudget = donorInfo.budget;
    var donorExpenditure = donorInfo.expenditure;

    //Template of chart row
    var chartTemplate = '';
    var pageType = Backbone.history.location.hash.split('/')[1];
    if (pageType === 'widget') {
        chartTemplate = _.template($("#embedBudgetChartItemTemplate").html());
    } else {
        chartTemplate = _.template($("#budgetChartItemTemplate").html());
    }

    var budget = accounting.formatMoney(
            ((notOperatingUnit) ? donorBudget : model.get('budget')),"$", 0, ",", "."
        );
    var budgetWidth = (notOperatingUnit) ? (donorBudget) : (model.get('budget'));
    var expenditureWidth = (notOperatingUnit) ? (donorExpenditure) : (model.get('expenditure'));
    
    if (budget!='$0') {
        return {
            sort: -1 * budgetWidth,
            fund_type: model.attributes.fund_type,
            content: chartTemplate({
                path: pathTo + model.collection.id + '-' + model.get('id'),
                budgetWidth: budgetWidth,
                expenditureWidth: expenditureWidth,
                name: model.get('name').toLowerCase().toTitleCase(),
                budget: budget
            })
        };
    }
}


function addRows(selector, rows, view) {
    rows = _(rows).sortBy('sort');
    var max = rows[0].sort * -1;
    rows = rows.slice(0,19);

    _(rows).each(function(row) {
        selector.append(row.content);
    });

    selector.children().each(function() {
        $('.data .budgetdata', this).width(($('.data .budgetdata', this).attr('data-budget') / max * 100) + '%');
        $('.data .subdata', this).width(($('.data .subdata', this).attr('data-expenditure') / max * 100) + '%');
    });
    if (view.donorCountry) $('#total-donors').html(view.chartModels.length);
}

function renderBudgetSourcesChart(donor, donorCountrySelected, chartData, view, pathTo) {
   $('#chart-' + view.collection.id + ' .rows').empty();
    var rows = [];
    
    var donorTable = {};
    global.projects.chain().each(function(project) {
        _(project.get('donors')).each(function(donor, idx) {
        	if (!(donor in donorTable)) {
        		donorTable[donor] = {
        			budget: 0,
        			expenditure: 0
        		};
        	}
            donorTable[donor].budget += project.get('donor_budget')[idx];
            donorTable[donor].expenditure += project.get('donor_expend')[idx];   
        })
    });
    var groupedSources = {};
    _(chartData).each(function(model) {
        var donorInfo = {budget: 0, expenditure: 0};
        var country = model.get('country');
        var donor = model.id;
        var notOperatingUnit = (donor || donorCountrySelected);
        
        if (country.length == 3 && donorCountrySelected !== country) {
        	
        	if (!(country in groupedSources)) {
        		groupedSources[country] = {
        			budget: 0,
        			expenditure: 0
        		};
        	}
        	groupedSources[country].budget += (donor in donorTable)? donorTable[donor].budget : 0;
        	groupedSources[country].expenditure += (donor in donorTable)? donorTable[donor].expenditure : 0;   
        	
        } else {
        	
            donorInfo.budget = (donor in donorTable)? donorTable[donor].budget : 0;
            donorInfo.expenditure = (donor in donorTable)? donorTable[donor].expenditure : 0;
            
            if (notOperatingUnit) {
                if (donor) global.projects.map.collection.donorID = false;      
                global.projects.map.collection.donorBudget[donor] = donorInfo.budget;
                global.projects.map.collection.donorExpenditure[donor] = donorInfo.expenditure;
            }   
            
            var row = setBudgetHTML(donorInfo, model, notOperatingUnit, pathTo);
            if (typeof row !== 'undefined') rows.push(row);

        }
        
    });
    
    // get country models
    //console.log(groupedSources.length, notOperatingUnit);
    if (Object.keys(groupedSources).length > 0) {
	    var facets = new Facets;
	    facets.filter(function(data){
	    	return data.get('id') == 'donor_countries';
	    })[0].subCollection.fetch({
	    	success: function(collection) {
	    		_(groupedSources).each(function(source, c) {
	    	    	var row = setBudgetHTML(source, collection._byId[c], true, pathTo);
	    	    	if (typeof row !== 'undefined') rows.push(row);    	
	    	    });
	    		
	    		if (rows.length > 0) addRows($('#chart-' + view.collection.id + ' .rows'),rows, view);
	    	}
	    });
    } else {
    	if (rows.length > 0) addRows($('#chart-' + view.collection.id + ' .rows'),rows, view);
    }
    
}

function renderRecipientOfficesChart(donor, donorCountrySelected, chartData, view, pathTo) {
    var localRows = [];
    var partnerRows = [];
    $('#chart-' + view.collection.id + ' .rows').empty();

    _(chartData).each(function(model) {

        var donorInfo = { budget: 0, expenditure: 0};
        
        donorInfo.budget = (donorCountrySelected || donor) ? global.projects.chain()
            .filter(function(project) {
                return project.get('operating_unit') === model.id;
            })
            .reduce(function(memo, project) {
                var donorIndex = _(project.get( ((donorCountrySelected)? 'donor_countries':'donors')) )
                    .indexOf( ((donorCountrySelected)?donorCountrySelected:donor) );
                if (donorIndex === -1) return memo;
                return memo + project.get('donor_budget')[donorIndex];
            }, 0).value() : 0;

        donorInfo.expenditure = (donorCountrySelected || donor) ? global.projects.chain()
            .filter(function(project) {
                return project.get('operating_unit') === model.id;
            })
            .reduce(function(memo, project) {
                var donorIndex = _(project.get( ((donorCountrySelected)?'donor_countries':'donors')) )
                    .indexOf( ((donorCountrySelected)? donorCountrySelected:donor ) );
                if (donorIndex === -1) return memo;
                return memo + project.get('donor_expend')[donorIndex];
            }, 0).value() : 0;
        
        var notOperatingUnit = (donor || donorCountrySelected);

        if (notOperatingUnit) {
            if (donor) global.projects.map.collection.donorID = false;
            global.projects.map.collection.operating_unitBudget[model.get('id')] = donorInfo.budget;
            global.projects.map.collection.operating_unitExpenditure[model.get('id')] = donorInfo.expenditure;
        }

        var row = setBudgetHTML(donorInfo, model, notOperatingUnit, pathTo);
        if (typeof row !== 'undefined') {
            if (row.fund_type === 'Local') localRows.push(row);
            else partnerRows.push(row);
        }
    });    
    
    //If a donor country is selected, we don't want to make a partner/local resources distinction
    $('#chart-' + view.collection.id).empty();
    if (donorCountrySelected) {
        $('#chart-' + view.collection.id).append($('#recipientOfficesChart').html());
        if (localRows.length > 0 || partnerRows.length > 0) {
            addRows($('#chart-' + view.collection.id +' .rows'), localRows.concat(partnerRows), view);
        }
    } else {
        $('#chart-' + view.collection.id).append($('#recipientOfficesChartTabbed').html());
        if (localRows.length > 0 ) {
        	addRows($('#chart-' + view.collection.id + ' #localTab .rows'), localRows, view);
        	if (partnerRows.length < 1) {
        		$('#chart-' + view.collection.id + ' a[href="#localTab"]').trigger('click');
        	}
        }
        if (partnerRows.length > 0) addRows($('#chart-' + view.collection.id + ' #partnerTab .rows'), partnerRows, view);
    }
}