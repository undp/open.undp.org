views.WidgetProjects = Backbone.View.extend({
    el: '#project-items',
    events: {
        'click .embed-load a': 'loadMore',
        'click #embed-project-table th': 'sortProjects'
    },

    initialize: function() {
        this.$el.html(templates.projects(this));
        this.collection.on('update', this.render, this);
        this.table = $('#embed-project-table');
        this.low = 50,
        this.high = 100;
    },

    render: function() {
        var view = this;
        var pageType = Backbone.history.fragment.split('/')[0];
        var models = _(this.collection.filter(function(model) {
                return model.get('visible');
            }));

        models = models.first(10);

        $('#total-count').html(accounting.formatNumber(this.collection.length));
        $('#total-budget').html(accounting.formatMoney(this.collection.budget / 1000000) + 'M');
        $('#total-expenditure').html(accounting.formatMoney(this.collection.expenditure / 1000000) + 'M');

        if (models.length) {
            this.$('tbody', view.table).empty();
            _(models).each(function(model) {
                this.$('tbody', view.table).append(templates.project({ model: model }));
            });
            if (models.length < 10) {
                $('.load').hide();
            } else {
                $('.load').show();
            }
        } else {
            this.$('tbody', view.table).empty().append('<tr><td><em>No projects</em></td><td></td><td></td></tr>');
        }
        return this;
    },

    loadMore: function(e) {
        var self = this;
        this.low = this.high;
        this.high += 50;

        var models = _(this.collection.filter(function(model) {
                return model.get('visible');
            })).slice(self.low,self.high);

        if (models.length) {
            _(models).each(function(model) {
                this.$('tbody', view.table).append(templates.project({ model: model }));
            });
        } else {
            $(e.target).text('All Projects Loaded').addClass('disabled');
        }

        return false;
    },

    sortProjects: function(e) {
        var view = this;
        var that = this.collection,
            $target = $(e.target);

        $('th', view.table).removeClass('sort-down sort-up');

        // Toggle sorting by descending/ascending
        if ($target.attr('data-sort') === that.sortData) {
            if (that.sortOrder === 'desc') {
                that.sortOrder = 'asc';
                if (that.sortData === 'name') {
                    $target.addClass('sort-up');
                } else {
                    $target.addClass('sort-down');
                }
            } else {
                that.sortOrder = 'desc';
                if (that.sortData === 'name') {
                    $target.addClass('sort-down');
                } else {
                    $target.addClass('sort-up');
                }
            }
        } else {
            that.sortData = $target.attr('data-sort');
            that.sortOrder = (that.sortData === 'name') ? 'asc' : 'desc';
            $target.addClass('sort-up');
        }

        this.collection.models = _.sortBy(that.models, function(model) {
            if (that.sortOrder === 'desc') {
                if (that.sortData === 'name') {
                    return -model.get(that.sortData).toLowerCase().charCodeAt(0);
                } else {
                    return -model.get(that.sortData);
                }
            } else {
                return model.get(that.sortData);
            }
        });

        this.render();
        return false;
    }
});
