---
---
var util = {}; // until is on the Window level, since it needs to be accessed by the templates
{% include util.js %}

$(document).ready(function() {
    var CURRENT_YR = FISCALYEARS[0],
        BASE_URL = '/',
        MAPID = "undp.map-6grwd0n3";

    var IE = $.browser.msie;
    if (IE) {var IE_VERSION = parseInt($.browser.version);} // should return an integer

    var views = {};

    {% include models.js %}
    {% include collections.js %}

    // views - main
    {% include views/App.js %}
    {% include views/Facets.js %}
    {% include views/Filters.js %}
    {% include views/Map.js %}
    {% include views/Chart.js %}
    {% include views/HDI.js %}
    {% include views/Description.js%}
    {% include views/Widget.js %}

    // navigation
    {% include views/Nav.js %}
    {% include views/YearNav.js %}
    {% include views/Breadcrumbs.js %}

    // donor specific visualization and content
    {% include views/DonorCharts.js %}
    {% include views/DonorTexts.js %}

    // views - projects list
    {% include views/ProjectItemList.js %}

    // views - single profile page
    {% include views/ProjectProfile.js %}
    {% include views/ProjectMap.js %}
    {% include views/Social.js %}

    // views - top donor page
    {% include views/TopDonors.js %}

    // Router
    {% include routers/Router.js %}

    // Start the application
    global = new Global();
    Backbone.history.start();
});
