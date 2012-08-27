views.Projects = Backbone.View.extend({
    el: '#project-items',
    initialize: function() {
        this.collection.on('update', this.render, this);
        $('input[type="search"]').on('keyup', _.bind(this.search, this));
    },
    render: function() {

        var donor = _(app.app.filters).find(function(filter) {
                return filter.collection === 'donors';
            }),
            models = _(this.collection.filter(function(model) {
                return model.get('active');
            })).first(50);

        // Probably should replace this with donor name
        donor = (donor) ? 1 : _(this.collection.donors).size();

        $('#total-count').html(accounting.formatNumber(this.collection.length));
        $('#total-donors').html(accounting.formatNumber(donor));
        $('#total-budget').html(accounting.formatMoney(this.collection.budget));
        $('#total-expenditure').html(accounting.formatMoney(this.collection.expenditure));

        this.$el.html(templates.projects(this));

        if (models.length) {
            _(models).each(function(model) {
                this.$('tbody').append(templates.project({ model: model }));
            });
        } else {
            this.$('tbody').append('<tr><td><em>No projects</em></td><td></td><td></td></tr>');

        }

        return this;
    },
    search: function (e) {
        var $target = $(e.target),
            val = $target.val().toLowerCase();

        this.collection.each(function(model) {
            var name = model.get('name').toLowerCase();

            if (val === '' || name.indexOf(val) >= 0) {
                model.set('active', true);
            } else {
                model.set('active', false);
            }
        });

        this.render();
        $('html, body').animate({
            scrollTop: $('#projects-heading').offset().top
        }, 500);
    }
});
