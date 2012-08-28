views.ProjectProfile = Backbone.View.extend({
    initialize: function() {
        this.render();
        $('#all-projects').on('click', function(e) {
            if (app.app) {
                e.preventDefault();
                window.history.back();
            }
        });
    },
    render: function() {
        $('html, body').scrollTop(0);
        this.$el.empty().append(templates.projectProfile(this)).show();
        return this;
    }
});
