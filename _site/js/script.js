(function() {
    var models = {},
        views = {},
        routers = {},
        templates = _($('script[name]')).reduce(function(memo, el) {
            memo[el.getAttribute('name')] = _(el.innerHTML).template();
            return memo;
        }, {}),
        app = {},
        filters = [
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
	},
	initialize: function() {
    	this.set({ visible: true });
        var collection = this.collection.filter.collection,
    	    id = this.collection.filter.id;
        if (collection && id) {
        	if (this.get(collection) !== id) this.set({ visible: false });
        }
	}
});

// Collection
models.Projects = Backbone.Collection.extend({
    url: 'api/project_summary.json',
    model: models.Project,
    filter: {},
    comparator: function(project) {
        return -1 * project.get('budget');
    }
});


    // Views
    views.App = Backbone.View.extend({
    events: {},
    initialize: function(options) {
        this.render();
    },
    render: function() {
        this.$el.empty().append(templates.app(this));
        return this;
    }
});

    views.Filters = Backbone.View.extend({
    el: '#filter-items',
    events: {
        'click a.filter': 'filterStyle'
    },
    initialize: function() {
        this.render();
    },
    render: function() {
        this.$el.append(templates.filters(this));
        return this;
    },
    filterStyle: function(e) {
        var $this = $(event.target);
        var parent = $this.parent().parent();
        if($this.hasClass('active')) {
            $this.removeClass('active');
        } else {
            $('a', parent).removeClass('active');
            $this.addClass('active');
        }
    }
});

    views.Projects = Backbone.View.extend({
    el: '#project-items',
    initialize: function() {
        this.render();
        this.collection.on('reset', this.render, this);
    },
    render: function() {
        this.$el.empty().append(templates.projects(this));
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
        'filter/:collection-:id': 'browser',
        '': 'browser'
    },
    browser: function(collection, id) {
        var that = this;

        if(!this.filters) {
            _(filters).each(function(filter) {
                var collection = new models.Filters();
    
                _(filter).each(function(v, k) { collection[k] = v });
    
                collection.fetch({
                    success: function() {
                        new views.Filters({ collection: collection });
                        that.filters = true;
                    }
                });
            });
        }

        // Load the main project list
        this.Projects = this.Projects || new models.Projects();

        if (collection && id) {
            this.Projects.filter = {
                collection: collection,
                id: id
            };
        }

        if(!this.data) {
            this.Projects.fetch({
                success: function() {
                    that.Projects.View = new views.Projects({ collection: that.Projects });
                    that.data = that.Projects.toJSON();
                }
            });
        } else {
            this.Projects.reset(this.data);
        }
    }
});


    // Start the application
    $(function() {
        app = new routers.App();
        Backbone.history.start();
    });
})();
