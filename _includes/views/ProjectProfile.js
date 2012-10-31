views.ProjectProfile = Backbone.View.extend({
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
    },

    render: function() {
        var startDate = new Date(this.model.get('start').replace('-',',')),
            endDate = new Date(this.model.get('end').replace('-',',')),
            curDate = new Date(),
            progress = ((curDate - startDate)/(endDate - startDate))*100;
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

        window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);
        this.$el.empty().append(templates.projectProfile(this)).show();

        // If first load is a project page or output, don't animate
        if (app.app && this.options.gotoOutput == false) {
            $('#profile .summary').addClass('off');
        }

        this.map = new views.Map({
            el: '#profilemap',
            model: this.model
        });
        
        $('#top-stats .progress .bar').css('width',progress + '%');
        
        if (_.isEmpty(this.model.get('document_name'))) {
            $('.widget-options ul li.doc-opt').hide();
        } else {;
            $('.widget-options ul li.doc-opt').show();
            this.docPhotos();
        }
        
        return this;
    },
    
    docPhotos: function() {
        var photos = [];
        _.each(this.model.get('document_name')[0], function (photo, i) {
            var filetype = photo.split('.')[1];
            if (filetype == 'jpg' || filetype == 'png' || filetype == 'gif') {
                photos.push({
                    'title': photo.split('.')[0],
                    'source': that.model.get('document_name')[1][i]
                })
            }
        });
            
        this.model.attributes.docPhotos = photos;
        //if (photos) loadPhoto(0);
        
        function loadPhoto(i) {
            $('#flickr').css('background','url("' + photos[i].source + '") center 38% no-repeat');
            
            $('#flickr .next').click(function() {
                if (i == 0) {
                    $('#flickr .prev').css('display','block');
                }
                i += 1;
                if (i == photos.length - 1) {
                    $('#flickr .next').css('display','none');
                }
                loadPhoto(i);
            });
            $('#flickr .prev').click(function() {
                if (i == photos.length - 1) {
                    $('#flickr .next').css('display','block');
                }
                i -= 1;
                if (i == 0) {
                    $('#flickr .prev').css('display','none');
                }
                loadPhoto(i);
            });
        }
    }
});
