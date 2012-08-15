(function() {
    var models = {},
        views = {},
        routers = {},
        templates = _($('script[name]')).reduce(function(memo, el) {
            memo[el.getAttribute('name')] = _(el.innerHTML).template();
            return memo;
        }, {}),
        app = {},
        facets = [
            /*
            {
                id: 'crs',
                url: 'api/crs-index.json',
                name: 'CRS Aid Classification'
            },
            */
            {
                id: 'donors',
                url: 'api/donor-index.json',
                name: 'Donors'
            },
            {
                id: 'focus_area',
                url: 'api/focus-area-index.json',
                name: 'UNDP Focus Areas'
            },
            {
                id: 'operating_unit',
                url: 'api/operating-unit-index.json',
                name: 'Country Offices / Operating Units'
            },
            /*
            {
                id: 'outcome',
                url: 'api/outcome-index.json',
                name: 'Corporate Outcomes'
            },
            */
            {
                id: 'region',
                url: 'api/region-index.json',
                name: 'Regional Bureau'
            }
        ];

    // Models
    // Model
models.Filter = Backbone.Model.extend({});

// Collections
models.Filters = Backbone.Collection.extend({
    model: models.Filter,
    topFive: function() {
        return this.first(5);
    }
});

    // Model
models.Project = Backbone.Model.extend({
    url: function() {
        return 'api/project/' + this.get('id') + '.json';
	}
});

// Collection
models.Projects = Backbone.Collection.extend({
    url: 'api/project_summary.json',
    model: models.Project,
    comparator: function(project) {
        return -1 * project.get('budget');
    } 
});


    // Views
    views.App = Backbone.View.extend({
    events: {
        'click a.filter': 'setFilter'
    },
    initialize: function(options) {
        this.render();
    },
    render: function() {
        this.$el.empty().append(templates.app(this));
        return this;
    },
    setFilter: function(e) {
        var $target = $(e.target),
            path = '',
            filters = [{
                collection: $target.attr('id').split('-')[0],
                id: $target.attr('id').split('-')[1]
            }];

        _(this.filters).each(function(filter) {
            if (_isEqual(filter, filters[0])) {
                filters[0] = null;
            } else if (filter.collection !== filters[0].collection) {
                filters.push(filter);
            }
        });
        filters = _(filters).chain()
            .compact()
            .map(function(filter) {
                return filter.collection + '-' + filter.id;
            })
            .value().join('/');

        path = (filters.length) ? 'filter/' + filters : ''; 

        e.preventDefault();
        app.navigate(path, { trigger: true });
    }
});

    views.Filters = Backbone.View.extend({
    initialize: function () {
        this.render();
    },
    render: function() {
        var that = this;
        this.$el.html(templates.filters(this));
        _(this.collection.first(5)).each(function(model) {
            that.$('.filter-items').append(templates.filter({ model: model }));
        });
        return this;
    }
});

    views.Projects = Backbone.View.extend({
    el: '#project-items',
    initialize: function() {
        this.render();
        this.collection.on('reset', this.render, this);        
    },
    render: function() {
        this.$el.html(templates.projects(this));
        _(this.collection.first(100)).each(function(model) {
            this.$('tbody').append(templates.project({ model: model }));
        });
        return this;
    }
});


    // Router
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


    // Start the application
    $(function() {
        app = new routers.App();
        Backbone.history.start();
    });
})();
