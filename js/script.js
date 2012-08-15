---
---
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
    {% include models/Filter.js %}
    {% include models/Project.js %}

    // Views
    {% include views/App.js %}
    {% include views/Filters.js %}
    {% include views/Projects.js %}

    // Router
    {% include routers/Router.js %}

    // Start the application
    $(function() {
        app = new routers.App();
        Backbone.history.start();
    });
})();
