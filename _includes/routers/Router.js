routers.Global = Backbone.Router.extend({
    routes: {
        '': 'redirect',
        'filter/*path': 'redirect', // filters --> "/donor-countries-MULTI_AGY/operating_unit-BRA";
        ':fiscalyear': 'fiscalyear', // fiscalyear --> "2014"
        ':fiscalyear/filter/*path': 'fiscalyear', // fiscalyear, filters
        'project/:id': 'project', //id --> "00064848"
        'project/:id/output-:output': 'project', //id-->"00064848", output ? //TODO this is a variation of the project page, what's different?
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

        if (year === CURRENT_YR){
            util.loadjsFile('api/project_summary_' + year + '.js', year, function() {
                that.browser(year, path, embed);
            });
        } else {
            that.project(year, false,false); // in this case year is the project id
        }

    },

    browser: function (year, path, embed) {
        var that = this,
            unit = false,
            donor = false;

        // Set up about
        $('#mainnav a.parent-link').click(function(e) {
            e.preventDefault();
            var $target = $(e.target);
            if ($target.parent().hasClass('parent-active')) {
                $target.parent().removeClass('parent-active');
            } else {
                $target.parent().addClass('parent-active');
            }
        });
        var breadcrumbs = new views.Breadcrumbs();

        if (!embed) {
            // Load in the top donors info and feedbackform dets.
            window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);
            // Set up breadcrumbs

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

        // Parse hash
        var parts = (path) ? path.split('/') : [];
        var filters = _(parts).map(function (part) {
            var filter = part.split('-');

            if (filter[0] === 'operating_unit') {
                unit = filter[1];
            } else if (filter[0] === 'donor_countries') {
                donor = filter[1]
            }
            return {
                collection: filter[0],
                id: filter[1]
            };
        });

        var filter = function (model) {
            if (!filters.length) return true;
            return _(filters).reduce(function (memo, filter) {
                if (filter.collection === 'region') {
                    return memo && model.get(filter.collection) == filter.id;
                } else {
                    return memo && (model.get(filter.collection) && model.get(filter.collection).indexOf(filter.id) >= 0);
                }
            }, true);
        };

        that.filters = filters;

        var loadFilters = function() {
            var counter = 0;
            that.app.views = {};

            // Load filters
            // create five sub collections
            // which subsequently generates five sets of filter items in Filters.js
            _(facets).each(function (facet) {
                var collection = new Filters();

                $('#filter-items').find('#'+facet.id).remove();
                $('#filter-items').append('<div id="' + facet.id + '" class="topics"></div>');

                _(facet).each(function (v, k) {
                    collection[k] = v;
                });

                collection.fetch({
                    success: function (data) {
                        that.app.views[facet.id] = new views.Filters({
                            el: '#' + facet.id,
                            collection: collection
                        });

                        _.each(filters, function (obj) {
                            if (obj.collection === facet.id) {
                                that.app.views[facet.id].active = true;
                            }
                        });
                        collection.watch();

                        counter++;
                        if (counter === facets.length) updateDescription();

                    }
                });
            });
            // Create summary map view
            if (!embed){
                that.projects.map = new views.Map({
                    el: '#homemap',
                    collection: that.projects
                });
                that.projects.widget = new views.Widget({
                    context: 'projects'
                });
            } else {
                that.projects.map = new views.Map({
                    el: '#homemap',
                    collection: that.projects,
                    embed: embed
                });
            }

        };

        // Load projects
        if (!that.allProjects || that.fiscalYear != year) {
            if (that.fiscalYear && that.fiscalYear != year){that.projects.map.map.remove();}
            that.fiscalYear = year;
            that.allProjects = new Projects(SUMMARY);

            that.projects = new Projects(that.allProjects.filter(filter));
            that.projects.view = new views.Projects({ collection: that.projects });
            that.projects.cb = _(loadFilters).bind(that);

            that.projects.watch();

            that.app.updateYear(year);

        } else {
            // if projects are already present
            that.projects.cb = updateDescription;
            that.projects.reset(this.allProjects.filter(filter));
        }

        // change summary look when on individual country

        $('.map-filter').removeClass('active') // reset the subfilter look
        $('#map-filters').find('#loc-all').addClass('active');

        if(unit){
            $('#map-filters').removeClass('disabled');//shows type sub-filter
            $('.map-btn').removeClass('active');
            $('ul.layers li').addClass('no-hover');
            $('ul.layers li.hdi .graph').addClass('active');
        } else {
            $('#map-filters').addClass('disabled'); //hides type sub-filter
            $('ul.layers li').removeClass('no-hover');
            $('ul.layers li.hdi .graph').removeClass('active');
        }

        // Check for funding countries to show donor visualization
        if (donor){
            that.donor = new views.Donors ();
            $('#donor-view').show();
        } else {
            that.donor = false;
            $('#donor-view').hide();
        }

        // Save default description
        that.defaultDescription = that.defaultDescription || $('#description p.intro').html();
        function updateDescription() {
            setTimeout(function() {

                // Clear search values on refresh

                $('#filters-search, #projects-search').val('');

                if (_(filters).find(function(f) {
                    return f.collection === 'focus_area';
                })) {
                    $('#chart-focus_area').hide();
                } else {
                    $('#chart-focus_area').show();
                }

                // three kinds of descriptions
                // 1. no filter --> defaultDescription
                // 2. filter (no donor) --> start with "The above includes"
                // 3. filter (with donor) --> start with "DONOR funds the above"

                var counts = (that.projects.length === 1) ? 'project' : 'projects';
                    projectCounts = 'There are <strong>' + that.projects.length +'</strong> ' + counts;

                function renderDonorContent(){
                    var $el = $('#donor-specific');
                    $el.empty();
                    $el.append(templates.donorSpecific(app));
                    $el.find('.spin').spin({ color:'#000' });

                    _($el.find('img')).each(function(img){
                        var caption = $('<p class="photo-caption">'+img.alt+'</p>')
                        caption.insertAfter(img);
                        caption.prev().andSelf().wrapAll('<div class="slide" />');
                    });
                    $('.slide').wrapAll('<div id="slides" />');
                    $('#slides', $el).slidesjs({
                        pagination:{active:false},
                        callback: {
                            loaded: function(number) {
                                $el.find('.spin').remove();
                            }
                        }
                    });
                }

                if (that.description && that.description.length === 0){
                    if (that.donorDescription.length > 0) {
                        // custom donor text
                        renderDonorContent();
                        // default donor text
                        $('#description').find('p.desc').html(that.donorDescription + counts +' across the world.');
                        // donor viz h3
                        $('#donor-title').html(that.donorTitle);
                    } else {
                        $('#donor-specific').empty();
                        $('#description').find('p.desc').html(that.defaultDescription);
                    }
                } else if (that.description && that.description.length > 0){
                    if (that.donorDescription.length > 0) {
                        // custom donor text
                        renderDonorContent();
                        // default donor text
                        $('#description').find('p.desc').html(that.donorDescription + counts + ' ' + that.description.join(',') + '.');
                        // donor viz h3
                        $('#donor-title').html(that.donorTitle);
                    } else {
                        $('#donor-specific').empty();
                        $('#description').find('p.desc').html(projectCounts + that.description.join(',') + '.');
                    }
                } else if (!that.description) {
                    $('#donor-specific').empty();
                    $('#description').find('p.desc').html(that.defaultDescription);
                }
                // reset description
                that.description = false;
                that.shortDesc = "";
                that.donorDescription = "";

                $('#browser .summary').removeClass('off');

                // defaultDescription is already populated
                $('#description').find('p.intro').empty();

                // empty the sub loc content since
                $('#description').find('p.geography').empty();

            }, 0);
        }
        // Show proper HDI data
        if (unit && ((HDI[unit]) ? HDI[unit].hdi != '' : HDI[unit])) {
            that.hdi = new views.HDI({
                unit: unit
            });
            if ($('.map-btn[data-value="hdi"]').hasClass('active')) {
                $('#chart-hdi').addClass('active');
            }
        } else {
            that.hdi = false;
            $('#chart-hdi').removeClass('active');
            $('ul.layers li.no-hover.hdi a').css('cursor','default');
            $('ul.layers li.hdi .graph').removeClass('active');
            if (unit) {
                $('#hdi').html('no data');
                $('.map-btn[data-value="hdi"] .total-caption').html('HDI');
            } else {
                $('#hdi').html(_.last(HDI['A-000'].hdi)[1]);
                $('.map-btn[data-value="hdi"] .total-caption').html('HDI Global');
            }
        }

    },

    project: function (id, output, embed) {
        var that = this;

        if (!embed) {
            // Load in feedbackform deats
            that.feedback();

            var nav = new views.Nav({add:'project'});

            window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);

            that.project.widget = new views.Widget({
                context: 'project'
            });
        }

        // Set up this route

        that.project.model = new Project({
            id: id
        });
        // loading the specific project
        that.project.model.fetch({
            success: function (data) {
                if (that.project.view) that.project.view.undelegateEvents();
                that.project.view = new views.ProjectProfile({
                    el: (embed) ? '#embed' : '#profile',
                    model: that.project.model,
                    embed: embed || false,
                    gotoOutput: (output) ? output : false
                });

            }
        });
    },

    widget: function (year, path) {
        var that = this,
            parts = path.split('?'),
            options = parts[1],
            pathTemp = parts[0]; // something widget related, temporarily renamed to differentiate from the path passed from url

        pathTemp = (pathTemp) ? pathTemp.split('/') : [];
        options = (options) ? options.split('&') : [];

        if (pathTemp[0] === 'project') {
            loadjsFile('api/project_summary_' + year + '.js', year, function() {
                that.project(parts[0].split('/')[1], false, options);
            });
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

        var nav = new views.Nav({add:'about',subnav:subnav});
        var breadcrumbs = new views.Breadcrumbs({add:'about',subnav:subnav})
    },
    topDonors: function (category) {
        var that = this;

        // Add nav
        var nav = new views.Nav({add:'topDonors'});
        var breadcrumbs = new views.Breadcrumbs({add:'topDonors'});

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
    }
});
