---
---
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
{% include routers/App.js %}

// Models

// Views
{% include views/App.js %}

// Start the application
(function(models, views, routers, templates) {
    $(function() {
        var app = new routers.App();
        //Backbone.history.start();
    });
}).apply(this, window.args);
