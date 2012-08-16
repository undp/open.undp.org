views.Projects = Backbone.View.extend({
    el: '#project-items',
    initialize: function() {
        this.collection.on('update', this.render, this);
    },
    render: function() {
        var donor = _(app.app.filters).find(function(filter) {
            return filter.collection === 'donors';
        });

        // Probably should replace this with donor name
        donor = (donor) ? 1 : _(this.collection.donors).size();

        $('#total-count').html(accounting.formatNumber(this.collection.length));
        $('#total-donors').html(accounting.formatNumber(donor));
        $('#total-budget').html(accounting.formatMoney(this.collection.budget));
        $('#total-expenditure').html(accounting.formatMoney(this.collection.expenditure));

        this.$el.html(templates.projects(this));
        _(this.collection.first(50)).each(function(model) {
            this.$('tbody').append(templates.project({ model: model }));
        });
        return this;

    }
});
