// a donor collection built with the donors.json
// with two built in filter machanism
// one for the total, one for the selected donor
Donors = Backbone.Collection.extend({
    url:'api/donors/donors.json',
    total:function(){
        var total = this.filter(function(m){return m.get('donor-country') === 'all';});
        return new Donors(total)
    },
    selectedDonor: function(donor){
        var selected = this.filter(function(m){return m.get('donor-country') === donor;});
        return new Donors(selected)
    },
    initialize:function(){}
});

views.Donors = Backbone.View.extend({
    el: '#donor-graphs',
    // see the template in _includes/templates/donorViz._
    // selecting #donorViz since it's the id of the template script, see _includes/templates.html
    // which is included in index.html
    template: _.template($('#donorViz').html()),
    initialize: function() {

        app.donor = true;

        this.allDonors = new Donors();
        this.listenTo(this.allDonors,'sync',this.render);
        this.allDonors.fetch();
    },
    render: function(){
        var that = this;
        var donorFilter =_(app.app.filters).findWhere({collection:"donor_countries"}),
            donor = donorFilter.id;

        // total and donor related items from collection
        // are being calculated
        this.total = this.allDonors.total(); // total amount of the core + non-core
        this.collection = this.allDonors.selectedDonor(donor); // amount of the core + non-core of the specific donor

        var overallContrib = this.collection.findWhere({'name': 'core'}).get('value') + this.collection.findWhere({'name': 'non-core'}).get('value');

        // varibles that power the table and graph, for example
        var varibles = {
            'core': this.collection.findWhere({'name': 'core'}).get('value'),
            'nonCore': this.collection.findWhere({'name': 'non-core'}).get('value'),
            'costSharing': this.collection.findWhere({'name': 'cost sharing'}).get('value'),
            'unv': this.collection.findWhere({'name': 'unv'}).get('value'),
            'specialActivities': this.collection.findWhere({'name': 'special activities'}).get('value'),
            'trustFunds': this.collection.findWhere({'name': 'trust funds'}).get('value'),
            'thematicTrustFunds': this.collection.findWhere({'name': 'thematic trust funds'}).get('value'),

            'costSharingTotal': this.total.findWhere({'name': 'cost sharing'}).get('value'),
            'unvTotal': this.total.findWhere({'name': 'unv'}).get('value'),
            'specialActivitiesTotal': this.total.findWhere({'name': 'special activities'}).get('value'),
            'trustFundsTotal': this.total.findWhere({'name': 'trust funds'}).get('value'),
            'thematicTrustFundsTotal': this.total.findWhere({'name': 'thematic trust funds'}).get('value'),

            'coreAllocation': (this.collection.findWhere({'name': 'core'}).get('value') / overallContrib * 100).toFixed(2),
            'nonCoreAllocation': (this.collection.findWhere({'name': 'non-core'}).get('value') / overallContrib * 100).toFixed(2),

            'costSharingAllocation': (this.collection.findWhere({'name': 'cost sharing'}).get('value') / this.collection.findWhere({'name': 'non-core'}).get('value') * 100).toFixed(2),
            'unvAllocation': (this.collection.findWhere({'name': 'unv'}).get('value') / this.collection.findWhere({'name': 'non-core'}).get('value') * 100).toFixed(2),
            'specialActivitiesAllocation': (this.collection.findWhere({'name': 'special activities'}).get('value') / this.collection.findWhere({'name': 'non-core'}).get('value') * 100).toFixed(2),
            'trustFundsAllocation': (this.collection.findWhere({'name': 'trust funds'}).get('value') / this.collection.findWhere({'name': 'non-core'}).get('value') * 100).toFixed(2),
            'thematicTrustFundsAllocation': (this.collection.findWhere({'name': 'thematic trust funds'}).get('value') / this.collection.findWhere({'name': 'non-core'}).get('value') * 100).toFixed(2),

            'corePct': (this.collection.findWhere({'name': 'core'}).get('value') / this.total.findWhere({'name': 'core'}).get('value') * 100).toFixed(2),
            'nonCorePct': (this.collection.findWhere({'name': 'non-core'}).get('value') / this.total.findWhere({'name': 'non-core'}).get('value') * 100).toFixed(2),
            'costSharingPct': (this.collection.findWhere({'name': 'cost sharing'}).get('value') / this.total.findWhere({'name': 'cost sharing'}).get('value') * 100).toFixed(2),
            'unvPct': (this.collection.findWhere({'name': 'unv'}).get('value') / this.total.findWhere({'name': 'non-core'}).get('value') * 100).toFixed(2),
            'specialActivitiesPct': (this.collection.findWhere({'name': 'special activities'}).get('value') / this.total.findWhere({'name': 'special activities'}).get('value') * 100).toFixed(2),
            'trustFundsPct': (this.collection.findWhere({'name': 'trust funds'}).get('value') / this.total.findWhere({'name': 'trust funds'}).get('value') * 100).toFixed(2),
            'thematicTrustFundsPct': (this.collection.findWhere({'name': 'thematic trust funds'}).get('value') / this.total.findWhere({'name': 'thematic trust funds'}).get('value') * 100).toFixed(2)
        };

        this.$el.html(this.template(varibles));


        /////////////OLD FOR REFERENCE ONLY////////////////
        // Get data for charts
        // $.getJSON( "api/donors/total-modality.json", function(totalData ) {
        //     var totals = []
        //     var data = []
        //     var c = 0;
        //     var totals = _(totalData).map(function(val, label){
        //         // Format data for bar chart
        //         var tempData = []
        //         tempData.push(c, val)
        //         c = c + 1;
        //         return tempData;
        //     });


        //     $.getJSON( "api/donors/donor-modality.json", function(donorData) {
        //         var country = [];
        //         var index = 0;
        //         var rows = [];
        //         var sum = [];
        //         var countryTotal = donorData[donor][1];

        //         var dtotals = _(donorData[donor][0]).map(function(val, label){
        //             // Format data for pie chart
        //             var dataPiece = {};
        //             dataPiece.label = label;
        //             var mil;
        //             // Set formatting for values
        //             if (val == 0) {
        //                 mil = 0;
        //             } else if (val < 1000000 &&  val > 0) {
        //                 mil = (val/1000).toFixed(1) + 'K';
        //             } else if (val < -1000) {
        //                 mil = that.addCommas((val/1000).toFixed(1)) + 'K';
        //             } else {
        //                 mil = (val/1000000).toFixed(1)+ 'M';
        //             }
        //             val < 0 ? dataPiece.data = 0 : dataPiece.data = val;
        //             var fundPerc;
        //             val == 0 ? fundPerc = 0 : fundPerc = ((val/countryTotal) * 100).toFixed(1);
        //             var totalsPerc = ((val/totals[index][1]) * 100).toFixed(1);
        //             var tMil = that.addCommas((totals[index][1]/1000000).toFixed(1)) + 'M';
        //             var cleanLabel = label.replace(' ','').toLowerCase();
        //             var fundBar,
        //                 totalsBar;

        //             if (fundPerc == 0) {
        //                 fundPerc = 0;
        //                 fundBar = '<div class="subdata"></div><div class="fund zero" fund-percent="' + fundPerc + '"></div>';
        //             } else {
        //                 fundBar = '<div class="subdata"></div><div class="fund" fund-percent="' + fundPerc + '"></div>';
        //             }

        //             if (totalsPerc == 0) {
        //                 totalsPerc = 0;
        //                 totalsBar = '<div class="subdata" data-expenditure="' + totals[index][1] + '"></div><div class="budgetdata zero" data-budget="' + totalsPerc + '"></div>';
        //             } else {
        //                 totalsBar = '<div class="subdata" data-expenditure="' + totals[index][1] + '"></div><div class="budgetdata" data-budget="' + totalsPerc + '"></div>';
        //             }

        //             console.log(totalsBar)

        //             rows.push({
        //                 sort: -1 * ((val) ? val : 0),
        //                 content: '<tr class="'+cleanLabel+'">' +
        //                          ' <td class="wide">' + label +'</td>' +
        //                          ' <td>$' + mil + '</td>' +
        //                          ' <td class="block">' +
        //                          '      <div class="left" >' + fundPerc +'%</div>' +
        //                          '      <div class="right data wide">'+ fundBar + '</div>' +
        //                          ' </td>' +
        //                          ' <td class="medium">$' + tMil + '</td>' +
        //                          ' <td class="block">' +
        //                          '      <div class="left" >' + totalsPerc +'%</div>' +
        //                          '      <div class="right data wide">'+ totalsBar + '</div>' +
        //                          ' </td>' +
        //                          '</tr>'
        //             });

        //             country.push(dataPiece);
        //             // Format data for totals
        //             var tempData = []
        //             sum.push(val)
        //             tempData.push(index, val/1000000)
        //             index = index + 1;
        //             return tempData;
        //         });

        //         // Sort rows by sort value

        //         rows = _(rows).sortBy('sort');
        //         max = rows[0].sort * -1;
        //         rows = rows.slice(0,7);

        //         _(rows).each(function(row){
        //             $('#totals-table tbody').append(row.content)
        //         })
        //     });
        // });
    },
});
