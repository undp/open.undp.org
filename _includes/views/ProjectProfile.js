views.ProjectProfile = Backbone.View.extend({
    events: {
        'click .load a': 'loadMore',
        'click .widget-config': 'requestIframe'
    },

    initialize: function() {
        if (this.options.embed){
            this.template = _.template($('#embedProjectProfile').html());
            this.subTemplate = _.template($('#embedProjectOutputs').html());
        } else {
            this.template = _.template($('#projectProfile').html());
            this.subTemplate = _.template($('#projectOutputs').html());
        }

        this.low = 10,
        this.high = 10;

        this.render();
    },

    render: function() {

        // sometimes the model doesn't get the attributes
        if (this.model.get('start') != undefined) {
            var start = this.model.get('start').split('-');
            var end = this.model.get('end').split('-');

            var startDate = new Date(start[0],start[1]-1,start[2]),
                endDate = new Date(end[0],end[1]-1,end[2]),
                curDate = new Date(),
                progress = ((curDate - startDate) / (endDate - startDate)) * 100;
                that = this;

            this.model.attributes.budget = _.chain(this.model.attributes.outputs)
                .map(function (o) { return o.budget; })
                .flatten()
                .reduce(function(memo, num){ return memo + num; }, 0)
                .value();

            this.model.attributes.expenditure = _.chain(this.model.attributes.outputs)
                .map(function (o) { return o.expenditure; })
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

            var s = this.model.get('start').split('-');
            var e = this.model.get('end').split('-');

            var start = new Date(s[0],s[1]-1,s[2]).format('M d, Y');
            var end = new Date(e[0],e[1]-1,e[2]).format('M d, Y');
        }

        var documents = [];
        if (this.model.get('document_name')) {
        	/*var filterDocNames = _(this.model.get('document_name')[0]).filter(function(n) {
                return !(/\.(gif|jpg|jpeg|tiff|png)$/i).test(n);
            });
            var filterDocUrls = _(this.model.get('document_name')[1]).filter(function(d) {
                return !(/\.(gif|jpg|jpeg|tiff|png)$/i).test(d);
            });
            var filterDocFormats = _(this.model.get('document_name')[2]).filter(function(f) {
                return !(/\.(gif|jpg|jpeg|tiff|png)$/i).test(f);
            });*/
        	var filterDocNames = this.model.get('document_name')[0];
        	var filterDocUrls = this.model.get('document_name')[1];
        	var filterDocFormats = this.model.get('document_name')[2];
            
            
             if (typeof filterDocNames != "undefined" && filterDocNames.length !== 0) {
                _(filterDocNames).each(function(d, i) {
                    documents[i] = {};
                    var title = d;
                    if (title.length > 38) {
                        documents[i].title = title.substring(0, 38) + '...';
                    } else {
                        documents[i].title = title;
                    }
                    //documents[i].filetype = d.split('.').pop();
                });
                _(filterDocUrls).each(function(d, i) {
                    documents[i].src = d.replace(/'/g, "%27"); // properly encode single quote in the URI
                });
                _(filterDocFormats).each(function(d, i) {
                	documents[i].filetype = d;
                });
                
            }
        }

        window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);

        if (this.options.embed) {
            this.$el.html(this.template({
                year: CURRENT_YR,
                start: start,
                end: end,
                documents: documents,
                model: this.model
            }))
            // Depending on the options passed into the array add a fade
            // in class to all elements containing a data-option attribute
            this.$el.find('.option').hide();
            _(this.options.embed).each(function (o) {
                $('[data-option="' + o + '"]').show();
            });

        } else {
            this.$el.html(this.template({
                start: start,
                end: end,
                base: BASE_URL,
                documents: documents,
                model: this.model
            })).show();
        }

        $('#progress').find('.bar').css('width', progress + '%');
        
        if (this.model.attributes.outputs) {
            var outputs = this.model.attributes.outputs.slice(0, 9);

            _(outputs).each(function(model) {
                $('#outputs',this.$el).append(this.subTemplate({year: CURRENT_YR, model:model}));
            },this);

            if (this.model.attributes.outputs.length < 10) {
                $('.load').hide();
            } else {
                $('.load').show();
            }
        }

        // if outputId is passed scroll to that output
        if (this.options.outputId) {
            var outputId = this.options.outputId;
            window.setTimeout(function() {
                window.scrollTo(0, $('#output-' + outputId).offset().top);
            }, 0);
        }

        new views.Breadcrumbs({
            add:'activeProject',
            projectUnitId: this.model.get('operating_unit_id'),
            projectUnitName: this.model.get("operating_unit"),
            projectName: this.model.get('id')
        });

        new views.ProjectMap({
            el: '#profilemap',
            model: this.model,
            embed: this.options.embed,
        });
        
        // load contracts
        /*var CONTRACTS_DATASOURCE = "1J3xv5DGXHCd1ct0gUtAdTmkR1tXYXC2xymscccrj";
        var query = {
    		"sql": "SELECT VENDOR_ID,VENDOR_NAME,VENDOR_DESCRIPTION,PO_ID,LINE_NBR,PO_DESCRIPTION,PO_DT,AMOUNT_USD FROM " + CONTRACTS_DATASOURCE + " WHERE PROJECT = " + this.model.get('id') + " ORDER BY PO_ID",
    		"key": "AIzaSyCu3LqZDIDAj5f7uWzIJaI0BESvOxuAuUg"
    	};
        google.load("visualization", "1", {packages:["table"]});
        google.setOnLoadCallback(drawTable);
        function drawTable() {
            $.getJSON('https://www.googleapis.com/fusiontables/v2/query', query).done(function(ftable){
            	if (ftable.rows.length > 0) {
            		var tableData = {
            			"cols": [
            			    {"label": "PO ID", "type": "string"},
            			    {"label": "Description", "type": "string"},
            			    {"label": "Amount (USD)", "type": "number"},
            			    {"label": "Items", "type": "number"},
            			    {"label": "", "type": "string", "p": {"role":"tooltip"}}
            			],
            			"rows": []
            		};
            		$.each(ftable.rows, function(i, row) {            			
            			var tableRow = {
            				c:[
            				   {v: row[3]},
            				   {v: (row[2] == 'SSA / IC') ? 'Consultant' : row[1]},
            				   {v: row[7], f: '$' + row[7]},
            				   {v: row[4]},
            				   {v: '<a href="#">' + row[3] + '</a>'}
            				]
            			};
            			tableData.rows.push(tableRow);
            		});
            		//{v: (row[2] == 'SSA / IC') ? 'Consultant' : row[1]}
            		var data = new google.visualization.DataTable(tableData);
            		var table = new google.visualization.Table(document.getElementById('contracts-table'));
                    table.draw(data, {showRowNumber: true, allowHtml: true});
            	}
            });        	
        }*/

        return this;
    },

    loadMore: function(e) {
        this.low = this.high;
        this.high += 10;

        var outputs = this.model.attributes.outputs.slice(this.low, this.high);

        if (outputs.length) {
            _(outputs).each(function(model) {
                $('#outputs',this.$el).append(this.subTemplate({year: CURRENT_YR, model:model}));
            },this);
        } else {
            $(e.target).text('All Projects Loaded').addClass('disabled');
        }

        return false;
    },

    requestIframe: function() {
        var el = $('#widget'),
            widgetEl;

        var widgetOpts = ['title','map','outputs'];

        $('.widget-options a',el).removeClass('active');

        _(widgetOpts).each(function(widgetTitle){
            widgetEl =widgetTitle + '-opt';
            $("." + widgetEl).find('a').addClass('active');
        })

        var embedPath = location.hash.replace('project', 'widget/project');

        var defaultIframe = '<iframe src="{{site.baseurl}}/embed.html' + embedPath + '?' +
                        widgetOpts.join('&') + '" width="100%" height="100%" frameborder="0"> </iframe>';

        $('.widget-preview', el).html(defaultIframe); // this is where the json is getting called
        $('.widget-code', el)
            .val(defaultIframe.replace('src="{{site.baseurl}}/','src="' + Backbone.history.location.origin + '/'))
            .select();
    }
});
