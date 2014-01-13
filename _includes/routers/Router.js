routers.App = Backbone.Router.extend({
    routes: {
        '': 'redirect',
        'filter/*filters': 'redirect',
        ':fiscalyear': 'fiscalyear',
        ':fiscalyear/filter/*filters': 'fiscalyear',
        'project/:id': 'project',
        'project/:id/output-:output': 'project',
        'widget/*options': 'widgetRedirect',
        ':fiscalyear/widget/*options': 'widget',
        'about/*subnav': 'about',
        'top-donors/*cat': 'topDonors'
    },
    
    redirect: function(route) {
        //if url lacks a year, default to most recent
        if (route) {
            this.navigate(CURRENT_YR + '/filter/' + route, {trigger: true});
        } else {
            this.navigate(CURRENT_YR, {trigger: true});
        }
    },

    widgetRedirect: function(route) {
        this.navigate(CURRENT_YR + '/widget/' + route, {trigger: true});
    },

    fiscalyear: function (year, route, embed) {
        var that = this;
        
        if (!$('#y' + year).length) {
            if (location.hash.split('-')[0] !='#project'){
                loadjsFile('api/project_summary_' + year + '.js', year, function() {
                    that.browser(year, route, embed);
                });
            } else { // when projects are loaded from the list view
                that.project(location.hash.split('-')[1], false,false);
            }
        } else {
            that.browser(year, route, embed);
        }

    },

    browser: function (year, route, embed) {
        var that = this,
            unit = false,
            donor = false;

        // Set up menu
        $('#app .view, #mainnav .profile').hide();
        $('#profile .summary').addClass('off');
        $('#browser, #mainnav .browser').show();
        $('#nav-side.not-filter').remove();
        $('#mainnav li').removeClass('active');
        $('#mainnav li').first().addClass('active');

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

        if (!embed) {
            // Load in the top donors info and feedbackform dets.
            window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);

            // Set up breadcrumbs
            $('#breadcrumbs ul').html('<li><a href="http://www.undp.org/content/undp/en/home.html">Home</a></li><li><a href="' + BASE_URL + '">Our Projects</a></li>');

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
        var parts = (route) ? route.split('/') : [];
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

        if (_.isEqual(this.app.filters, filters) && app.fiscalYear === year) {
            $('html, body').scrollTop(0);
        } else {
            // slicing the selected facets and getting the json items
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

            that.app.filters = filters;

            var loadFilters = function() {
                var counter = 0;
                that.app.views = {};
                // Load filters
                _(facets).each(function (facet) {

                    var collection = new models.Filters();

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
            if (!that.allProjects || app.fiscalYear != year) {
                if (app.fiscalYear && app.fiscalYear != year){app.projects.map.map.remove();}
                app.fiscalYear = year;
                that.allProjects = new models.Projects(SUMMARY);

                that.projects = new models.Projects(that.allProjects.filter(filter));
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
                app.donor = new views.Donors ();
                $('#donor-view').show();
            } else {
                app.donor = false;
                $('#donor-view').hide();
            }
        }


        // Save default description
        app.defaultDescription = app.defaultDescription || $('#description p.intro').html();
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

                var counts = (app.projects.length === 1) ? 'project' : 'projects';
                    projectCounts = 'There are <strong>' + app.projects.length +'</strong> ' + counts;

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

                if (app.description && app.description.length === 0){
                    if (app.donorDescription.length > 0) {
                        // custom donor text
                        renderDonorContent();
                        // default donor text
                        $('#description').find('p.desc').html(app.donorDescription + counts +' across the world.');
                        // donor viz h3
                        $('#donor-title').html(app.donorTitle);
                    } else {
                        $('#donor-specific').empty();
                        $('#description').find('p.desc').html(app.defaultDescription);
                    }
                } else if (app.description && app.description.length > 0){
                    if (app.donorDescription.length > 0) {
                        // custom donor text
                        renderDonorContent();
                        // default donor text
                        $('#description').find('p.desc').html(app.donorDescription + counts + ' ' + app.description.join(',') + '.');
                        // donor viz h3
                        $('#donor-title').html(app.donorTitle);
                    } else {
                        $('#donor-specific').empty();
                        $('#description').find('p.desc').html(projectCounts + app.description.join(',') + '.');
                    }
                } else if (!app.description) {
                    $('#donor-specific').empty();
                    $('#description').find('p.desc').html(app.defaultDescription);
                }
                // reset description
                app.description = false;
                app.shortDesc = "";
                app.donorDescription = "";

                $('#browser .summary').removeClass('off');

                // defaultDescription is already populated
                $('#description').find('p.intro').empty();

                // empty the sub loc content since
                $('#description').find('p.geography').empty();

            }, 0);
        }
        // Show proper HDI data
        if (unit && ((HDI[unit]) ? HDI[unit].hdi != '' : HDI[unit])) {
            app.hdi = new views.HDI({
                unit: unit
            });
            if ($('.map-btn[data-value="hdi"]').hasClass('active')) {
                $('#chart-hdi').addClass('active');
            }
        } else {
            app.hdi = false;
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

            that.nav = new views.Nav();
            
            window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);

            // Set up menu
            $('#app .view, #mainnav .browser').hide();
            $('#mainnav li').removeClass('active');
            $('#browser .summary').addClass('off');
            $('#mainnav .profile').show();
            $('#mainnav li').first().addClass('active');
            $('#mainnav li.parent').removeClass('parent-active');

            that.project.widget = new views.Widget({
                context: 'project'
            });
        }

        // Set up this route

        that.project.model = new models.Project({
            id: id
        });

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

    widget: function (year, route) {
        var that = this,
            parts = route.split('?'),
            options = parts[1],
            path = parts[0];

        path = (path) ? path.split('/') : [];
        options = (options) ? options.split('&') : [];

        if (path[0] === 'project') {
            loadjsFile('api/project_summary_' + year + '.js', year, function() {
                that.project(parts[0].split('/')[1], false, options);
            });
        } else {
            var route = parts[0];
            if (route === '') route = undefined;
            that.fiscalyear(year, route, options);
        }
    },
    about: function (route) {
        window.setTimeout(function () {
            $('html, body').scrollTop(0);
        }, 0);
        // add Nav
        this.nav = new views.Nav();

        $('#breadcrumbs ul').html('<li><a href="http://www.undp.org/content/undp/en/home.html">Home</a></li>' + '<li><a href="' + BASE_URL + '">Our Projects</a></li>' + '<li><a href="#about/' + route + '">About: ' + route.capitalize().replace('info','') + '</a></li>');

        $('#app .view, #about .section, #mainnav .profile').hide();
        $('#aboutnav li, #mainnav li').removeClass('active');

        $('#about, #mainnav .browser').show();
        $('#aboutnav li a[href="#about/' + route + '"]').parent().addClass('active');
        $('#about #' + route).show();
        $('#mainnav li.parent').addClass('parent-active');
    },
    topDonors: function (route) {
        var that = this;

        // Add nav
        this.nav = new views.Nav();

        $('#breadcrumbs ul').html('<li><a href="http://www.undp.org/content/undp/en/home.html">Home</a></li>' + '<li><a href="' + BASE_URL + '">Our Projects</a></li>' + '<li><a href="#top-donors/regular">Top Donors</a></li>');

        $('#app .view').hide();
        $('#mainnav li.profile').hide();
        $('#mainnav li.browser').show();
        $('#mainnav li').removeClass('active');
        $('#mainnav li.parent').removeClass('parent-active');

        $('#top-donors').show();
        $('#mainnav li a[href="#top-donors/regular"]').parent().addClass('active');
        
        $('#donor-nav li a').removeClass('active');
        $('#donor-nav li a[href="#top-donors/' + route + '"]').addClass('active');

        if (!that.donorsGross) {
            that.donorsGross = new models.TopDonors({type: route});
            that.donorsGross.url = 'api/top-donor-gross-index.json';
    
            that.donorsLocal = new models.TopDonors({type: 'amount'});
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
            that.topDonorsGross.update(route);
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
