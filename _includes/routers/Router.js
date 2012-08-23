routers.App = Backbone.Router.extend({
    initialize: function() {
    },
    routes: {
        'project/:id': 'project',
        'filter/*filters': 'browser',
        '': 'browser'
    },
    project: function(id) {
        var that = this;

        // Set up menu
        $('#app .view, .nav').hide();
        $('.nav.profile').show();

        // Set up this route
        this.project.model = new models.Project({ id: id });
        this.project.model.fetch({
            success: function() {
                that.project.view = new views.ProjectProfile({
                    el: '#profile',
                    model: that.project.model
                });
            }
        });
    },
    browser: function(route) {
        var that = this;

        // Set up menu
        $('#app .view, .nav').hide();
        $('#browser, .nav.browser').show();

        // Load the main app view
        this.app = this.app || new views.App({ el: '#browser' });

        // Parse hash
        var parts = (route) ? route.split('/') : [],
            filters = _(parts).map(function(part) {
                var filter = part.split('-');
                return { collection: filter[0], id: filter[1] };
            }),
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
                        collection.watch();
                    }
                });
            });
        }
    }
});
