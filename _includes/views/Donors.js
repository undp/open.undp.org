views.Donors = Backbone.View.extend({
    el: '#donor-graphs',

    initialize: function() {
        this.render();
    },

    render: function() {
        var view = this;
            view.donorFilter =_(app.app.filters).findWhere({collection:"donor_countries"});
            donor = view.donorFilter.id;
            view.donorGraphs(donor);
        app.donor = true;
    },
    // Builds donor modality bar chart
    donorGraphs: function(donor) {
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
            function addCommas(n){
                var negative = false;
                // check for negative vales, which need to be made positive to work
                if (n < 0){
                    negative = true;
                    n = n * -1;
                }
                var rx=  /(\d+)(\d{3})/;
                return String(n).replace(/^\d+/, function(w){
                    while(rx.test(w)){
                        w= w.replace(rx, '$1,$2');
                    }
                    // check for negative vales, which need "-" added
                    if (negative){
                        w = '-' + w;
                        return w;
                    } else {
                        return w;
                    }
                });
            }
            
            $.getJSON( "api/donors/donor-modality.json", function(donorData) {
                var country = [];
                var index = 0;
                var rows = [];
                var sum = [];
                var countryTotal = donorData[donor][1];
                
                var dtotals = _(donorData[donor][0]).map(function(val, label){
                    // Format data for pie chart
                    var dataPiece = {};
                    dataPiece.label = label;
                    var mil;
                    // Set formatting for values
                    if (val == 0) { 
                        mil = 0;
                    } else if (val < 1000000 &&  val > 0) {
                        mil = (val/1000).toFixed(1) + 'K'; 
                    } else if (val < -1000) {
                        mil = addCommas((val/1000).toFixed(1)) + 'K'; 
                    } else {
                        mil = (val/1000000).toFixed(1)+ 'M'; 
                    }
                    val < 0 ? dataPiece.data = 0 : dataPiece.data = val;
                    var fundPerc;
                    val == 0 ? fundPerc = 0 : fundPerc = ((val/countryTotal) * 100).toFixed(1);
                    var totalsPerc = ((val/totals[index][1]) * 100).toFixed(1);
                    var tMil = addCommas((totals[index][1]/1000000).toFixed(1)) + 'M';
                    var cleanLabel = label.replace(' ','').toLowerCase();
                    var fundBar,
                        totalsBar;

                    if (fundPerc == 0) {
                        fundPerc = 0;
                        fundBar = '<div class="subdata"></div><div class="fund zero" fund-percent="' + fundPerc + '"></div>';
                    } else {
                        fundBar = '<div class="subdata"></div><div class="fund" fund-percent="' + fundPerc + '"></div>';
                    } 

                    if (totalsPerc == 0) {
                        totalsPerc = 0;
                        totalsBar = '<div class="subdata" data-expenditure="' + totals[index][1] + '"></div><div class="budgetdata zero" data-budget="' + totalsPerc + '"></div>';
                    } else {
                        totalsBar = '<div class="subdata" data-expenditure="' + totals[index][1] + '"></div><div class="budgetdata" data-budget="' + totalsPerc + '"></div>';
                    } 

                    rows.push({
                        sort: -1 * ((val) ? val : 0),
                        content: '<tr class="'+cleanLabel+'">' +
                                 ' <td class="wide">' + label +'</td>' +
                                 ' <td>$' + mil + '</td>' +
                                 ' <td class="block">' +
                                 '      <div class="left" >' + fundPerc +'%</div>' +
                                 '      <div class="right data wide">'+ fundBar + '</div>' +
                                 ' </td>' +
                                 ' <td class="medium">$' + tMil + '</td>' +
                                 ' <td class="block">' +
                                 '      <div class="left" >' + totalsPerc +'%</div>' +
                                 '      <div class="right data wide">'+ totalsBar + '</div>' +
                                 ' </td>' +
                                 '</tr>'
                    });

                    country.push(dataPiece);
                    // Format data for totals
                    var tempData = []
                    sum.push(val)
                    tempData.push(index, val/1000000)
                    index = index + 1;
                    return tempData;
                });
                
                // Sort rows by sort value
                rows.push({
                    sort: -100000000000,
                    content: '<tr><td><b>Modality</b></td><td><b>Country Contribution</b></td><td class="block"><b>Allocation of Contribution (%)</b><td class="medium"><b>Contributions from All Donors</b></td><td class="block"><b>Country Share of All Contributions (%)</b></td></tr>'
                });
                rows = _(rows).sortBy('sort');
                max = rows[0].sort * -1;
                rows = rows.slice(0,7);

                _(rows).each(function(row){
                    $('#totals-table').append(row.content)
                })

                $('#totals-table tr').each(function(d, e) {
                    $('.budgetdata', this).width(($(' .budgetdata', this).attr('data-budget')) + '%');
                    $('.fund', this).width(($(' .fund', this).attr('fund-percent')) + '%');
                    $('.subdata', this).width('100%');
                });
            });
        });
    },
});