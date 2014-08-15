views.Nav = Backbone.View.extend({
    el: '#left-nav',

    initialize: function (options) {
        this.options = options || false;
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

        // TODO: Nav jumble that needs clean-up
        // things are still page-based...
        if (this.options.add === 'about') {
            $('#app .view, #about .section, #mainnav .profile').hide();
            $('#aboutnav li, #mainnav li').removeClass('active');
    
            $('#about, #mainnav .browser').show();
            $('#aboutnav li a[href="#about/' + this.options.subnav + '"]').parent().addClass('active');
            $('#about #' + this.options.subnav).show();
            $('#mainnav li.parent').addClass('parent-active');
        } else if (this.options.add === 'topDonors'){
            $('#app .view').hide();
            $('#mainnav li.profile').hide();
            $('#mainnav li.browser').show();
            $('#mainnav li').removeClass('active');
            $('#mainnav li.parent').removeClass('parent-active');

            $('#top-donors').show();
            $('#mainnav li a[href="#top-donors/regular"]').parent().addClass('active');

            $('#donor-nav li a').removeClass('active');
            $('#donor-nav li a[href="#top-donors/' + category + '"]').addClass('active');
            $('#unit-contact').hide();
        } else if (this.options.add === 'project') {
            $('#app .view, #mainnav .browser').hide();
            $('#mainnav li').removeClass('active');
            $('#browser .summary').addClass('off');
            $('#mainnav .profile').show();
            $('#mainnav li').first().addClass('active');
            $('#mainnav li.parent').removeClass('parent-active');
        }
    }
});