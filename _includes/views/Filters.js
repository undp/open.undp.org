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
                    app.projects.map.collection.donorID = donor;
                }
                // Add a filtered class to all parent containers
                // where an active element has been selected.
                _(active).each(function(a) {
                    $('#' + a.collection.id).toggleClass('filtered', true);
                });
    
                filterModels = active;
                chartModels = active;
                filterCallback();

            } else {
                view.collection.sort();
                
                if (view.collection.id === 'donors') {
                    var donorCountry = _(app.app.filters).where({ collection: 'donor_countries' });
                    donorCountry = (donorCountry.length) ? donorCountry[0].id : false;
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
                    view.$el.html(templates.filters(view));
                    app.description = app.description || [];
                    app.donorDescription = app.donorDescription || [];
                    app.donorTitle;
        
                    _(filterModels).each(function(model) {
        
                        view.$('.filter-items').append(templates.filter({ model: model }));
                        $('#' + view.collection.id + '-' + model.id).toggleClass('active', model.get('active'));

                        if (model.get('active') && !keypress) {
                            $('#breadcrumbs ul').append(
                                '<li><a href="' + BASE_URL +
                                document.location.hash.split('/')[0] + '/filter/' +
                                view.collection.id + '-' +
                                model.get('id') + '">' +
                                model.get('name').toLowerCase().toTitleCase() +
                                '</a></li>'
                            );

                            if (view.collection.id === 'operating_unit') {
                                app.description.push(' for the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> office');
                            }
                            if (view.collection.id === 'region') {
                                app.description.push(' in the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> region');
                            }
                            if (view.collection.id === 'donor_countries') {
                                if (donorCountry === 'MULTI_AGY') {
                                    app.donorTitle = '<strong>Multi-Lateral Agencies</strong>';
                                    app.donorDescription = '<strong>Multi-Lateral Agencies</strong> fund <strong>' + app.projects.length +'</strong> ';
                                } else if (donorCountry === 'OTH') {
                                    app.donorTitle = '<strong>Uncategorized Organizations</strong>';
                                    app.donorDescription = '<strong>Uncategorized Organizations</strong> fund <strong>' + app.projects.length +'</strong> ';
                                } else {
                                    app.donorTitle = '<strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>';
                                    app.donorDescription = '<strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> funds <strong>' + app.projects.length +'</strong> ';
                                }
                            }
                            if (view.collection.id === 'donors') {
                                app.description.push(' through <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');

                            }
                            if (view.collection.id === 'focus_area') {
                                app.description.push(' with a focus on <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');
                            }
                        }
                    });
                } else {
                    view.$el.empty();
                }

                if (app.filtercounter !== facets.length ) {
                    app.filtercounter = (app.filtercounter) ? app.filtercounter + 1 : 2;
                } else {
                    app.filtercounter = 0;
                    if (!keypress) app.projects.map.render();
                }

            }
    
            $('#chart-' + view.collection.id + '.rows').empty();

            // update hash for charts
            if (app.app.filters.length === 0 ){
                var pathTo = '#filter/';
            } else {
                pathTo = document.location.hash + "/";
            };

            if (chartModels.length <= 1 && view.collection.id !== 'focus_area' && !donorCountry) {
                $('#chart-' + view.collection.id)
                    .css('display','none');
            } else {
                if ($('.stat-chart').hasClass('full')) {
                    $('.stat-chart').removeClass('full');
                    $('#chart-' + view.collection.id)
                        .css('display','block');
                } else {
                    $('#chart-' + view.collection.id)
                        .addClass('full')
                        .css('display','block');
                }
    
                if (view.collection.id === 'focus_area') {
                    var $el = $('#chart-focus_area');
                        $el.empty();
    
                    chartModels = view.collection.models;
    
                    var total = _(chartModels).reduce(function(memo, model) {
                        return memo + (model.get('budget') || 0 );
                    }, 0) || 0;
    
                    _(chartModels).each(function(model, i) {
                        var focusIconClass = model.get('name').replace(/\s+/g, '-').toLowerCase().split('-')[0];
                        var focusName = model.get('name').toLowerCase().toTitleCase();
    
                        var value = _(((model.get('budget') || 0) / total)).isNaN() ? 0 :
                                ((model.get('budget') || 0) / total * 100).toFixed(0);

                        $el.append(

                            '<li class="focus fa' + model.id + '">' +
                            '  <span class="pct ' + focusIconClass + '"></span><a href="'+ pathTo + view.collection.id + '-' + model.id + '" class="focus-title">' + focusName + '</a>' +
                            '</li>');

                        $('.fa' + (model.id) + ' .pct').text(value + '%');
                    });

                    $el.prepend('<h3 id="focus">Focus Areas <span>% of budget</span></h3>');
                } else if (view.collection.id === 'operating_unit' || view.collection.id === 'donors' || view.collection.id === 'donor_countries') {

                    donor = (_(app.app.filters).find(function(filter) {
                            return filter.collection === 'donors';
                        }) || {id: 0}).id;
                    donor_ctry = (_(app.app.filters).find(function(filter) {
                            return filter.collection === 'donor_countries';
                        }) || {id: 0}).id;

                    var max = '',
                        rows = [],
                        newWidth = 1;
    
                    $('#chart-' + view.collection.id + ' .rows').html('');
                    var status = 1,
                        processes = chartModels.length;

                    _(chartModels).each(function(model) {

                        setTimeout(function() {

                            if (view.collection.id === 'donors') {
                                donor = model.id;
                                
                                var donorProjects = (donor) ? app.projects.chain()
                                    .map(function(project) {
                                        var donorIndex = _(project.get('donors')).indexOf(donor);
                                        if (donorIndex === -1) return;
                                        return {
                                            budget: project.get('donor_budget')[donorIndex],
                                            expenditure: project.get('donor_expend')[donorIndex]
                                        };
                                    }, 0).compact().value() : [];

                                var donorBudget = _(donorProjects).chain().pluck('budget')
                                    .reduce(function(memo, num){ return memo + num; }, 0).value();

                                var donorExpenditure = _(donorProjects).chain().pluck('expenditure')
                                    .reduce(function(memo, num){ return memo + num; }, 0).value();
                                    
                                if (donor || donor_ctry) {
                                    if (donor) app.projects.map.collection.donorID = false;      
                                    app.projects.map.collection.donorBudget[donor] = donorBudget;
                                    app.projects.map.collection.donorExpenditure[donor] = donorExpenditure;
                                }

                            } else {
                                if (donor_ctry) {
                                    var donorBudget = app.projects.chain()
                                        .filter(function(project) {
                                            return project.get('operating_unit') === model.id;
                                        })
                                        .reduce(function(memo, project) {
                                            _.each(project.get('donor_countries'), function(v,i) {
                                                if (v === donor_ctry) {
                                                    memo = memo + project.get('donor_budget')[i];
                                                }
                                            });
                                            return memo;
                                        }, 0).value();
                                    var donorExpenditure = app.projects.chain()
                                        .filter(function(project) {
                                            return project.get('operating_unit') === model.id;
                                        })
                                        .reduce(function(memo, project) {
                                            _.each(project.get('donor_countries'), function(v,i) {
                                                if (v === donor_ctry) {
                                                    memo = memo + project.get('donor_expend')[i];
                                                }
                                            });
                                            return memo;
                                        }, 0).value();
                                } else {
                                    var donorBudget = (donor) ? app.projects.chain()
                                            .filter(function(project) {
                                                return project.get('operating_unit') === model.id;
                                            })
                                            .reduce(function(memo, project) {
                                                var donorIndex = _(project.get('donors')).indexOf(donor);
                                                if (donorIndex === -1) return memo;
                                                return memo + project.get('donor_budget')[donorIndex];
                                            }, 0).value() : 0;
                                    var donorExpenditure = (donor) ? app.projects.chain()
                                            .filter(function(project) {
                                                return project.get('operating_unit') === model.id;
                                            })
                                            .reduce(function(memo, project) {
                                                var donorIndex = _(project.get('donors')).indexOf(donor);
                                                if (donorIndex === -1) return memo;
                                                return memo + project.get('donor_expend')[donorIndex];
                                            }, 0).value() : 0;
                                }
                                if (donor || donor_ctry) {
                                    if (donor) app.projects.map.collection.donorID = false;
                                    app.projects.map.collection.operating_unitBudget[model.get('id')] = donorBudget;
                                    app.projects.map.collection.operating_unitExpenditure[model.get('id')] = donorExpenditure;
                                }
                            }

                            var budget = accounting.formatMoney(
                                        ((donor || donor_ctry) ? donorBudget : model.get('budget')) / 1000000
                                    ) + 'M';
        
                            var budgetWidth = (donor || donor_ctry) ? (donorBudget) : (model.get('budget'));
                            var expenditureWidth = (donor || donor_ctry) ? (donorExpenditure) : (model.get('expenditure'));

                            var caption = '<a href="' + pathTo + model.collection.id + '-' + model.get('id') +
                                '">' + model.get('name').toLowerCase().toTitleCase() + '</a>';
                            var bar = '<div class="budgetdata" data-budget="' + budgetWidth + '"></div>' + '<div class="subdata" data-expenditure="' + expenditureWidth + '"></div>';

                            rows.push({
                                sort: -1 * ((donor || donor_ctry) ? donorBudget : model.get('budget')),
                                content: '<tr>' +
                                    '    <td>' + caption + '</td>' +
                                    '    <td class="right">' + budget + '</td>' +
                                    '    <td class="data">' + bar + '</td>' +
                                    '</tr>'
                            });

                            if (status === processes) {
                                callback();
                            } else {
                                status++;
                            }

                        }, 0);
    
                    });

                    function callback() {
                        rows = _(rows).sortBy('sort');
                        max = rows[0].sort * -1;
                        rows = rows.slice(0,19);

                        _(rows).each(function(row) {
                            $('#chart-' + view.collection.id + ' .rows').append(row.content);
                        });
                        $('#chart-' + view.collection.id + ' .rows tr').each(function() {
                            $('.data .budgetdata', this).width(($('.data .budgetdata', this).attr('data-budget') / max * 100) + '%');
                            $('.data .subdata', this).width(($('.data .subdata', this).attr('data-expenditure') / max * 100) + '%');
                        });
                        if (donorCountry) $('#total-donors').html(chartModels.length);
                    }
    
                }
            }
        }, 0);
    }
});