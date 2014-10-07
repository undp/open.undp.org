views.Filters = Backbone.View.extend({
    template:_.template($('#filterItemList').html()),
    initialize: function () {
        this.subTemplate = _.template($('#filterItem').html());
        this.collection.on('update', this.render, this);
        _.bindAll(this,'render','renderFilters');
    },
    render: function(keypress) {
        var view = this;

        setTimeout(function() {

            view.filterModels = [];
            view.chartModels = [];

            var isThereDonorCountry = _(global.processedFacets).findWhere({ collection: 'donor_countries' }),
                activeFilter = view.collection.findWhere({active:true});

            $('#' + view.collection.id).toggleClass('filtered', false);

            if (activeFilter) {
    
                // Use donor level financial data if available
                if (activeFilter.collection.id === 'donors') {
                    global.projects.map.collection.donorID = activeFilter.id;
                }
                // Add a filtered class to all parent containers
                // where an active element has been selected.
                $('#' + activeFilter.collection.id).toggleClass('filtered', true);
    
                // copy the collection twice for different usage
                view.filterModels.push(activeFilter);
                view.chartModels.push(activeFilter);

                view.renderFilters(keypress);
            } else {
                view.collection.sort();
                
                // when looping through the budget source collection
                // define donorCountry
                // if it exists, set it as the id of the country
                // if it does not exist, set it to false
                if (view.collection.id === 'donors') {
                    if (_.isObject(isThereDonorCountry)){
                        view.donorCountry = isThereDonorCountry.id;
                    } else {
                        view.donorCountry = false;
                    }
                }

                setTimeout(function() {
                    view.filterModels = view.collection.filter(function(model) {
                        // Filter donors on active donor country
                        var matchingDonorCountry;

                        if (view.donorCountry) {
                            matchingDonorCountry = (model.get('country') === view.donorCountry);
                        } else {
                            matchingDonorCountry = true;
                        }

                        return (model.get('visible') && model.get('count') > 0 && matchingDonorCountry);

                    });

                    view.renderFilters(keypress);

                }, 0);

                if (view.donorCountry) {
                    view.chartModels = view.collection
                        .filter(function(model) {
                            return (model.get('country') === view.donorCountry);
                        });
                } else if (view.collection.id == 'donors'){
                    // Creating chartModels array for top budget sources, filter through 
                    // more countries since the budget sources are calculated below, 
                    // resulting in a different number than budget
                    view.chartModels = view.collection.chain()
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
                    view.chartModels = view.collection.chain()
                        .sortBy(function(model) {
                            return -1 * model.get('expenditure') || 0;
                        })
                        .filter(function(model) {
                            return (model.get('expenditure') > 0);
                        })
                        .first(20)
                        .value(); // Top 20
                }
            }
            view.renderCharts();

        },0);

    },

    renderCharts: function(){
        var view =this;
        // Root path of links for each chart item
        var pathTo;

        if (global.processedFacets.length === 0 ){
            pathTo = '#' + CURRENT_YR +'/filter/';
        } else {
            pathTo = document.location.hash

            //Creates proper link for embedded chart items
            pathTo = (pathTo.split('?')[0] + '/').replace('widget', 'filter')
        };

        pathTo = BASE_URL + pathTo;

        //If we don't have any data for that chart don't render it
        if (view.chartModels.length <= 1 && view.collection.id !== 'focus_area' && !view.donorCountry) {
            $('#chart-' + view.collection.id)
                .css('display','none');
        }
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

        // chart functions live in Chart.js
        if (view.collection.id === 'focus_area') {
            view.chartModels = view.collection.models;
            setTimeout(function() {
                renderFocusAreaChart(view.chartModels, pathTo, view)
            },0);
        } else if ( view.collection.id === 'donors' ){
            setTimeout(function() {
                renderBudgetSourcesChart(donor, donor_ctry, view.chartModels, view, pathTo)
            },0);
        } else if (view.collection.id === 'operating_unit' || view.collection.id === 'donor_countries') {
            setTimeout(function() {
                renderRecipientOfficesChart(donor, donor_ctry, view.chartModels, view, pathTo)
            },0);
        }
    },
    renderFilters: function(keypress){
        if (this.filterModels.length) {
            this.$el.html(this.template(this)); // pass in the view as the template varible

            _(this.filterModels).each(function(model) {

                this.$('.filter-items').append(this.subTemplate({model:model}));
                $('#' + this.collection.id + '-' + model.id).toggleClass('active', model.get('active'));

                if (model.get('active') && !keypress) {
                    new views.Breadcrumbs({
                        add: 'activeFilter',
                        filterName: model.get('name').toLowerCase().toTitleCase(),
                        filterCollection: this.collection.id,
                        filterId: model.get('id')
                    });

                    new views.Description({
                        facetName:this.collection.id,
                        activeModel:model,
                        donorCountry: model.get('name')
                    })
                }
            },this);
        } else {
            this.$el.empty();
        }

        var facetLeng = new Facets().idsOnly();
        // when all the facets have been looped
        // update the map the description
        if (global.filtercounter !== facetLeng.length ) {
            global.filtercounter = (global.filtercounter) ? global.filtercounter + 1 : 2;
        } else {
            global.filtercounter = 0;
            if (!keypress) global.projects.map.render();
            if (!keypress) global.updateDescription();
        }
    }
});

