views.App = Backbone.View.extend({
    events: {
        'click a.filter': 'setFilter',
        'keyup #filters-search': 'searchFilter',
        'click button.btn-mini': 'toggleChart'
    },

    initialize: function(options) {
        var view = this;

        this.render();

        // Filters follow scrolling
        $(window).on('scroll', function() {
            if($(window).scrollTop() >= 140) {
                $('#filters').addClass('fixed');
            } else {
                $('#filters').removeClass('fixed');
            }
        });

        // Minimum height so search field doesn't jump around
        this.$el.css('min-height', $(window).height() * 2);
        $(window).resize(_.debounce(function() {
            view.$el.css('min-height', $(window).height() * 2);
        }, 300));

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
        $('html, body').scrollTop(0);

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

    searchFilter: function(e) {
        _(this.views).each(function(view) {
            var $target = $(e.target),
                val = $target.val().toLowerCase();

            view.collection.each(function(model) {
                var name = model.get('name').toLowerCase();
    
                if (val === '' || name.indexOf(val) >= 0) {
                    model.set('visible', true);
                } else {
                    model.set('visible', false);
                }
            });

            view.render();
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
