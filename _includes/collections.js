//////////////////////////////////////
///////////  DONORS  VIZ  ////////////
//////////////////////////////////////

// a donor collection built with the donors/donors.json
// with two built in filter machanism
// one for the total, one for the selected donor
Donors = Backbone.Collection.extend({
    url:'api/donors/donors.json',
    total:function(){
        var total = this.filter(function(m){return m.get('donor-country') === 'all';});
        return new Donors(total)
    },
    selectedDonor: function(donor){
        var selected = this.filter(function(m){return m.get('donor-country') === donor;});
        return new Donors(selected)
    },
    initialize:function(){}
});

//////////////////////////////////////
//////// USED IN views/Map.js ////////
//////////////////////////////////////

Nationals = Backbone.Collection.extend({
    model: National,
    url: 'api/operating-unit-index.json'
});

Subnationals = Backbone.Collection.extend({
    model: Subnational,
    url: function() {
        return '../api/units/' + global.unit + '.json'
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

//////////////////////////////////////
//////// USED IN views/Facet.js //////
//////////////////////////////////////

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
    aggregate: function(collection,model){
        //First get the number of projects from the global projects array
        var count = global.projects[collection.id][model.id];

        //Get all the core projects filtered using the facets
        //Add the project count to the country's projects if it's part of the core fund
        if (!global.unit && _(global.coreFund).contains(model.get('id'))) {
            var coreProjects = global.allProjects.filter(function(project) {
               var isCore = _(project.attributes.donors).contains('00012');
               isCore =  (isCore && !_(project.attributes.donor_countries).contains(model.get('id')));
               return _(global.processedFacets).reduce(function(memo, facet) {
                    if (facet.collection === 'region') { // region is treated differently since it is a value, not an array
                        return memo && model.get(facet.collection) == facet.id;
                    } else if (facet.collection === 'donor_countries') { 
                        //disregard this facet in the filter
                        return memo;
                    } else {
                        return memo && (model.get(facet.collection) && model.get(facet.collection).indexOf(facet.id) >= 0);
                    }
               }, isCore);
            });
            count = count + coreProjects.length;
        }
        return {
            count: count,
            budget: global.projects[collection.id + 'Budget'][model.id],
            expenditure: global.projects[collection.id + 'Expenditure'][model.id]
        }
    },
    update: function() {
        // _.find: Looks through each value in the list
        // returning the first one that passes a truth test (predicate)
        // in this case, returns this firs {collection: smth, id: smth} facet
        var activeHash = _(global.processedFacets).find(function(facet) {
                return this.id === facet.collection;
            },this),
            activeModel;

        if (activeHash) {
            activeModel = this.get(activeHash.id);
    
            // the selected hash has a model where active equals true
            activeModel.set({
                active:true
            })

            activeModel.set({
                count: this.aggregate(this,activeModel).count,
                budget: this.aggregate(this,activeModel).budget,
                expenditure: this.aggregate(this,activeModel).expenditure
            });

        } else {
            this.each(function(model) {
                model.set({
                    active:false
                })
                model.set({
                    count: this.aggregate(this,model).count,
                    budget: this.aggregate(this,model).budget,
                    expenditure: this.aggregate(this,model).expenditure,
                });
            },this);
        }
        this.trigger('update');
    },
    comparator: function(model) {
        return -1 * model.get('budget') || 0;
    }
});

//////////////////////////////////////
/////// USED IN routers/Router.js ////
//////////////////////////////////////

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

//////////////////////////////////////
////////////// NOT USED //////////////
//////////////////////////////////////

TotalModalities = Backbone.Collection.extend({
    model: Modality,
    url: 'api/donors/total-modality.json'
})

DonorModalities = Backbone.Collection.extend({
    model: Modality,
    url: 'api/donors/donor-modality.json'
})

Countries = Backbone.Collection.extend({
    model: Country,
    url: 'api/world.json'
});

India = Backbone.Collection.extend({
    model: Country,
    url: 'api/india_admin0.json'
});

OperatingUnits = Backbone.Model.extend({
    model:OperatingUnit,
    url: 'api/operating-unit-index.json'
});

SubnationalIndices = Backbone.Model.extend({
    model:SubnationalIndex,
    url: 'api/subnational-locs-index.json'
});

FocusAreaIndices = Backbone.Model.extend({
    model:FocusAreaIndex,
    url: '../api/focus-area-index.json'
});