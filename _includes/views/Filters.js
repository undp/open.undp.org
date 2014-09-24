views.Filters = Backbone.View.extend({
    initialize: function () {
        this.collection.on('update', this.render, this);
    },
    render: function(keypress) {
        var view = this;
        setTimeout(function() {

            var filterModels = [],
                chartModels = [],
                active = view.collection.where({ active: true }),
                chartType = 'budget',
                donor = '';
                
            $('#' + view.collection.id).toggleClass('filtered', false);

            if (active.length) {
    
                // Use donor level financial data if available
                if (active[0].collection.id === 'donors') {
                    donor = active[0].id;
                    global.projects.map.collection.donorID = donor;
                }
                // Add a filtered class to all parent containers
                // where an active element has been selected.
                _(active).each(function(a) {
                    $('#' + a.collection.id).toggleClass('filtered', true);
                });
    
                // copy the collection twice for different usage
                filterModels = active;
                chartModels = active;
                filterCallback();

            } else {
                view.collection.sort();
                
                if (view.collection.id === 'donors') {
                    var donorCountry = _(global.processedFacets).where({ collection: 'donor_countries' });
                    donorCountry = (donorCountry.length) ? donorCountry[0].id : false;
                    view.donorCountry = donorCountry;
                }

                setTimeout(function() {
                    filterModels = view.collection.chain().filter(function(model) {
                        // Filter donors on active donor country
                        var donorCountryFilter = (donorCountry) ? (model.get('country') === donorCountry) : true;

                        return (model.get('visible') && model.get('count') > 0 && donorCountryFilter);

                    }).value();
                    filterCallback();
                }, 0);

                if (donorCountry) {
                    chartModels = view.collection.chain()
                        .filter(function(model) {
                            return (model.get('country') === donorCountry);
                        }).value();
                } else if (view.collection.id == 'donors'){
                    // Creating chartModels array for top budget sources, filter through 
                    // more countries since the budget sources are calculated below, 
                    // resulting in a different number than budget
                    chartModels = view.collection.chain()
                        .sortBy(function(model) {
                            return -1 * model.get('expenditure') || 0;
                        })
                        .filter(function(model) {
                            return (model.get('expenditure') > 0);
                        })
                        .first(75)
                        .value(); // Top 20
                } else {
                    // Top 20 donors, donor_countries, and operating_unit
                    chartModels = view.collection.chain()
                        .sortBy(function(model) {
                            return -1 * model.get('expenditure') || 0;
                        })
                        .filter(function(model) {
                            return (model.get('expenditure') > 0);
                        })
                        .first(20)
                        .value(); // Top 20
                }
                if (view.collection.id === 'operating_unit') {
                    $('#applied-filters').addClass('no-country');
                }
                if (view.collection.id === 'region') {
                    $('#applied-filters').addClass('no-region');
                }
            }

            function filterCallback() {
                if (filterModels.length) {
                    view.$el.html(templates.filters(view)); //  and view === this... TODO: see script.js
                    global.description = global.description || [];
                    global.donorDescription = global.donorDescription || [];
                    global.donorTitle;
        
                    _(filterModels).each(function(model) {
        
                        view.$('.filter-items').append(templates.filter({ model: model }));
                        $('#' + view.collection.id + '-' + model.id).toggleClass('active', model.get('active'));

                        if (model.get('active') && !keypress) {
                            // var breadcrumbs = new views.Breadcrumbs();
                            $('#breadcrumbs ul').append(
                                '<li><a href="' + BASE_URL +
                                document.location.hash.split('/')[0] + '/filter/' +
                                view.collection.id + '-' +
                                model.get('id') + '">' +
                                model.get('name').toLowerCase().toTitleCase() +
                                '</a></li>'
                            );

                            // this can benefit from smaller views where each
                            // facet has its own description
                            if (view.collection.id === 'operating_unit') {
                                global.description.push(' for the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> office');
                            }
                            if (view.collection.id === 'region') {
                                global.description.push(' in the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> region');
                            }
                            if (view.collection.id === 'donor_countries') {
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
                            if (view.collection.id === 'donors') {
                                global.description.push(' through <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');

                            }
                            if (view.collection.id === 'focus_area') {
                                global.description.push(' with a focus on <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');
                            }
                        }
                    });
                } else {
                    view.$el.empty();
                }

                if (global.filtercounter !== facets.length ) {
                    global.filtercounter = (global.filtercounter) ? global.filtercounter + 1 : 2;
                } else {
                    global.filtercounter = 0;
                    if (!keypress) global.projects.map.render();
                }

            }
    
            // Root path of links for each chart item
            if (global.processedFacets.length === 0 ){
                var pathTo = '#' + CURRENT_YR +'/filter/';
            } else {
                pathTo = document.location.hash + "/";
            };

            //If we don't have any data for that chart don't render it
            if (chartModels.length <= 1 && view.collection.id !== 'focus_area' && !donorCountry) {
                $('#chart-' + view.collection.id)
                    .css('display','none');
            } else {
                //This code makes sure that all appropriate charts are displayed again after removing a filter
                if ($('.stat-chart').hasClass('full')) {
                    $('.stat-chart').removeClass('full');
                    $('#chart-' + view.collection.id)
                        .css('display','block');
                } else {
                    $('#chart-' + view.collection.id)
                        .addClass('full')
                        .css('display','block');
                }
    
                //Get the filter values
                var donor = (_(global.processedFacets).find(function(filter) {
                            return filter.collection === 'donors';
                        }) || {id: 0}).id;
                var donor_ctry = (_(global.processedFacets).find(function(filter) {
                        return filter.collection === 'donor_countries';
                    }) || {id: 0}).id;


                if (view.collection.id === 'focus_area') {
                    chartModels = view.collection.models;
                    renderFocusAreaChart(chartModels, pathTo, view);

                } else if ( view.collection.id === 'donors' ){
                    view.chartModels = chartModels;
                    renderBudgetSourcesChart(donor, donor_ctry, chartModels, view, pathTo) 

                } else if (view.collection.id === 'operating_unit' || view.collection.id === 'donor_countries') {
                    view.chartModels = chartModels;
                    renderRecipientOfficesChart(donor, donor_ctry, chartModels, view, pathTo) 
                }
            }
        }, 0);
    }
});


