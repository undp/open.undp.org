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
