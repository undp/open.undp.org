// Model
models.Project = Backbone.Model.extend({
    defaults: { visible: true },
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
        
        function calc(that,facet,category) {
            that[facet + category.capitalize()] = _.reduce(that.models, function(res,obj) {
                if (_.isArray(obj.attributes[facet])) {
                    _.each(obj.attributes[facet], function(o) {
                        if (!(o in res)) {
                            res[o] = obj.attributes[category];
                        } else {
                            res[o] += obj.attributes[category];
                        }
                    });
                } else {
                    if (!(obj.attributes[facet] in res)) {
                        res[obj.attributes[facet]] = obj.attributes[category];
                    } else {
                        res[obj.attributes[facet]] += obj.attributes[category];
                    }
                }
                return res;
            }, {});
        }

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
            
            if (facet.id == 'operating_unit') {
                this[facet.id + 'Sources'] = _(this.models)
                    .chain()
                    .reduce(function (res,obj) {
                        if (!(obj.attributes[facet.id] in res)) {
                            res[obj.attributes[facet.id]] = _.uniq(obj.attributes.donors);
                        } else {
                            res[obj.attributes[facet.id]] = _.union(res[obj.attributes[facet.id]],_.uniq(obj.attributes.donors));
                        }
                        return res;
                    }, {})
                    .reduce(function (obj, v, k) {
                        obj[k] = v.length;
                        return obj;
                    }, {})
                    .value();
            }
                
            calc(this,facet.id,'budget');
            calc(this,facet.id,'expenditure');
            
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
