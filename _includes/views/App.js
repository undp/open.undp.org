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
        function mapsize() {
            if($(window).width() <= 1068) {
                $('#homemap').parent().attr('class', 'span11');
            } else {
                $('#homemap').parent().attr('class', 'span6');
            }
        }
        mapsize();
        $(window).resize(function(){mapsize();});
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
    },
    toggleChart: function (e) {
        var $target = $(e.target);
        var facet = $target.attr('data-facet');
        $('.btn-' + facet + ' button').removeClass('active');
        $(e.target).addClass('active');
        this.views[facet].render();
    }
});
