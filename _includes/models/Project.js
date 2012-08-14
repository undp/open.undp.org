// Model
models.Project = Backbone.Model.extend({
    url: function() {
        return 'api/project/' + this.get('id') + '.json';
	},
	initialize: function() {
    	this.set({ visible: true });
        var collection = this.collection.filter.collection,
    	    id = this.collection.filter.id;
        if (collection && id) {
        	if (this.get(collection) !== id) this.set({ visible: false });
        }
	}
});

// Collection
models.Projects = Backbone.Collection.extend({
    url: 'api/project_summary.json',
    model: models.Project,
    filter: {},
    comparator: function(project) {
        return -1 * project.get('budget');
    }
});
