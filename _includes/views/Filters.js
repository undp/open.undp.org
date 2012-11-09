views.Filters = Backbone.View.extend({
    initialize: function () {
        this.collection.on('update', this.render, this);
    },
    render: function(keypress) {
        var view = this,
            filterModels = [],
            chartModels = [],
            active = this.collection.where({ active: true });

        if ($('.btn-' + this.collection.id).html()) {
            var chartType = $('.btn-' + this.collection.id + ' a.active').html().toLowerCase();
        }

        if(active.length) {

            // Add a filtered class to all parent containers
            // where an active element has been selected.
            _(active).each(function(a) {
                $('#' + a.collection.id).toggleClass('filtered', true);
            });

            filterModels = active;
            chartModels = active;
        } else {
            this.collection.sort();

            filterModels = _(this.collection.filter(function(model) {
                    return (model.get('visible') && model.get('count') > 0);
                })).first(5);

            chartModels = _(this.collection.sortBy(function(model) {
                    return -1 * model.get(chartType) || 0;
                })
                .filter(function(model) {
                    return (model.get(chartType) > 0);
                }))
                .first(5);
            if (this.collection.id === 'operating_unit') {
                $('#applied-filters').addClass('no-country');
            }
            if (this.collection.id === 'region') {
                $('#applied-filters').addClass('no-region');
            }
            $('#applied-filters.no-country.no-region').html('All Offices');
        }

        if (filterModels.length) {
            this.$el.html(templates.filters(this));

            _(filterModels).each(function(model) {
                view.$('.filter-items').append(templates.filter({ model: model }));
                $('#' + view.collection.id + '-' + model.id).toggleClass('active', model.get('active'));
                if (model.get('active') && !keypress) {
                    $('#breadcrumbs ul').append(
                        '<li><a href="/undp-projects/#filter/'
                        + view.collection.id + '-'
                        + model.get('id') + '">'
                        + model.get('name')
                        + '</a></li>'
                    );

                    if (view.collection.id == 'operating_unit') {
                        $('#applied-filters').removeClass('no-country').html(model.get('name'));
                    } else if (view.collection.id == 'region') {
                        $('#applied-filters.no-country').removeClass('no-region').html(model.get('name'));
                    }
                }
            });

        } else {
            this.$el.empty();
        }

        if (chartModels.length <= 1) {
            $('#chart-' + this.collection.id).parent().css('display','none');

       } else {
            var max = chartModels[0].get(chartType);

            // Build charts
            $('.placeholder', '#chart-' + this.collection.id).empty().addClass('hidden');
            $('.btn-' + this.collection.id).removeClass('hidden');
            $('.data', '#chart-' + this.collection.id).empty().removeClass('hidden');
            $('.caption', '#chart-' + this.collection.id).empty().removeClass('hidden');
            $('#chart-' + this.collection.id).parent().css('display','block');

            _(chartModels).each(function(model) {
                if (chartType == 'budget') {
                    var label = (model.get(chartType) / max * 100) > 15 ? accounting.formatMoney(model.get(chartType)/1000000) + 'M' : '';

                    $('.data', '#chart-' + model.collection.id).append(
                        '<div style="width: ' + (model.get(chartType)/ max * 100) + '%">' + label + '</div>'
                    );
                    $('.data', '#chart-' + model.collection.id).append(
                        '<div class="subdata" style="width: ' + (model.get('expenditure')/ max * 100) + '%"></div>'
                    );
                    $('.caption', '#chart-' + model.collection.id).append(
                        '<div><a href="#filter/' + model.collection.id + '-' + model.get('id')
                        + '">' + model.get('name').toLowerCase() + '</a></div>'
                    );
                } else {
                    var label = (model.get(chartType) / max * 100) > 10 ? accounting.formatNumber(model.get(chartType)) : '';

                    $('.data', '#chart-' + model.collection.id).append(
                        '<div style="margin-bottom:0.25em; width: ' + (model.get(chartType)/ max * 100) + '%">' + label + '</div>'
                    );
                    $('.caption', '#chart-' + model.collection.id).append(
                        '<div class="counts"><a href="#filter/' + model.collection.id + '-' + model.get('id')
                        + '">' + model.get('name').toLowerCase() + '</a></div>'
                    );
                }
            });
        }

        return this;
    }
});
