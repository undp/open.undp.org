// Model
models.Project = Backbone.Model.extend({
    url: function() {
        return 'api/project/' + this.get('id') + '.json';
	}
});

// Collection
models.Projects = Backbone.Collection.extend({
    url: 'api/project_summary.json',
    model: models.Project,
    comparator: function(project) {
        return -1 * project.get('budget');
    } 
});
