views.Donor = Backbone.View.extend({
    el: '#donor-pie',

    initialize: function() {
        this.render();
    },

    render: function() {
        var view = this;
        view.donorFilter =_(app.app.filters).findWhere({collection:"donor_countries"});
        var donor = view.donorFilter.id;
        app.donor = true;
        view.buildPie(donor)
    },
    // Builds donor modality bar chart, uses flot.js
    buildPie: function(donor) {
        $('#totals-table').empty();
        // Get data for charts       
        $.getJSON( "api/donors/total-modality.json", function(totalData ) {
            var totals = []
            var data = []
            
            var c = 0;
            var totals = _(totalData).map(function(val, label){
                // Format data for bar chart
                var tempData = []
                tempData.push(c, val)
                c = c + 1;
                return tempData;
            });
            
            $.getJSON( "api/donors/donor-modality.json", function(donorData) {
                var country = []
                var index = 0;
                var rows = []
                var sum = []
                rows.push('<tr><td><b>Modality</b></td><td><b>Country Total</b></td><td><b>All Donors Total</b></td><td><b>Country as percent of all donations</b></td></tr>')
                var dtotals = _(donorData[donor][0]).map(function(val, label){
                    // Format data for pie chart
                    var dataPiece = {};
                    dataPiece.label = label;
                    val < 0 ? dataPiece.data = 0 : dataPiece.data = val;
                    var perc = ((val/totals[index][1]) * 100).toFixed(1);
                    var mil = '$' + (val/1000000).toFixed(2);
                    var tMil = '$' + (totals[index][1]/1000000).toFixed(2);
                    var cleanLabel = label.replace(' ','').toLowerCase();
                    rows.push('<tr class="'+cleanLabel+'"><td>'+ label +'</td><td>' + mil + 'M</td><td>' + tMil + 'M</td><td>' + perc +'% </td></tr>')
                    country.push(dataPiece);
                    // Format data for totals
                    var tempData = []
                    sum.push(val)
                    tempData.push(index, val/1000000)
                    index = index + 1;
                    return tempData;
                });
                _(rows).each(function(row){
                    $('#totals-table').append(row)
                })
            renderPie(country, donor, sum);
            });
        });

        function renderPie(data, donor, sum) {

            var pieOptions = {
                series: {
                    pie: { 
                        show: true,
                        radius: 1,
                        label: {
                            show: true,
                            radius: 2/3,
                            formatter: function(label, series){
                                return '<div style="font-size:8pt;text-align:center;font-weight: 600;margin:-10px;color:white;">'+label+'</div>';
                            },
                            threshold: 0.2
                        }
                    }
                },
                colors: ["#FFE491", "#a1cbe8",'#FFD066','#7686B2','#EF876F'],
                legend: {
                    show: false
                },
                grid: {
                    hoverable: true 
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%p.0%, %s", // show percentages, rounding to 2 decimal places
                    shifts: {
                        x: 0,
                        y: -35
                    },
                    defaultTheme: false
                }
            };
            var total=0;
            for(var i in sum) { total += sum[i]; }
            if (total == 0){
                // Send chart to the DOM
                $('#pie-placeholder').text('No contributions from this donor.')
            } else {
                // Send chart to the DOM
                $.plot($('#pie-placeholder'), data, pieOptions);
            }
        };
    },
});