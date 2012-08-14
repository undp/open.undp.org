views.Projects = Backbone.View.extend({
    el: '#project-items',
    initialize: function() {
        this.render();
        this.collection.on('reset', this.render, this);
    },
    render: function() {
        this.$el.empty().append(templates.projects(this));
        return this;
    }
});
