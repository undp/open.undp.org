views.App = Backbone.View.extend({
    events: {
        'click a.filter': 'setFilter'
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
    }
});
