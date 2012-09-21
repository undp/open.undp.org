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
        
        // Filters follow scrolling
        $(window).on('scroll', function() {
            if($(window).scrollTop() >= 140) {
                $('#content-right').addClass('fixed');
            } else {
                $('#content-right').removeClass('fixed');
            }
        });
        
        function mapsize() {
            if($(window).width() <= 960) {
                $('#profilemap').parent().parent().parent().attr('class', 'span8');
            } else {
                $('#profilemap').parent().parent().parent().attr('class', 'span4');
            }
            $('#flickr').css('height',$('#flickr').width()*.33);
        }
        mapsize();
        $(window).resize(function(){mapsize();});
        
        $('#profile .summary').removeClass('off');
    },
    
    render: function() {
    
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
        
        return this;
    }
});
