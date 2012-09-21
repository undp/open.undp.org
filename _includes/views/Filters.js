views.Filters = Backbone.View.extend({
    initialize: function () {
        this.collection.on('update', this.render, this);
    },
    render: function() {
        var view = this,
            filterModels = [],
            chartModels = [],
            active = this.collection.where({ active: true });

        if ($('.btn-' + this.collection.id).html()) {
            var chartType = $('.btn-' + this.collection.id + ' button.active').html().toLowerCase();
        }

        if(active.length) {
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
                $('#applied-filters .operating_unit').html('All Offices');
            }
        }

        if (filterModels.length) {
            this.$el.html(templates.filters(this));
            
            if (view.collection.id != 'operating_unit') {
                $('#applied-filters .' + view.collection.id).remove();
            }

            _(filterModels).each(function(model) {
                view.$('.filter-items').append(templates.filter({ model: model }));
                $('#' + view.collection.id + '-' + model.id).toggleClass('active', model.get('active'));
                $('#' + view.collection.id + '-' + model.id).parent().parent().toggleClass('active', model.get('active'));
                $('#' + view.collection.id + '-' + model.id).parent().parent().prev().toggleClass('active', model.get('active'));
                if (model.get('active')) {
                    if (view.collection.id == 'operating_unit') {
                        $('#applied-filters .operating_unit').html(model.get('name'));
                    } else {
                        $('#applied-filters').append('<span class="' + view.collection.id + '"> <i class="icon-white icon-chevron-right"></i> '+ model.get('name') + '</span>');
                    }
                }
            });
            
            if (view.active) {
                $('#' + view.collection.id + ' .label').addClass('active');
                $('#' + view.collection.id + ' .filter-items').addClass('active');
            }
            
        } else {
            this.$el.empty();
        }

        if (chartModels.length === 1) {
            $('#chart-' + this.collection.id).css('display','none');
            /*
            $('.data', '#chart-' + this.collection.id).empty().addClass('hidden');
            $('.caption', '#chart-' + this.collection.id).empty().addClass('hidden');
            $('.btn-' + this.collection.id).addClass('hidden');
            $('.placeholder', '#chart-' + this.collection.id)
                .empty()
                .removeClass('hidden')
                .text(chartModels[0].get('name'));
            */

        } else if (chartModels.length > 1) { 
            var max = chartModels[0].get(chartType);

            // Build charts
            $('.placeholder', '#chart-' + this.collection.id).empty().addClass('hidden');
            $('.btn-' + this.collection.id).removeClass('hidden');
            $('.data', '#chart-' + this.collection.id).empty().removeClass('hidden');
            $('.caption', '#chart-' + this.collection.id).empty().removeClass('hidden');
            $('#chart-' + this.collection.id).css('display','block');

            _(chartModels).each(function(model) {
                if (chartType == 'budget') {
                    var label = (model.get(chartType) / max * 100) > 28 ? accounting.formatMoney(model.get(chartType)/1000000) + 'M' : '';
                } else {
                    var label = (model.get(chartType) / max * 100) > 15 ? accounting.formatNumber(model.get(chartType)) : '';
                }
                $('.data', '#chart-' + model.collection.id).append(
                    '<div style="width: ' + (model.get(chartType)/ max * 100) + '%">' + label + '</div>'
                );
                $('.caption', '#chart-' + model.collection.id).append(
                    '<div><a href="#filter/' + model.collection.id + '-' + model.get('id')
                    + '">' + model.get('name').toLowerCase() + '</a></div>'
                );
            });
        }
        
        $('#filters .label').hover(
            function () {
                $(this).children('.arrow').addClass('active');
            },
            function () {
                $(this).children('.arrow').removeClass('active');
            }
        );

        return this;
    }
});
