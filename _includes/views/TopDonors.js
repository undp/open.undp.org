views.TopDonors = Backbone.View.extend({
    initialize: function () {
        this.$el.html(templates.topDonors(this));
        this.render();
    },
    render: function () {
        var that = this;
        _(this.collection.models).each(function(model) {
            $('tbody', that.el).append(templates.topDonor({ model: model }));
        });
    }
});