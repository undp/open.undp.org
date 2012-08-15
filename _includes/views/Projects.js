views.Projects = Backbone.View.extend({
    el: '#project-items',
    initialize: function() {
        this.render();
        this.collection.on('reset', this.render, this);        
    },
    render: function() {
        this.$el.html(templates.projects(this));
        _(this.collection.first(50)).each(function(model) {
            this.$('tbody').append(templates.project({ model: model }));
        });
        return this;
    }
});
