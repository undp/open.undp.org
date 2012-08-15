views.App = Backbone.View.extend({
    events: {
        'click a.filter': 'setFilter'
    },
    initialize: function(options) {
        this.render();
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
            }];

        _(this.filters).each(function(filter) {
            if (_isEqual(filter, filters[0])) {
                filters[0] = null;
            } else if (filter.collection !== filters[0].collection) {
                filters.push(filter);
            }
        });
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
