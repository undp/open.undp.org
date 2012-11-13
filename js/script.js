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
                name: 'Regions'
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
    {% include models/TopDonor.js %}

    // Views
    {% include views/App.js %}
    {% include views/Filters.js %}
    {% include views/Projects.js %}
    {% include views/ProjectProfile.js %}
    {% include views/Map.js %}
    {% include views/TopDonors.js %}

    // Router
    {% include routers/Router.js %}
    
    // String helper
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

    /* 
     * To Title Case 2.0.1 – http://individed.com/code/to-title-case/
     * Copyright © 2008–2012 David Gouch. Licensed under the MIT License. 
     */
    
    String.prototype.toTitleCase = function () {
      var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|vs?\.?|via)$/i;
    
      return this.replace(/([^\W_]+[^\s-]*) */g, function (match, p1, index, title) {
        if (index > 0 && index + p1.length !== title.length &&
          p1.search(smallWords) > -1 && title.charAt(index - 2) !== ":" && 
          title.charAt(index - 1).search(/[^\s-]/) < 0) {
          return match.toLowerCase();
        }
    
        if (p1.substr(1).search(/[A-Z]|\../) > -1) {
          return match;
        }
    
        return match.charAt(0).toUpperCase() + match.substr(1);
      }).replace(/Undp/g, 'UDNP');
    };

    // Start the application
    $(function() {
        app = new routers.App();
        Backbone.history.start();
    });
})();
