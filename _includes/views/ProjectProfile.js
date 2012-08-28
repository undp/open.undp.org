views.ProjectProfile = Backbone.View.extend({
    initialize: function() {
        this.render();
        $('#all-projects').on('click', function(e) {
            if (app.app) {
                e.preventDefault();
                window.history.back();
            }
        });
        function mapsize() {
            if($(window).width() <= 1168) {
                $('#profilemap').parent().parent().parent().attr('class', 'span11');
            } else {
                $('#profilemap').parent().parent().parent().attr('class', 'span4');
            }
        }
        mapsize();
        $(window).resize(function(){mapsize();});
    },
    render: function() {
        $(window).scrollTop(0);
        
        this.model.attributes.budget = _.chain(this.model.attributes.subproject)
            .map(function (o) { return o.budget })
            .reduce(function(memo, num){ return memo + num; }, 0)
            .value();
                        
        this.$el.empty().append(templates.projectProfile(this)).show();          
        return this;
    }
});
