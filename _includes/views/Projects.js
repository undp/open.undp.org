views.Projects = Backbone.View.extend({
    el: '#project-items',
    initialize: function() {
        this.collection.on('change', this.render, this);
    },
    render: function() {

        $('#total-count').html(accounting.formatNumber(this.collection.length));
        $('#total-donors').html(accounting.formatNumber(_(this.collection.donors).size()));
        $('#total-budget').html(accounting.formatMoney(this.collection.budget));
        $('#total-expenditure').html(accounting.formatMoney(this.collection.expenditure));

        this.$el.html(templates.projects(this));
        _(this.collection.first(50)).each(function(model) {
            this.$('tbody').append(templates.project({ model: model }));
        });
        return this;

    }
});
