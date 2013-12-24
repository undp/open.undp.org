views.Regions = Backbone.View.extend({
    el: '#region-graphs',

    initialize: function() {
        this.render();
    },

    render: function() {
        var view = this;
        view.regionGraphs();
    },

    // Regional expense graphs
    regionGraphs: function(region){
        // Clear out previous graphs
        $('#region-pie').empty();
        $('#region-bar').empty();
        
        // Build bar and pie charts
        $.getJSON( "api/donors/region-expenses.json", function(regions) {
                var pieData = []
                var expenses = _(regions).map(function(r, index){
                    // Format data for bar chart
                    var tempData = []
                    var formatExpense = r.format_expense;
                    tempData.push(index, r.expense/1000000)
                    // Format data for pie chart
                    var dataPiece = {};
                    dataPiece.label = r.id;
                    r.expense < 0 ? dataPiece.data = 0 : dataPiece.data = r.expense;
                    // var cleanLabel = label.replace(' ','').toLowerCase();
                    pieData.push(dataPiece);
                    return tempData;
                });
            // Graph functions
            renderPie(pieData);
            renderBar(expenses)
            });

        function renderPie(pieData) {

            var pieOptions = {
                series: {
                    pie: { 
                        show: true,
                        radius: 1,
                        label: {
                            show: true,
                            radius: 2/3,
                            formatter: function(label, series){
                                return '<div style="font-size:8pt;text-align:center;color:#555;">'+label+'</div>';
                            },
                            threshold: 0.2
                        }
                    }
                },
                colors: ['#92ccee','#6cB02d',"#a1cbe8",'#FFF0C2','#FFD066','#FF5B3f','#00397E'],
                legend: {
                    show: false
                },
                grid: {
                    hoverable: true 
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%p.1%, %s", // show percentages, rounding to 2 decimal places
                    shifts: {
                        x: 0,
                        y: -35
                    },
                    defaultTheme: false
                }
            };
            // Send chart to the DOM
            $.plot($('#region-pie'),pieData, pieOptions);
        };

        function renderBar(expenses) {

            var newdata = [
                {label: 'PAPP', color:'#92ccee', data: [expenses[0]] },
                {label: 'RBA', color:'#6cB02d', data:[expenses[1]] },
                {label: 'RBAP', color:'#a1cbe8', data:[expenses[2]] },
                {label: 'RBAS', color:'#FFF0C2', data: [expenses[3]] },
                {label: 'RBEC', color:'FFD066', data: [expenses[4]] },
                {label: 'RBLAC', color:'#FF5B3f', data: [expenses[5]] },
                {label: 'Global', color:'#00397E', data: [expenses[6]] },
            ];
            var options = {
                legend: {
                    show: false
                },
                grid: {
                    hoverable: true 
                },
                yaxis: {
                    max: 26,
                    minTickSize: 1.0,
                    tickDecimals: 2
                },
                xaxis: {ticks: [[0, 'PAPP'], [1, 'RBA'], [2, 'RBAP'], [3, 'RBAS'], [4, 'RBEC'], [5, 'RBLAC'], [6, 'Global']]},
                tooltip: true,
                tooltipOpts: {
                    content: "$%y.2M, %s", // show tooltips
                    shifts: {
                        x: 0,
                        y: -35
                    }
                },
                series: {
                    bars: {
                        show: true,
                        barWidth: .7,
                        align: "center"
                    }
                }
            };
            // Send chart to the DOM
            $.plot($('#region-bar'), newdata, options);
        };
    }
});