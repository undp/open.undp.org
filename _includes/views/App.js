views.App = Backbone.View.extend({
    events: {
        'click a.filter': 'setFilter',
        'click button.btn-mini': 'toggleChart'
    },
    initialize: function(options) {
        this.render();
        $(window).on('scroll', function() {
            if($(window).scrollTop() >= 77) {
                $('#filters').addClass('fixed');
            } else {
                $('#filters').removeClass('fixed');
            }
        });
    },
    render: function() {
        this.$el.empty().append(templates.app(this));
        this.buildMap();
        return this;
    },
    setFilter: function(e) {
        var $target = $(e.target),
            path = '',
            filters = [{
                collection: $target.attr('id').split('-')[0],
                id: $target.attr('id').split('-')[1]
            }],
            shift = false;

        _(this.filters).each(function(filter) {
            if (_.isEqual(filter, filters[0])) {
                shift = true;
            } else if (filter.collection !== filters[0].collection) {
                filters.push(filter);
            }
        });
        if (shift) filters.shift();

        filters = _(filters).chain()
            .compact()
            .map(function(filter) {
                return filter.collection + '-' + filter.id;
            })
            .value().join('/');

        path = (filters.length) ? 'filter/' + filters : ''; 

        e.preventDefault();
        app.navigate(path, { trigger: true });
    },
    buildMap: function() {
        var locations = [];
        $.getJSON('api/operating-unit-index.json', function(data) {
            for (var i = 0; i < data.length; i++) {
                var o = data[i];
                if (o.lon) {
                    locations.push({
                        geometry: {
                            coordinates: [
                                o.lon,
                                o.lat]
                        },
                        properties: {
                            id: o.id,
                            name: o.name,
                            'marker-color': '#316593'
                        }
                    });
                }
            }
        });
    
        mapbox.auto('map', 'mapbox.mapbox-light', function(map) {
            var markersLayer = mapbox.markers.layer();
            mapbox.markers.interaction(markersLayer);
            markersLayer.features(locations);
            map.addLayer(markersLayer);
            map.extent(markersLayer.extent());
        });
    },
    toggleChart: function (e) {
        var $target = $(e.target);
        var facet = $target.attr('data-facet');
        $('.btn-' + facet + ' button').removeClass('active');
        $(e.target).addClass('active');
        this.views[facet].render();
    }
});
