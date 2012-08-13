// Application data
window.app = {
    models: {},
    views: {},
    routers: {},
    templates: _($('script[name]')).reduce(function(memo, el) {
        memo[el.getAttribute('name')] = _(el.innerHTML).template();
        return memo;
    }, {})
};
window.args = _(window.app).toArray();

// Router
(function(models, views, routers) {

    routers.App = Backbone.Router.extend({
        initialize: function() {
            this.app = new views.App({ el: '#app' });
        },
        routes: {}
    });

}).apply(this, window.args);


// Models

// Views
(function(models, views, routers, templates) {

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

}).apply(this, window.args);


// Start the application
(function(models, views, routers, templates) {
    $(function() {
        var app = new routers.App();
        //Backbone.history.start();
    });
}).apply(this, window.args);
