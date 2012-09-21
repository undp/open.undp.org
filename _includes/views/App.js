views.App = Backbone.View.extend({
    events: {
        'click a.filter': 'setFilter',
        'keyup #filters-search': 'searchFilter',
        'click #filters .label': 'collapseFilter',
        'click button.btn-mini': 'toggleChart',
        'click .map-btn': 'mapLayerswitch'
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

        // Set up help popovers
        $('.help-note').popover({ trigger: 'hover' });
        
        $('.map-btn .lead').fitText(0.6, {minFontSize: '14px', maxFontSize: '24px'});
    },

    render: function() {
        this.$el.empty().append(templates.app(this));
        window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);

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

        path = (filters.length) ? 'filter/' + filters : 'filter/'; 

        e.preventDefault();

        $('#all-projects').attr('href', '#' + path);
        app.navigate(path, { trigger: true });
    },

    searchFilter: function(e) {
        var $target = $(e.target),
                val = $target.val().toLowerCase();
                
        _(this.views).each(function(view) {
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
        
        // Open all filter facets on search
        if (val === '') {
            $('ul.filter-items').removeClass('active-filter');
            $('#filter-items .label').removeClass('active-filter');
        } else {    
            $('ul.filter-items').addClass('active-filter');
            $('#filter-items .label').addClass('active-filter');
        }
    },
    
    collapseFilter: function (e) {
        var $target = $(e.target),
            list = $target.next();
            cat = $target.parent().parent().parent().attr('id');
        if (list.hasClass('active')) {
            list.removeClass('active');
            $target.removeClass('active');
            this.views[cat].active = false;
        } else {
            list.addClass('active');
            $target.addClass('active');
            this.views[cat].active = true;
        }
    },
    
    mapLayerswitch: function (e) {
        var $target = $(e.currentTarget);
        $('.map-btn').removeClass('active');
        $target.addClass('active');
        app.projects.map.updateMap($target.attr('data-value'));
    },

    toggleChart: function (e) {
        var $target = $(e.target);
        var facet = $target.attr('data-facet');
        $('.btn-' + facet + ' button').removeClass('active');
        $(e.target).addClass('active');
        this.views[facet].render();
    }
});
