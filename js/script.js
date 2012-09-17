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
            /*
            {
                id: 'donor_types',
                url: 'api/donor-type-index.json',
                name: 'Donor Type'
            },
            */
            /*
            {
                id: 'outcome',
                url: 'api/outcome-index.json',
                name: 'Corporate Outcomes'
            },
            */
            {
                id: 'operating_unit',
                url: 'api/operating-unit-index.json',
                name: 'Country Offices / Operating Units'
            },
            {
                id: 'region',
                url: 'api/region-index.json',
                name: 'Regional Bureau'
            },
            {
                id: 'focus_area',
                url: 'api/focus-area-index.json',
                name: 'UNDP Focus Areas'
            },
            {
                id: 'donors',
                url: 'api/donor-index.json',
                name: 'Funding Sources'
            }
        ];

    // Models
    {% include models/Filter.js %}
    {% include models/Project.js %}

    // Views
    {% include views/App.js %}
    {% include views/Filters.js %}
    {% include views/Projects.js %}
    {% include views/ProjectProfile.js %}
    {% include views/Map.js %}

    // Router
    {% include routers/Router.js %}
    
    // String helper
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

    // Start the application
    $(function() {
        app = new routers.App();
        Backbone.history.start();
    });
})();
