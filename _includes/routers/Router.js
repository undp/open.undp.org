routers.App = Backbone.Router.extend({
    initialize: function() {

        // Load the main app view
        this.app = new views.App({ el: '#app' });

    },
    routes: {
        'project/:id': 'project',
        'filter/*filters': 'browser',
        '': 'browser'
    },
    browser: function(route) {
        var that = this;

        // Parse hash
        var parts = (route) ? route.split('/') : [],
            filters = _(parts).map(function(part) {
                var filter = part.split('-');
                return { collection: filter[0], id: filter[1] };
            }),
            filter = function(model) {
                if (!filters.length) return true;
                return _(filters).reduce(function(memo, filter) {
                    return memo && (model.get(filter.collection) === filter.id);
                }, true);
            };
        app.filters = filters;

        // Load projects
        if(!this.allProjects) {
            this.allProjects = new models.Projects();

            this.allProjects.fetch({
                success: function() {
                    that.projects = new models.Projects(that.allProjects.filter(filter));
                    var view = new views.Projects({
                        collection: that.projects
                    });
                }
            });
        } else {
            // if projects are already present
            that.projects.reset(that.allProjects.filter(filter));
        }

        // Load filters
        if(!this.facets) {
            this.facets = true;
            _(facets).each(function(facet) {
                $('#filter-items').append('<div id="' + facet.id + '"></div>');

                var collection = new models.Filters();
                _(facet).each(function(v, k) { collection[k] = v; });

                collection.fetch({
                    success: function() {
                        var view = new views.Filters({
                            el: '#' + facet.id,
                            collection: collection
                        });
                        _(parts).each(function(filter) {
                            $('#' + filter).addClass('active');
                        });
                    }
                });
            });
        } else {
            $('a.filter').removeClass('active');
            _(parts).each(function(filter) {
                $('#' + filter).addClass('active');
            });
        }
    }
});
