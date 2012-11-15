routers.App = Backbone.Router.extend({
    routes: {
        '': 'browser',
        'filter/*filters': 'browser',
        'project/:id': 'project',
        'project/:id/output-:output': 'project',
        'widget/*options': 'widget'
    },

    initialize: function () {
        // Top Donors table
        var donorsGross = new models.TopDonors();
        donorsGross.url = 'api/top-donor-gross-index.json';

        var donorsLocal = new models.TopDonors();
        donorsLocal.url = 'api/top-donor-local-index.json';
        donorsGross.fetch({
            success: function () {
                this.topDonorsGross = new views.TopDonors({
                    el: '#donor-gross-table',
                    collection: donorsGross
                });
            }
        });
        donorsLocal.fetch({
            success: function () {
                this.topDonorsLocal = new views.TopDonors({
                    el: '#donor-local-table',
                    collection: donorsLocal
                });
            }
        });

        // Handle feedback form submission
        $('#feedback-form').submit(function (e) {
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

    project: function (id, output) {
        var that = this;

        window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);

        // Set up menu
        $('#app .view, .project-navigation li').hide();
        $('#browser .summary').addClass('off');
        $('.project-navigation .profile').show();

        // Set up this route
        this.project.model = new models.Project({
            id: id
        });
        this.project.model.fetch({
            success: function () {
                that.project.view = new views.ProjectProfile({
                    el: '#profile',
                    model: that.project.model,
                    gotoOutput: (output) ? output : false
                });

                that.project.widget = new views.Widget({
                    context: 'project'
                });
            }
        });
    },

    browser: function (route) {
        var that = this;
        window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);

        // Set up menu
        $('#app .view, .project-navigation li').hide();
        $('#profile .summary').addClass('off');
        $('#browser, .project-navigation .browser').show();

        // Set up breadcrumbs
        $('#breadcrumbs ul').html('<li><a href="/undp-projects/">All Projects</a></li>');

        // Load the main app view
        this.app = this.app || new views.App({
            el: '#browser'
        });

        // Save default description
        app.defaultDescription = app.defaultDescription || $('#intro p').html();

        // Parse hash
        var parts = (route) ? route.split('/') : [];
        filters = _(parts).map(function (part) {
            var filter = part.split('-');
            return {
                collection: filter[0],
                id: filter[1]
            };
        });

        if (_.isEqual(this.app.filters, filters)) {
            $('html, body').scrollTop(0);
        } else {
            filter = function (model) {
                if (!filters.length) return true;
                return _(filters).reduce(function (memo, filter) {
                    if (filter.collection == 'region') {
                        return memo && model.get(filter.collection) == filter.id;
                    } else {
                        return memo && (
                        model.get(filter.collection) && model.get(filter.collection).indexOf(filter.id) >= 0);
                    }
                }, true);
            };
            this.app.filters = filters;

            // Load projects
            if (!this.allProjects) {
                this.allProjects = new models.Projects();
                this.allProjects.fetch({
                    success: function () {
                        that.projects = new models.Projects(that.allProjects.filter(filter));
                        var view = new views.Projects({
                            collection: that.projects
                        });

                        that.projects.watch();
                        loadFilters();
                        that.projects.map = new views.Map({
                            el: '#homemap',
                            collection: that.projects
                        });

                        that.projects.widget = new views.Widget({
                            context: 'projects'
                        });
                    }
                });
            } else {
                // if projects are already present
                this.projects.reset(this.allProjects.filter(filter));
                updateDescription();
            }

            function loadFilters() {
                var counter = 0;
                that.app.views = {};
                // Load filters
                _(facets).each(function (facet) {
                    $('#filter-items').append('<div id="' + facet.id + '" class="topics"></div>');

                    var collection = new models.Filters();
                    _(facet).each(function (v, k) {
                        collection[k] = v;
                    });

                    collection.fetch({
                        success: function () {
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
            }
        }

        function updateDescription() {

            // Clear search values on refresh
            $('#filters-search, #projects-search').val('');

            if (_(filters).find(function(f) {
                return f.collection === 'focus_area';
            })) {
                $('#chart-focus_area').hide();
            } else {
                $('#chart-focus_area').show();
            }

            if (app.description.length > 1) {
                $('#applied-filters').html('Selected Projects');
                $('#intro p').html(app.description.shift() + app.description.join(',') + '.');
            } else {
                $('#applied-filters').html('All Projects');
                $('#intro p').html(app.defaultDescription);
            }
            app.description = false;
        }

        $('#browser .summary').removeClass('off');
    },

    widget: function (route) {
        var filters = route.split('?')[0],
            options = route.split('?')[1];

        // Get widget options from route
        options = (options) ? options.split('&') : [];

        // Determine whether widget is for project page or main page
        if (filters.split('/')[0] === 'project') {
            $('#container')
                .empty()
                .append('<div id="profile" class="widget map-off stats-off"></div>');
            this.project(filters.split('/')[1]);
        } else {
            $('#container')
                .empty()
                .append('<div id="browser" class="widget map-off stats-off"></div>');
            this.browser(filters);
        }

        // "Turn on" widget components
        _.each(options, function (option) {
            $('#container').find('.widget')
                .removeClass(option + '-off')
                .addClass(option + '-on');
        });
    }
});
