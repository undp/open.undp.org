views.App = Backbone.View.extend({
    events: {
        'click a.filter': 'setFilter',
        'keyup #filters-search': 'searchFilter',
        'click #filters .label': 'toggleFilter',
        'click .btn-mini': 'toggleChart',
        'click .map-btn': 'mapLayerswitch',
        'click .reset': 'clearForm'
    },

    initialize: function(options) {
        var view = this;

        this.render();

        // Filters follow scrolling
        var top = $('#filters').offset().top - 78;
        $(window).on('scroll', function () {
            var y = $(this).scrollTop();
            if (y >= top) {
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
    },

    render: function() {
        this.$el.empty().append(templates.app(this));
        window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);

        return this;
    },

    setFilter: function(e) {
        var $target = $(e.target),
            path = '',
            parts = $target.attr('id').split('-');
            filters = [{
                collection: parts[0],
                id: parts[1]
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

        // Close the state of menu items before
        // we navigate and set things up again.
        $('.topics').toggleClass('active', false);
        $('.topics a').toggleClass('active', false);
        $('.topics').toggleClass('filtered', false);

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

            view.render(true);
        });

        // Open all filter facets on search
        if (val === '') {
            $('.topics').toggleClass('active', false);
        } else {
            $('.topics').toggleClass('active', true);
        }
    },

    clearForm: function(e) {
        $(e.target).parent().find('input').val('');
        return false;
    },

    toggleFilter: function (e) {
        var $target = $(e.target),
            cat = $target.attr('data-category'),
            $parent = $('#' + cat);

        // Bail on the this function if the user has selected
        // a label that has an active filtered selection.
        if ($parent.hasClass('filtered')) return false;

        if ($parent.hasClass('active')) {
            $parent.toggleClass('active', false);
            this.views[cat].active = false;
        } else {
            $('.topics').each(function () {
                // Loop through all the filtered menus
                // to close active menus providing they don't 
                // have an active filtered selection.
                if (!$(this).hasClass('filtered')) {
                    $(this).toggleClass('active', false);
                }
            });
            $parent.toggleClass('active', true);
            this.views[cat].active = true;
        }
        return false;
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
        $target.addClass('active');
        if ($target.html() == 'Budget') {
            $target.parent().parent().children('.chart-legend').css('display','block');
        } else {
            $target.parent().parent().children('.chart-legend').css('display','none');
        }
        this.views[facet].render();
        return false;
    }
});
