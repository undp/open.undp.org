views.WidgetProjectsTitle = Backbone.View.extend({
    initialize: function () {
        this.render();
    },

    render: function() {
        var view = this;
        if (this.options.context === 'projects') {
            var active = this.collection.where({ active: true }),
                appliedFilters;

            if (active.length) {
                appliedFilters = active;
            } else {
                appliedFilters = this.collection.filter(function(model) {
                    var length = (model.collection.where({ visible: true }).length > 100) ? 1 : 0;
                    return (model.get('visible') && model.get('count') > length);
                });
            }

            if (appliedFilters.length) {
                var title = title || ['The following includes projects'];
                _(appliedFilters).each(function(model) {
                    if (view.collection.id === 'operating_unit') {
                        title.push(' for the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> office');
                    }
                    if (view.collection.id === 'region') {
                        title.push(' in the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> region');
                    }
                    if (view.collection.id === 'donors') {
                        title.push(' funded by the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>'); 
                    }
                    if (view.collection.id === 'focus_area') {
                        title.push(' with a focus on <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');
                    }
                    view.$el.html(title.shift() + title.join(',') + '.');                    
                });
            } else {
                view.$el.text('All Projects');
            }
        }
        return this;
    }
});
