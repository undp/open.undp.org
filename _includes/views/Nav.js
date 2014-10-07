views.Nav = Backbone.View.extend({
    el: '#left-nav',
    template: _.template($('#navTemplate').html()),
    initialize: function (options) {
        this.options = options || false;
        this.render();
    },

    render: function() {

        this.$el.html(this.template());
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

        // TODO: Nav jumble that needs clean-up
        // things are still page-based...
        if (this.options.add === 'about') {
            // UI
            $('#app .view').hide();
            $('#unit-contact').hide();
            $('#about .section').hide();

            $('#about').show();
            $('#about #' + this.options.subnav).show();

            // menu
            $('#mainnav li').removeClass('active');
            $('#aboutnav li').removeClass('active');

            $('#mainnav li.parent').addClass('parent-active');
            $('#aboutnav li a[href="#about/' + this.options.subnav + '"]').parent().addClass('active');

        } else if (this.options.add === 'topDonors'){
            // UI
            $('#app .view').hide();
            $('#unit-contact').hide();

            $('#top-donors').show();

            // menu
            $('#mainnav li').removeClass('active');
            $('#mainnav li.parent').removeClass('parent-active');
            $('#donor-nav li a').removeClass('active');

            $('#mainnav li a[href="#top-donors/regular"]').parent().addClass('active');
            $('#donor-nav li a[href="#top-donors/' + this.options.category + '"]').addClass('active');

        } else if (this.options.add === 'project') {
            // UI
            $('#app .view').hide();

            // menu
            $('#mainnav li').removeClass('active');
            $('#mainnav li').first().addClass('active');
            $('#mainnav li.parent').removeClass('parent-active');
        }
    }
});