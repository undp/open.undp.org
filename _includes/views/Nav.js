views.Nav = Backbone.View.extend({
    el: '#left-nav',

    initialize: function () {
        this.render();
    },

    render: function() {
        $(this.el).empty().append(templates.nav());
        // add about functionalities
        $('#mainnav a.parent-link').click(function(e) { //TODO avoid initial click which changes path
            e.preventDefault();
            var $target = $(e.target);

            if ($target.parent().hasClass('parent-active')) {
                $target.parent().removeClass('parent-active');
            } else {
                $target.parent().addClass('parent-active');
            }
        });

        return this;
    }
});