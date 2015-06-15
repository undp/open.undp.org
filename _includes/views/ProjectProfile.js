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
        _.bindAll(this,'contracts');
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
            
            
             if (typeof filterDocNames == "object" && filterDocNames.length !== 0) {
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
        
        this.contracts(this.model.get('id'));
        
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
    },
    
    contracts: function(id) {
    	
    	google.load("visualization", "1", {packages:["table"], 'callback': function(){
        	var apiUrl = 'https://www.googleapis.com/fusiontables/v2/query';
        	var datasource = '1ax65en-NNrqI71-66QS52uvYTU3sKI6tg9M0KZMA';
        	var sql = 'SELECT SUM(AMOUNT_USD),PO_ID,VENDOR_NAME,VENDOR_CLASSIFICATION,PO_DT FROM ' + datasource + ' WHERE PROJECT = ' + id + ' GROUP BY PO_ID,VENDOR_NAME,VENDOR_CLASSIFICATION,PO_DT ORDER BY PO_ID';
        	var key = 'AIzaSyCu3LqZDIDAj5f7uWzIJaI0BESvOxuAuUg';
        	var mask = {
        		"Beneficiary Family": "Individual",
        		"Fellow": "Individual",
        		"Meeting Participant" : "Individual", 
        		"Service Contract": "Consultant",
        		"SSA / IC": "Consultant",
        		"Staff": "Individual",
        		"UNV": "UNV"
        	}
        	
        	queue()
        	.defer($.getJSON, apiUrl + '?sql=' + encodeURI(sql) + '&key=' + key)
        	.await(function(ftable){
            	if (ftable.rows.length > 0) {
            		var tableData = {
            			"cols": [
            			    {"label": "PO ID", "type": "string"},
            			    {"label": "Vendor", "type": "string"},
            			    {"label": "Date", "type": "date"},
            			    {"label": "Amount (USD)", "type": "number"}
            			],
            			"rows": []
            		};
            		$.each(ftable.rows, function(i, row) {
            			var tableRow = {
            				c:[
            				   {v: row[1]},
            				   {v: (typeof mask[row[3]] !== 'undefined') ? mask[row[3]] : row[2]},
            				   {v: new Date(row[4])},
            				   {v: row[0], f: accounting.formatMoney(row[0])}
            				]
            			};
            			tableData.rows.push(tableRow);
            		});
            		var data = new google.visualization.DataTable(tableData);
            		var table = new google.visualization.Table(document.getElementById('contracts-table'));
            		$('.contracts-container > h2').html('Payments or purchases')
                    table.draw(data, {showRowNumber: true, allowHtml: true, page: 'enable', pageSize: 20, width: '100%'});                    
            	}
        	});
        }});
    }
});
