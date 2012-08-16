// Model
models.Project = Backbone.Model.extend({
    url: function() {
        return 'api/project/' + this.get('id') + '.json';
	}
});

// Collection
models.Projects = Backbone.Collection.extend({
    update: function() {
        this.donors = _(this.pluck('donors')).uniq().length;

        this.budget = this.reduce(function(memo, project) {
            return memo + parseFloat(project.get('budget'));
        }, 0);

        this.expenditure = this.reduce(function(memo, project) {
            return memo + parseFloat(project.get('expenditure'));
        }, 0);
    },
    url: 'api/project_summary.json',
    model: models.Project,
    comparator: function(model) {
        return -1 * model.get('budget');
    } 
});
