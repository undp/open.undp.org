views.ProjectProfile = Backbone.View.extend({
    events: {
        'click .load a': 'loadMore'
    },

    initialize: function() {
        this.render();

        var outputID = this.options.gotoOutput;
        if (outputID) {
            window.setTimeout(function() { window.scrollTo(0, $('#output-' + outputID).offset().top); }, 0);
        }

        $('#all-projects').on('click', function(e) {
            if (app.app) {
                e.preventDefault();
                window.history.back();
            }
        });

        $('#profile .summary').removeClass('off');
        this.low = 10,
        this.high = 10;
    },

    render: function() {
        $('#breadcrumbs ul').html(
            '<li><a href="#">Home</a></li>'
            + '<li><a href="/undp-projects/">Our Projects</a></li>'
            + '<li><a href="#filter/operating_unit-' + this.model.get('operating_unit_id') + '">' + this.model.get("operating_unit") + '</a></li>'
            + '<li><a href="#project/' + this.model.get('id') + '">' + this.model.get('id') + '</a></li>'
        );

        var startDate = new Date(this.model.get('start')),
            endDate = new Date(this.model.get('end')),
            curDate = new Date(),
            progress = ((curDate - startDate) / (endDate - startDate)) * 100;
            that = this;

        this.model.attributes.budget = _.chain(this.model.attributes.outputs)
            .map(function (o) { return o.budget })
            .flatten()
            .reduce(function(memo, num){ return memo + num; }, 0)
            .value();

        this.model.attributes.expenditure = _.chain(this.model.attributes.outputs)
            .map(function (o) { return o.expenditure })
            .flatten()
            .reduce(function(memo, num){ return memo + num; }, 0)
            .value();

        this.model.attributes.budgetyears = _.reduce(this.model.attributes.outputs, function (res, obj) {
            _.each(obj.fiscal_year, function(o,i) {
                res[o] = (res[o] || 0) + obj.budget[i];
            });
            return res;
            },{});

        this.model.attributes.expendyears = _.reduce(this.model.attributes.outputs, function (res, obj) {
            _.each(obj.fiscal_year, function(o,i) {
                res[o] = (res[o] || 0) + obj.expenditure[i];
            });
            return res;
            },{});

        var start = new Date(this.model.get('start')).format('M d, Y');
        var end = new Date(this.model.get('end')).format('M d, Y');

        // Filter out any image files from showing up
        var filterDocuments = _(this.model.get('document_name')[1]).filter(function(d) {
            return !(/\.(gif|jpg|jpeg|tiff|png)$/i).test(d);
        });
        var documents = [];

        if (filterDocuments.length !== 0) {
            _(filterDocuments).each(function(d, i) {
                documents[i] = {};
                documents[i].title = (d.split('/').pop()).split(/(.)[^.]*$/)[0].replace('_', ' ');
                documents[i].filetype = d.split('.').pop();
                documents[i].src = d;
            });
        }

        window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);
        this.$el.empty().append(templates.projectProfile({
            start: start,
            end: end,
            base: BASE_URL,
            documents: documents,
            model: this.model
        })).show();

        // If first load is a project page or output, don't animate
        if (app.app && this.options.gotoOutput == false) {
            $('#profile .summary').addClass('off');
        }

        this.map = new views.Map({
            el: '#profilemap',
            model: this.model
        });

        $('#progress').find('.bar').css('width', progress + '%');

        if (_.isEmpty(this.model.get('document_name'))) {
            $('.widget-options ul li.doc-opt').hide();
        } else {;
            $('.widget-options ul li.doc-opt').show();
            this.docPhotos();
        }

        this.$('#outputs').empty()
        var outputs = this.model.attributes.outputs.slice(0, 9);
        _(outputs).each(function(model) {
            this.$('#outputs').append(templates.projectOutputs({ model: model }));
        });

        // Project Outputs
        (this.model.attributes.outputs.length < 10) ? $('.load').hide() : $('.load').show();

        // Append menu items to the breadcrumb
        $('breadcrumbs').find('ul').remove();

        return this;
    },

    loadMore: function(e) {
        this.low = this.high;
        this.high += 10;

        var outputs = this.model.attributes.outputs.slice(this.low, this.high);

        if (outputs.length) {
            _(outputs).each(function(model) {
                this.$('#outputs').append(templates.projectOutputs({ model: model }));
            });
        } else {
            $(e.target).text('All Projects Loaded').addClass('disabled');
        }

        return false;
    },

    docPhotos: function() {
        var photos = [];
        _.each(this.model.get('document_name')[0], function (photo, i) {

            var filetype = photo.split('.')[1].toLowerCase(),
                source = that.model.get('document_name')[1][i];

            if (filetype === 'jpg' || filetype === 'jpeg' || filetype === 'png' || filetype === 'gif') {
                var img = new Image();
                img.onload = goodImg;
                img.src = source;

                function goodImg(e) {
                    photos.push({
                        'title': photo.split('.')[0],
                        'source': source,
                        'image': img
                    });
                }
            }
        });

        this.model.attributes.docPhotos = photos;
    }
});
