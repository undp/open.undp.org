views.TopDonors = Backbone.View.extend({
    initialize: function () {
        this.$el.html(templates.topDonors(this));
        this.render();
    },
    render: function () {
        _(this.collection.models).each(function(model) {
            this.$('tbody').append(templates.topDonor({ model: model }));
        });
    }
});