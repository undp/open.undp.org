routers.Global = Backbone.Router.extend({
    routes: {
        '': 'redirect',
        'filter/*path': 'redirect', // filters --> "/donor-countries-MULTI_AGY/operating_unit-BRA";
        ':fiscalyear': 'fiscalyear', // fiscalyear --> "2014"
        ':fiscalyear/filter/*path': 'fiscalyear', // fiscalyear, filters
        'project/:id': 'project', //id --> "00064848"
        'project/:id/output-:output': 'project', //project id, output id
        'widget/*options': 'widgetRedirect', //options --> see Widget.js
        ':fiscalyear/widget/*options': 'widget',
        'about/*subnav': 'about', // subnav --> {{post.tag}}
        'top-donors/*category': 'topDonors' //cat --> "regular"
    },

    // This is triggered when the user types in the root url ('http://open.undp.org')
    // the site redirects to /#year
    // which then triggers 'fiscalyear'
    redirect: function() {
        this.navigate(CURRENT_YR, {trigger: true});
    },

    widgetRedirect: function(path) {
        this.navigate(CURRENT_YR + '/widget/' + path, {trigger: true});
    },

    fiscalyear: function (year, path, embed) {
        var that = this;

        queue()
            .defer(util.request,'api/core-fund.json') // load JSON that contains all the core fund donors
            .await(function(err, result) {
                that.coreFund = result;

                if ((FISCALYEARS).indexOf(year) > -1){ // if year exsits in FISCALYEARS array

                    that.allProjects = new Projects();
                    that.allProjects.url = 'api/project_summary_' + year + '.json';

                    that.allProjects.fetch({
                        success:function(){
                            that.browser(year, path, embed);
                        }
                    });
                } else {
                    that.project(year, false,false); // in this case "year" is the project id
                }
            });
    },
    defaultDescription: $('#description p.intro').html(),
    description: [],
    donorDescription: [],
    processedFacets: false,
    unit:false, // this should be reused throughout the site
    donorCountry:false,
    fiscalYear: false,
    parseHash: function(path){
        var that = this;
        // hash comes in forms as 'operating_unit-ARG/donor-12300'
        var hashParts = (path) ? path.split('/') : [], // --> ['operating_unit-ARG','donor-12300']
            selectedFacets;

        this.processedFacets = _(hashParts).map(function(part){

            var selectedFacets = part.split('-');  // --> ['operating_unit','ARG']

            if (selectedFacets[0] === 'operating_unit') {
                that.unit = selectedFacets[1];
            } else if (selectedFacets[0] === 'donor_countries') {
                that.donorCountry = selectedFacets[1]
            }
            return {
                collection: selectedFacets[0],
                id: selectedFacets[1]
            };
        });
    },
    browser: function (year, path, embed) {
        var that = this;

        that.parseHash(path);

        // initiate App view
        // which now contains the filter-items div
        if (!embed) {
            // Load in the top donors info and feedbackform deats.
            setTimeout(function() {
                $('html, body').scrollTop(0);
            }, 0);
            // Load the main app view
            that.app = that.app || new views.App({
                el: '#browser',
                year: year
            });
        } else {
            that.app = that.app || new views.App({
                el: '#embed',
                embed: embed,
                year: year
            });
        }

        // this function is created to populate the filters
        // when the site first loads (or when the year changes)
        // binds to the projects collection
        var loadFiltersAndMap = function(){
            // load facets
            // in facets, filters associated with each facets are created
            // see Facets.js
            new views.Facets();
            // Create summary map view
            if (!embed){
                that.projects.map = new views.Map({
                    el: '#homemap',
                    collection: that.projects
                });
                new views.Widget({
                    context: 'projects' // the other context is "project" - for individual project page
                });
            } else {
                that.projects.map = new views.Map({
                    el: '#homemap',
                    collection: that.projects,
                    embed: embed
                });
            }
        };

        //This is a filter function that checks if a project matches the facets
        var getProjectFromFacets = function (model) {
            if (!that.processedFacets.length) return true;
            return _(that.processedFacets).reduce(function (memo, facet) {
                if (facet.collection === 'region') { // region is treated differently since it is a value, not an array
                    return memo && model.get(facet.collection) == facet.id;
                } else {
                    return memo && (model.get(facet.collection) && model.get(facet.collection).indexOf(facet.id) >= 0);
                }
            }, true);
        };

        //This gets the UNDP regular resources projects that don't have the donor country as one 
        //of the funders, so that we don't double count. We also filter these projects using the facets.
        var getCoreFundsFromFacets = function(donorCountry) {
            return function (model) {
                var isCore = _(model.attributes.donors)
                                .contains('00012') && !_(model.attributes.donor_countries)
                                                            .contains(donorCountry);
                return _(global.processedFacets).reduce(function (memo, facet) {
                    if (facet.collection === 'region') { // region is treated differently since it is a value, not an array
                        return memo && model.get(facet.collection) == facet.id;
                    } else if (facet.collection === 'donor_countries') { //Discard donor_countries
                        return memo;
                    } else {
                        return memo && (model.get(facet.collection) && model.get(facet.collection).indexOf(facet.id) >= 0);
                    }
                }, isCore);
            }
        }


        // Load and filter projects according to facet
        // on load: if the fiscalYear recorded does not correspond to the selected year
        if (that.fiscalYear != year) {
            // remove map to avoid "Map Container is already initialized"
            if (that.fiscalYear && that.fiscalYear != year){
                that.projects.map.map.remove();
            }
            // from that.allProjects get new projects based on the facets
            var facettedProjects = that.allProjects.filter(getProjectFromFacets);

           //Create coreProjects array for projects that are funded by UNDP regular resources
           var coreProjects = [];
           var opUnitFilter =_(global.processedFacets).findWhere({collection:"operating_unit"});
           if (_(that.coreFund).contains(that.donorCountry) && !opUnitFilter) {
                coreProjects = that.allProjects.filter(getCoreFundsFromFacets(that.donorCountry));
                that.projects = new Projects(facettedProjects.concat(coreProjects));
            } else {
                that.projects = new Projects(facettedProjects);
            }


            // start the project calculations
            that.projects.watch();

            // change year and update the year
            that.fiscalYear = year;

            // bind a function to the collection that will be
            // excecuted after the projects front-end calculations are
            // completed -- see collections.js (Projects)
            that.projects.excecuteAfterCalculation = _(loadFiltersAndMap).bind(that);

            // this updates the summary panel
            that.app.updateYear(year);
        } else {
            // if that.allProjects are already present
            that.projects.excecuteAfterCalculation = that.updateDescription;


           //Create coreProjects array for projects that are funded by UNDP regular resources
           var coreProjects = [];
           var opUnitFilter =_(global.processedFacets).findWhere({collection:"operating_unit"});
           if (_(that.coreFund).contains(that.donorCountry) && !opUnitFilter) {
                coreProjects = that.allProjects.filter(getCoreFundsFromFacets(that.donorCountry));
                that.projects.reset(this.allProjects.filter(getProjectFromFacets).concat(coreProjects));
            } else {
                that.projects.reset(this.allProjects.filter(getProjectFromFacets));
            }
        }

        // Check for funding countries to show donor visualization
        if (that.donorCountry){
            that.donor = new views.DonorCharts ();
            $('#donor-view').show();
        } else {
            that.donor = false;
            $('#donor-view').hide();
        }

        // Save default description
        that.defaultDescription = that.defaultDescription || $('#description p.intro').html();

        // whether or not to show focus area charts
        if (_(that.processedFacets).find(
            function(f) {return f.collection === 'focus_area';
        })) {
            $('#chart-focus_area').hide();
        } else {
            $('#chart-focus_area').show();
        }

        if(that.unit){ // unit is not being updated
            // add map filters to summary when on individual country
            $('.map-filter').removeClass('active') // reset the subfilter look
            $('#map-filters').find('#loc-all').addClass('active');
            $('#map-filters').removeClass('disabled');//shows type sub-filter
            $('.map-btn').removeClass('active');
            $('ul.layers li').addClass('no-hover');
            $('ul.layers li.hdi .graph').addClass('active');
        } else {
            $('#map-filters').addClass('disabled'); //hides type sub-filter
            $('ul.layers li').removeClass('no-hover');
            $('ul.layers li.hdi .graph').removeClass('active');
        }

        // Show proper HDI data
        if (that.unit && ((HDI[that.unit]) ? HDI[that.unit].hdi != '' : HDI[that.unit])) {
            that.hdi = new views.HDI({
                unit: that.unit
            });
            if ($('.map-btn[data-value="hdi"]').hasClass('active')) {
                $('#chart-hdi').addClass('active');
            }
        } else {
            that.hdi = false;
            $('#chart-hdi').removeClass('active');
            $('ul.layers li.no-hover.hdi a').css('cursor','default');
            $('ul.layers li.hdi .graph').removeClass('active');
            if (that.unit) {
                $('#hdi').html('no data');
                $('.map-btn[data-value="hdi"] .total-caption').html('HDI');
            } else {
                $('#hdi').html(_.last(HDI['A-000'].hdi)[1]);
                $('.map-btn[data-value="hdi"] .total-caption').html('HDI Global');
            }
        }

        new views.Breadcrumbs();
        new views.ProjectItemList({collection: that.projects });

        // reset unit and donorCountry
        this.unit = false;
        this.donorCountry = false;
        this.description = [];
        this.donorDescription = [];
    },

    project: function (id, output, embed) {
        var oneProject = new Project({id: id});

        // loading the specific project
        oneProject.fetch({
            success: function (data) {
                new views.ProjectProfile({
                    el: (embed) ? '#embed' : '#profile',
                    model: oneProject,
                    embed: embed || false,
                    outputId: (output) ? output : false
                });
            }
        });

        if (!embed) {
            window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);

            new views.Nav({add:'project'});
            new views.Widget({context: 'project'});
            // Load in feedbackform deats
            this.feedback();
        }
    },

    widget: function (year, path) {
        var that = this,
            parts = path.split('?'),
            options = parts[1],
            projectInfo = parts[0]; //['project','00041501']

        projectInfo = (projectInfo) ? projectInfo.split('/') : [];
        options = (options) ? options.split('&') : [];

        if (projectInfo[0] === 'project') {

            that.project(parts[0].split('/')[1], false, options);

        } else {
            var path = parts[0];
            if (path === '') path = undefined;
            that.fiscalyear(year, path, options);
        }
    },
    about: function (subnav) {
        window.setTimeout(function () {
            $('html, body').scrollTop(0);
        }, 0);

        new views.Nav({add:'about',subnav:subnav});
        new views.Breadcrumbs({add:'about',subnav:subnav})
    },
    topDonors: function (category) {
        var that = this;

        new views.Nav({add:'topDonors'});
        new views.Breadcrumbs({add:'topDonors',category:category});

        if (!that.donorsGross) {
            that.donorsGross = new TopDonors({type: category});
            that.donorsGross.url = 'api/top-donor-gross-index.json';

            that.donorsLocal = new TopDonors({type: 'amount'});
            that.donorsLocal.url = 'api/top-donor-local-index.json';

            that.donorsGross.fetch({
                success: function () {
                    that.topDonorsGross = new views.TopDonors({
                        el: '.donor-gross-table',
                        collection: that.donorsGross
                    });
                }
            });
            this.donorsLocal.fetch({
                success: function () {
                    that.topDonorsLocal = new views.TopDonors({
                        el: '.donor-local-table',
                        collection: that.donorsLocal
                    });
                }
            });

            window.setTimeout(function () {
                $('html, body').scrollTop(0);
            }, 0);

        } else {
            that.topDonorsGross.update(category);
        }
    },

    feedback: function () {

        // Handle feedback form submission
        $('#feedback-form').submit(function (e) {
            // Require 'Feedback' field to have content
            if ($('#entry_2').val() === '') {
                alert('Please fill in the required fields before submitting.');
                return false;
            }

            // Set URL for feedback form
            $('#entry_3').val(window.location);

            var button = $('input[type=submit]', this),
                data = $(this).serialize(),
                form = this;

            $.ajax({
                type: 'POST',
                url: 'https://docs.google.com/spreadsheet/formResponse?formkey=dFRTYXNUMWIzbXRhVF94YW9rVmlZNVE6MQ&amp;ifq',
                data: data,
                complete: function () {
                    $('#feedback').modal('hide');
                    $('input[type=text], textarea', form).val('');
                }
            });
            return false;
        });
    },

    updateDescription: function() {
        var $elDesc = $('#description p.desc'),
            $elGeo = $('#description p.geography'),
            $elIntro = $('#description p.intro');

        // defaultDescription is already populated
        $elDesc.empty();
        $elGeo.empty();
        $elIntro.empty();
        $('#donor-specific').empty();

        setTimeout(function() {


            var plural = (global.projects.length === 1) ? 'project' : 'projects',
                sentenceThere = 'There are ' + util.bold(global.projects.length),
                sentenceDonor = global.donorDescription;

            if (global.donorDescription.length > 1){

                new views.DonorTexts();
                $('#donor-title').html(global.donorTitle); // would be better if updated in DonorCharts
                $elDesc.html(sentenceDonor + global.description.join(',') + '.');

            } else if (global.donorDescription.length === 0 && global.description.length > 0){
                $elDesc.html(sentenceThere + global.description.join(',') + '.');
            } else {
                $elDesc.html(global.defaultDescription);
            }

            $('#browser .summary').removeClass('off');

            $('#filters-search, #projects-search').val('');

            if (_(global.processedFacets).find(function(f) {
                return f.collection === 'focus_area';
            })) {
                $('#chart-focus_area').hide();
            } else {
                $('#chart-focus_area').show();
            }

        }, 0);
    }

});