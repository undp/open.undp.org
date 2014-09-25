Nationals = Backbone.Collection.extend({
    model: National,
    url: 'api/operating-unit-index.json'
});

Subnationals = Backbone.Collection.extend({
    model: Subnational,
    url: function() {
        var opUnitFilter =_(global.processedFacets).findWhere({collection:"operating_unit"});
        return '../api/units/' + opUnitFilter.id + '.json'
    },
    parse: function(response){
        return response.projects
    },
    filtered: function() {
        visible = this.filter(function(model) {
          return model.get("visible") === true;
        });
        return new Subnationals(visible);
    }
});

Facets = Backbone.Collection.extend({
    model:Facet,
    facets: [
        {
            id: 'operating_unit',
            url: 'api/operating-unit-index.json',
            name: 'Country Office / Operating Unit'
        },
        {
            id: 'region',
            url: 'api/region-index.json',
            name: 'Region'
        },
        {
            id: 'focus_area',
            url: 'api/focus-area-index.json',
            name: 'Themes'
        },
        {
            id: 'donor_countries',
            url: 'api/donor-country-index.json',
            name: 'Funding by Country'
        },
        {
            id: 'donors',
            url: 'api/donor-index.json',
            name: 'Budget Source'
        }
    ],
    initialize: function(){
        // populate all facets
        // with predefined values
        _(this.facets).each(function(facet){
            this.push(facet);
        },this);
    },
    idsOnly: function(){
        return this.map(function(m){return m.get('id');});
    }
});

Filters = Backbone.Collection.extend({
    model: Filter,
    watch: function() {
        this.update();
        global.projects.on('update', this.update, this);
    },
    update: function() {
        // in the Filters collection
        var collection = this,
            active = _(global.processedFacets).find(function(filter) {
                return (collection.id === filter.collection);
            });

        var activeCollection = collection.where({active:true});

        // set all models to be active: false
        _.each(activeCollection, function(model) {
            model.set('active', false);
        });

        if (active) {
            var model = this.get(active.id);
            var count = global.projects[collection.id][model.id];
            var budget = global.projects[collection.id + 'Budget'][model.id];
            var expenditure = global.projects[collection.id + 'Expenditure'][model.id];
            model.set({
                active: true,
                count: count,
                budget: budget,
                expenditure: expenditure
            });

        } else {
            collection.each(function(model) {
                var count = global.projects[collection.id][model.id];
                var budget = global.projects[collection.id + 'Budget'][model.id];
                var expenditure = global.projects[collection.id + 'Expenditure'][model.id];
                model.set({
                    count: count,
                    budget: budget,
                    expenditure: expenditure
                });
            });
        }
        this.trigger('update');
    },
    comparator: function(model) {
        return -1 * model.get('budget') || 0;
    }
});

Projects = Backbone.Collection.extend({
    model: Project,
    initialize: function() {
        this.sortData = this.sortData || 'budget';
        this.sortOrder = this.sortOrder || 'desc';
    },
    watch: function() {
        this.update();
        this.on('reset', this.update, this);
    },
    getSumValuesOfFacet:function(facetName){
        // the sum of the values from selected facet
        // applies to focus_area, region and operating_unit
        var valuesUnderFacetName = this.pluck(facetName);  // returns values
        var sumValues = _.chain(valuesUnderFacetName)
            .chain()
            .flatten()
            .countBy();

        return sumValues.value()
    },
    getDonorCountires:function(){
        // the sum of donor countries
        // donor countries is an array associated with a project
        var allDonorCountires = this.pluck('donor_countries'); // returns arrays

        var sumDonorCountries = _.chain(allDonorCountires)
            .map(function(donorId){ return _.uniq(donorId);})
            .flatten()
            .countBy();

        return sumDonorCountries.value()
    },
    getUnitSources:function(){
        // the sum of the number of donors
        // under each operating unit for selected proejcts
        // if there are two units, its the sum of the two
        // if it's part of the projects under the unit
        // donor numbers change accordingly
        var groupedByUnit = this.groupBy(function(m){return m.get('operating_unit');});

        var sumDonorsUnderUnit = _.chain(groupedByUnit)
            .reduce(function(memo, modelsUnderUnit, unit) {
                memo[unit] = _.chain(modelsUnderUnit)
                    .map(function(m){return m.get('donors')}) // returns arrays
                    .flatten()
                    .uniq()
                    .size()
                    .value();
                return memo;
            }, {});

        return sumDonorsUnderUnit.value()
    },
    getBudgetAndExpenseOfFacet: function(collection,facetName,category){ // category is "budget" or "expenditure"
        // the sum of budget (or expenditure) of respective facet
        // for example: donor_countriesBudget is the budget sum of
        // the category is capitalized here
        var facetCategory = facetName + category.capitalize(),
            facetSubkey,
            projectFinance;

        // Populate the new key/value associated with the Projects collection
        collection[facetCategory] = _.reduce(collection.models, function(memo,model) {

            facetSubkey = model.get(facetName),
            projectFinance = model.get(category);

            if (_.isArray(facetSubkey)) {

                _.each(facetSubkey, function(key){
                    this.addFinance(key,memo,projectFinance);
                },this); // scope binding to _.each

            } else {

                this.addFinance(facetSubkey,memo,projectFinance);

            }

            return memo
        }, {}, this); // scope binding to _.reduce
    },
    addFinance: function(keyUnderFacet,memoObject,finance){
        if (!(keyUnderFacet in memoObject)) {
            memoObject[keyUnderFacet] = finance
        } else {
            memoObject[keyUnderFacet] += finance
        }
    },
    update: function() {

        var facets = new Facets().idsOnly(); // donors, donor_countries, operating_unit, focus_area, region

        var collection = this,
            processes = 5 + facets.length,
            status = 0;

        if (!collection.length) return false;
        
        // calculate needed value to populate filters, circles and summary fields

        this['donors'] = this.getSumValuesOfFacet('donors');
        this['focus_area'] = this.getSumValuesOfFacet('focus_area')
        this['region'] = this.getSumValuesOfFacet('region')
        this['operating_unit'] = this.getSumValuesOfFacet('operating_unit')
        this['donor_countries'] = this.getDonorCountires();

        // "Budget Sources" in summary
        this['operating_unitSources'] = this.getUnitSources();

        // Count projects for each facet
        _(facets).each(function(facet) {
            setTimeout(function() {
                var subStatus = 0,
                    subProcesses = 1;

                setTimeout(function() {
                    collection.getBudgetAndExpenseOfFacet(collection,facet,'budget');
                    if (subStatus === subProcesses) {
                        subCallback();
                    } else {
                        subStatus++;
                    }
                }, 0);

                setTimeout(function() {
                    collection.getBudgetAndExpenseOfFacet(collection,facet,'expenditure');                        if (subStatus === subProcesses) {
                        subCallback();
                    } else {
                        subStatus++;
                    }
                }, 0);

                function subCallback() {
                    if (status === processes) {
                        callback();
                    } else {
                        status++;
                    }
                }

            }, 0);

        }, collection);

        setTimeout(function() {
            // Total budget
            collection['budget'] = collection.reduce(function(memo, model) {
                return memo + parseFloat(model.get('budget'));
            }, 0);
            if (status === processes) {
                callback();
            } else {
                status++;
            }
        }, 0);

        setTimeout(function() {
            // Donor budgets
            collection['donorBudget'] = collection.reduce(function(memo, model) {
                _.each(model.get('donors'),function(donor, i) {
                    var budget = model.get('donor_budget')[i] || 0;
                        memo[donor] = memo[donor] + budget || budget;
                },this);
                return memo;
            }, {});
            if (status === processes) {
                callback();
            } else {
                status++;
            }
        }, 0);
        
        setTimeout(function() {
            // Funding by Country budgets
            collection['ctryBudget'] = collection.reduce(function(memo, model) {
                _(model.get('donor_countries')).each(function(donor, i) {
                    var budget = model.get('donor_budget')[i] || 0;
                    memo[donor] = memo[donor] +  budget || budget;
                });
                return memo;
            }, {});
            if (status === processes) {
                callback();
            } else {
                status++;
            }
        }, 0);

        setTimeout(function() {
            // Total expenditure
            collection['expenditure'] = collection.reduce(function(memo, model) {
                return memo + parseFloat(model.get('expenditure'));
            }, 0);
            if (status === processes) {
                callback();
            } else {
                status++;
            }

        }, 0);

        setTimeout(function() {
            // Donor expenditure
            collection['donorExpenditure'] = collection.reduce(function(memo, model) {
                _.each(model.get('donor_countries'),function(donor, i) {
                    var budget = model.get('donor_budget')[i] || 0;
                    memo[donor] = memo[donor] + budget || budget;
                },this);
                return memo;
            }, {});
            if (status === processes) {
                callback();
            } else {
                status++;
            }

        }, 0);
        
        setTimeout(function() {
            // Funding by Country expenditure
            collection['ctryExpenditure'] = collection.reduce(function(memo, model) {
                _.each(model.get('donor_countries'),function(donor, i) {
                    var budget = model.get('donor_expend')[i] || 0;
                    memo[donor] = memo[donor] +  budget || budget;
                },this);
                return memo;
            }, {},collection);
            if (status === processes) {
                callback();
            } else {
                status++;
            }

        }, 0);
        
        function callback() {
            collection.trigger('update');
            _(collection.excecuteAfterCalculation).bind(collection)();
        }

    },
    comparator: function(model) {
        if (this.sortOrder == 'desc') {
            if (this.sortData == 'name') {
                return -model.get(this.sortData).toLowerCase().charCodeAt(0);
            } else {
                return -model.get(this.sortData);
            }    
        } else {
            return model.get(this.sortData);
        }
    } 
});

TopDonors = Backbone.Collection.extend({
    model: TopDonor,
    initialize: function(options) {
        this.type = options.type;
    },
    
    comparator: function(model) {
        return -1 * model.get(this.type);
    }
});

TotalModalities = Backbone.Collection.extend({
    model: Modality,
    url: '../api/donors/total-modality.json'
})

DonorModalities = Backbone.Collection.extend({
    model: Modality,
    url: '../api/donors/donor-modality.json'
})

Countries = Backbone.Collection.extend({
    model: Country,
    url: '../api/world.json'
});

India = Backbone.Collection.extend({
    model: Country,
    url: '../api/india_admin0.json'
});

OperatingUnits = Backbone.Model.extend({
    model:OperatingUnit,
    url: '../api/operating-unit-index.json'
});

SubnationalIndices = Backbone.Model.extend({
    model:SubnationalIndex,
    url: '../api/subnational-locs-index.json'
});
FocusAreaIndices = Backbone.Model.extend({
    model:FocusAreaIndex,
    url: '../api/focus-area-index.json'
});