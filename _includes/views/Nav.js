views.Nav = Backbone.View.extend({
    el: '#left-nav',

    initialize: function () {
        this.render();
    },

    render: function() {
        $(this.el).empty().append(templates.nav());
        return this;
    }
});