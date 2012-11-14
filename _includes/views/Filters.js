views.Filters = Backbone.View.extend({
    initialize: function () {
        this.collection.on('update', this.render, this);
    },
    render: function(keypress) {
        var view = this,
            filterModels = [],
            chartModels = [],
            active = this.collection.where({ active: true }),
            chartType = 'budget';

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

            filterModels = this.collection.filter(function(model) {
                    var length = (model.collection.where({ visible: true }).length > 100) ? 1 : 0;
                    return (model.get('visible') && model.get('count') > length);
                });

            chartModels = _(this.collection.sortBy(function(model) {
                    return -1 * model.get(chartType) || 0;
                })
                .filter(function(model) {
                    return (model.get(chartType) > 0);
                }))
                .first(20);
            if (this.collection.id === 'operating_unit') {
                $('#applied-filters').addClass('no-country');
            }
            if (this.collection.id === 'region') {
                $('#applied-filters').addClass('no-region');
            }
            $('#applied-filters.no-country.no-region').html('All Projects');
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
                        + model.get('name').toLowerCase().toTitleCase()
                        + '</a></li>'
                    );

                    if (view.collection.id == 'operating_unit') {
                        $('#applied-filters').removeClass('no-country').html('Projects in ' + model.get('name').toLowerCase().toTitleCase());
                    } else if (view.collection.id == 'region') {
                        $('#applied-filters.no-country').removeClass('no-region').html(model.get('name').toLowerCase().toTitleCase());
                    }
                }
            });

        } else {
            this.$el.empty();
        }

        if (chartModels.length <= 1 && this.collection.id !== 'focus_area') {
            $('#chart-' + this.collection.id).parent().css('display','none');

       } else {

            if (this.collection.id === 'focus_area') {
                chartModels = this.collection.models;

                var total = chartModels.reduce(function(memo, model) {
                    return memo + (model.get('budget') || 0 ); 
                }, 0);

                $('#chart-' + this.collection.id).empty();
                _(chartModels).each(function(model, i) {
                    $('#chart-' + model.collection.id).append(
                        '<div class="focus fa' + model.id + '">' +
                        '    <div class="fa-icon"></div>' +
                        '    <div class="caption"></div>' +
                        '    <div class="pct"></div>' +
                        '</div>');

                    $('.fa' + (model.id) + ' .caption').text(model.get('name').toLowerCase().toTitleCase());
                    $('.fa' + (model.id) + ' .pct').text(((model.get('budget') || 0) / total * 100).toFixed(0) + '%');
                });
            } else {

                var max = chartModels[0].get('budget');

                _(chartModels).each(function(model) {
                    var budget = accounting.formatMoney(model.get('budget')/1000000) + 'M';
                    var expenditure = accounting.formatMoney(model.get('expenditure')/1000000) + 'M';
                    var caption = '<a href="#filter/' + model.collection.id + '-' + model.get('id')
                        + '">' + model.get('name').toLowerCase().toTitleCase() + '</a>';
                    var bar = '<div style="width: ' + (model.get('budget')/ max * 100) + '%"></div>' + '<div class="subdata" style="width: ' + (model.get('expenditure')/ max * 100) + '%"></div>';


                    $('#chart-' + model.collection.id + ' .rows').append(
                        '<tr>' +
                        '    <td>' + caption + '</td>' +
                        '    <td class="right">' + budget + '</td>' +
                        '    <td class="data">' + bar + '</td>' +
                        '</tr>');
                });
            }
        }

        return this;
    }
});
