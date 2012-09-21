routers.App = Backbone.Router.extend({
    initialize: function() {

        // Handle feedback form submission
        $('#feedback-form').submit(function(e) {

            // Set URL for feedback form
            $('#entry_3').val(window.location);

            var button = $('input[type=submit]', this),
                data = $(this).serialize(),
                form = this;

            e.preventDefault();

            $.ajax({
                type: 'POST',
                url: 'https://docs.google.com/spreadsheet/formResponse?formkey=dFRTYXNUMWIzbXRhVF94YW9rVmlZNVE6MQ&amp;ifq',
                data: data,
                complete: function() {
                    $('#feedback').modal('hide');
                    $('input[type=text], textarea', form).val('');
                }
            });
        });
    },
    routes: {
        'project/:id': 'project',
        'project/:id/output-:output': 'project',
        'filter/*filters': 'browser',
        '': 'browser'
    },
    project: function(id,output) {
        var that = this;

        // Set up menu
        $('#app .view, .nav').hide();
        $('#browser .summary').addClass('off');
        $('.nav.profile').show();

        // Set up this route
        this.project.model = new models.Project({ id: id });
        this.project.model.fetch({
            success: function() {
                that.project.view = new views.ProjectProfile({
                    el: '#profile',
                    model: that.project.model,
                    gotoOutput: (output) ? output : false
                });
            }
        });
    },
    browser: function(route) {
        var that = this;

        // Set up menu
        $('#app .view, .nav').hide();
        $('#profile .summary').addClass('off');
        $('#browser, .nav.browser').show();

        // Load the main app view
        this.app = this.app || new views.App({ el: '#browser' });

        // Parse hash
        var parts = (route) ? route.split('/') : [],
            filters = _(parts).map(function(part) {
                var filter = part.split('-');
                return { collection: filter[0], id: filter[1] };
            });
            
        if (_.isEqual(this.app.filters, filters)) {
            $('html, body').scrollTop(0);
            $('#browser .summary').removeClass('off');
        } else {
            filter = function(model) {
                if (!filters.length) return true;
                return _(filters).reduce(function(memo, filter) {
                    return memo && (
                        model.get(filter.collection) &&
                        model.get(filter.collection).indexOf(filter.id) >= 0
                    );
                }, true);
            };
            this.app.filters = filters;
    
            // Load projects
            if(!this.allProjects) {
                this.allProjects = new models.Projects();
                this.allProjects.fetch({
                    success: function() {
                        that.projects = new models.Projects(that.allProjects.filter(filter));
                        var view = new views.Projects({ collection: that.projects });
                        that.projects.watch();
                        loadFilters();
                        that.projects.map = new views.Map({
                            el: '#homemap',
                            collection: that.projects
                        });
                    }
                });
            } else {
                // if projects are already present
                this.projects.reset(this.allProjects.filter(filter));
            }
    
            function loadFilters() {
                that.app.views = {};
                // Load filters
                _(facets).each(function(facet) {
                    $('#filter-items').append('<div id="' + facet.id + '"></div>');
    
                    var collection = new models.Filters();
                    _(facet).each(function(v, k) { collection[k] = v; });
    
                    collection.fetch({
                        success: function() {
                            that.app.views[facet.id] = new views.Filters({
                                el: '#' + facet.id,
                                collection: collection
                            });
                            _.each(filters, function(obj) {
                                if (obj.collection === facet.id) {
                                    that.app.views[facet.id].active = true;
                                }
                            });
                            collection.watch();
                        }
                    });
                });
            }
        }
    }
});
