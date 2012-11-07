views.Projects = Backbone.View.extend({
    el: '#project-items',
    events: {
        'click .load': 'loadMore',
        'click table tr': 'routeToProject',
        'click .table th': 'sortProjects'
    },
    initialize: function() {
        this.$el.html(templates.projects(this));
        this.collection.on('update', this.render, this);
        $('#projects input[type="search"]').on('keyup', _.bind(this.search, this));

        this.low = 50,
        this.high = 100;
    },
    loadMore: function(e) {
        var self = this;
        this.low = this.high;
        this.high += 50;

        $(window).on('scroll', function() {
            if  ($(window).scrollTop() === ($(document).height() - $(window).height())) {
                self.loadMore();
            }
        });

        var models = _(this.collection.filter(function(model) {
                return model.get('visible');
            })).slice(self.low,self.high);

        if (models.length) {
            _(models).each(function(model) {
                this.$('#project-table tbody').append(templates.project({ model: model }));

                // Remove the load more link once this is clicked we can
                // load more entries on scroll.
                if (e !== undefined) $(e.target).remove();
            });
        }

        return false;
    },
    routeToProject: function(e) {
        var id = $(e.currentTarget).attr('id');
        app.navigate(id, {trigger: true});
    },
    render: function() {
    
        var pageType = Backbone.history.fragment.split('/')[0];

        var donor = _(app.app.filters).find(function(filter) {
                return filter.collection === 'donors';
            }),
            models = _(this.collection.filter(function(model) {
                return model.get('visible');
            }));
            
        models = (pageType === 'widget') ? models.first(10) : models.first(50);

        // Probably should replace this with donor name
        donor = (donor) ? 1 : _(this.collection.donors).size();

        $('#total-count').html(accounting.formatNumber(this.collection.length));
        $('#total-donors').html(accounting.formatNumber(donor));
        $('#total-budget').html(accounting.formatMoney(this.collection.budget / 1000000) + 'M');
        $('#total-expenditure').html(accounting.formatMoney(this.collection.expenditure / 1000000) + 'M');

        if (models.length) {
            this.$('#project-table tbody').empty();
            _(models).each(function(model) {
                this.$('#project-table tbody').append(templates.project({ model: model }));
            });
            if (pageType === 'widget') {
                (models.length < 10) ? $('.load.button').hide() : $('.load.button').show();
            } else {
                (models.length < 50) ? $('.load.button').hide() : $('.load.button').show();
            }
        } else {
            this.$('#project-table tbody').empty().append('<tr><td><em>No projects</em></td><td></td><td></td></tr>');

        }

        return this;
    },
    search: function (e) {
        var view = this;

        // pasted values seem to need this delay
        window.setTimeout(function() {
            var $target = $(e.target),
                val = $target.val().toLowerCase(),
                mode = (val.substr(0, 3) === '000') ? 'id' : 'name';

            view.collection.each(function(model) {
                var name = model.get(mode).toLowerCase();

                if (val === '' || name.indexOf(val) >= 0) {
                    model.set('visible', true);
                } else {
                    model.set('visible', false);
                }
            });

            view.render();
        }, 100);

        if ($('body').scrollTop !== $('#projects-heading').offset().top + 1) {
            $('html, body').animate({
                scrollTop: $('#projects-heading').offset().top + 1
            }, 500);
        }
    },
    sortProjects: function(e) {
        var that = this.collection,
            $target = $(e.target);
            
        e.preventDefault();
        e.stopPropagation();
        $('.table th').removeClass('sort-down sort-up');
        
        // Toggle sorting by descending/ascending
        if ($target.attr('data-sort') == that.sortData) {
            if (that.sortOrder == 'desc') {
                that.sortOrder = 'asc';
                (that.sortData == 'name') ? $target.addClass('sort-up') : $target.addClass('sort-down');
            } else {
                that.sortOrder = 'desc';
                (that.sortData == 'name') ? $target.addClass('sort-down') : $target.addClass('sort-up');
            }
        } else {
            that.sortData = $target.attr('data-sort');
            that.sortOrder = (that.sortData == 'name') ? 'asc' : 'desc';
            $target.addClass('sort-up');
        }
        
        this.collection.models = _.sortBy(that.models, function(model) {
            if (that.sortOrder == 'desc') {
                if (that.sortData == 'name') {
                    return -model.get(that.sortData).toLowerCase().charCodeAt(0);
                } else {
                    return -model.get(that.sortData);
                }
            } else {
                return model.get(that.sortData);
            }
        });
        
        this.render();
    }
});
