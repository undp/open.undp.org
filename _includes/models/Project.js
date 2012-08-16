// Model
models.Project = Backbone.Model.extend({
    url: function() {
        return 'api/project/' + this.get('id') + '.json';
	}
});

// Collection
models.Projects = Backbone.Collection.extend({
    watch: function() {
        this.update();
        this.on('reset', this.update, this);
    },
    update: function() {

        if (!this.length) return false;

        // Count projects for each facet
        _(facets).each(function(facet) {
            this[facet.id] = _(this.pluck(facet.id))
                .chain()
                .flatten()
                .groupBy(function(n) { return n; })
                .reduce(function (obj, v, k) {
                    obj[k] = v.length;
                    return obj;
                }, {})
                .value();
        }, this);

        // Total budget
        this.budget = this.reduce(function(memo, project) {
            return memo + parseFloat(project.get('budget'));
        }, 0);

        // Total expenditure
        this.expenditure = this.reduce(function(memo, project) {
            return memo + parseFloat(project.get('expenditure'));
        }, 0);

        this.trigger('change');
    },
    url: 'api/project_summary.json',
    model: models.Project,
    comparator: function(model) {
        return -1 * model.get('budget');
    } 
});
