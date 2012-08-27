// Model
models.Project = Backbone.Model.extend({
    defaults: { active: true },
    url: function() {
        return 'api/projects/' + this.get('id') + '.json';
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
                
            this[facet.id + 'Budget'] = _.reduce(this.models, function(res,obj) {
                if (_.isArray(obj.attributes[facet.id])) {
                    _.each(obj.attributes[facet.id], function(o) {
                        if (!(o in res)) {
                            res[o] = obj.attributes.budget;
                        } else {
                            res[o] += obj.attributes.budget;
                        }
                    });
                } else {
                    if (!(obj.attributes[facet.id] in res)) {
                        res[obj.attributes[facet.id]] = obj.attributes.budget;
                    } else {
                        res[obj.attributes[facet.id]] += obj.attributes.budget;
                    }
                }
                return res;
            }, {});
        }, this);

        // Total budget
        this.budget = this.reduce(function(memo, project) {
            return memo + parseFloat(project.get('budget'));
        }, 0);

        // Total expenditure
        this.expenditure = this.reduce(function(memo, project) {
            return memo + parseFloat(project.get('expenditure'));
        }, 0);

        this.trigger('update');
    },
    url: 'api/project_summary.json',
    model: models.Project,
    comparator: function(model) {
        return -1 * model.get('budget');
    } 
});
