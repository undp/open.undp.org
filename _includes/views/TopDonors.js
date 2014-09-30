views.TopDonors = Backbone.View.extend({
    template:_.template($('#topDonors').html()),
    initialize: function () {
        // populate parent ul
        this.$el.html(this.template());
        this.$subEl = $('tbody',this.$el);

        // sub template addresses li
        this.subTemplate = _.template($('#topDonor').html());
        this.render();
    },
    render: function () {
        var count = 0;
        var that = this,
            cat = that.collection.type,
            chartModels = that.collection.models.slice(0,20),
            max = chartModels[0].get(cat);

        _(chartModels).each(function(model) {
            
            if (model.get(cat) != '' && model.get(cat)!=0) {
                this.$subEl.append(this.subTemplate({
                    name: model.get('name'),
                    id: model.get('donor_id'),
                    country: model.get('country'),
                    number: model.get(cat),
                    barWidth: model.get(cat)/max*100
                }))
            }
        },this);

    },
    update: function(cat) {
        var that = this;
        
        that.collection.comparator = function(model) {
            return -1 * model.get(cat);
        };
        that.collection.sort();
        var chartModels = that.collection.models.slice(0,20);
        var max = that.collection.models[0].get(cat);
        
        $('tbody', that.el).empty();
        _(chartModels).each(function(model) {
            if (model.get(cat) != '' && model.get(cat)!=0) {
                $('tbody', that.el).append(templates.topDonor({
                    name: model.get('name'),
                    id: model.get('donor_id'),
                    country: model.get('country'),
                    number: model.get(cat),
                    barWidth: model.get(cat)/max*100
                }));
            }
        });
    }
});
