views.ProjectProfile = Backbone.View.extend({
    initialize: function() {
        this.render();
    },
    render: function() {
        this.$el.empty().append(templates.projectProfile(this));
        return this;
    }
});
