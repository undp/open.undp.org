views.Projects = Backbone.View.extend({
    el: '#project-items',
    events: {
        'click .load': 'loadMore'
    },
    initialize: function() {
        this.collection.on('update', this.render, this);
        $('#projects input[type="search"]').on('keyup', _.bind(this.search, this));

        this.low = 50,
        this.high = 100;
    },
    loadMore: function() {
        var self = this;
        this.low = this.high;
        this.high += 50;

        var models = _(this.collection.filter(function(model) {
                return model.get('visible');
            })).slice(self.low,self.high);
            
        if (models.length) {
            _(models).each(function(model) {
                this.$('tbody').append(templates.project({ model: model }));
            });
        }

        return false;
    },
    render: function() {

        var donor = _(app.app.filters).find(function(filter) {
                return filter.collection === 'donors';
            }),
            models = _(this.collection.filter(function(model) {
                return model.get('visible');
            })).first(50);

        // Probably should replace this with donor name
        donor = (donor) ? 1 : _(this.collection.donors).size();

        $('#total-count').html(accounting.formatNumber(this.collection.length));
        $('#total-donors').html(accounting.formatNumber(donor));
        $('#total-budget').html(accounting.formatMoney(this.collection.budget / 1000000) + 'M');
        $('#total-expenditure').html(accounting.formatMoney(this.collection.expenditure / 1000000) + 'M');

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
        var view = this;

        // pasted values seem to need this delay
        window.setTimeout(function() {
            var $target = $(e.target),
                val = $target.val().toLowerCase(),
                mode = (val.substr(0, 3) === 'id:') ? 'id' : 'name';
    
            val = (mode === 'id') ? val.split('id:')[1].replace(/^\s\s*/, '') : val;
    
            view.collection.each(function(model) {
                var name = model.get(mode).toLowerCase();
    
                if (val === '' || name.indexOf(val) >= 0) {
                    model.set('visible', true);
                } else {
                    model.set('visible', false);
                }
            });
    
            view.render();
        }, 100);

        if ($('body').scrollTop !== $('#projects-heading').offset().top + 1) {
            $('html, body').animate({
                scrollTop: $('#projects-heading').offset().top + 1
            }, 500);
        }
    }
});
