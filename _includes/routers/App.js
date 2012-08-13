(function(models, views, routers) {

    routers.App = Backbone.Router.extend({
        initialize: function() {
            this.app = new views.App({ el: '#app' });
        },
        routes: {}
    });

}).apply(this, window.args);
