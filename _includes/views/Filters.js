views.Filters = Backbone.View.extend({
    el: '#filter-items',
    events: {
        'click a.filter': 'filterStyle'
    },
    initialize: function() {
        this.render();
    },
    render: function() {
        this.$el.append(templates.filters(this));
        return this;
    },
    filterStyle: function(e) {
        var $this = $(event.target);
        var parent = $this.parent().parent();
        if($this.hasClass('active')) {
            $this.removeClass('active');
        } else {
            $('a', parent).removeClass('active');
            $this.addClass('active');
        }
    }
});
