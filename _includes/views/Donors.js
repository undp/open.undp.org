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
    el: '#donorPieChart',
    // see the template in _includes/templates/donorViz._
    // selecting #donorViz since it's the id of the template script, see _includes/templates.html
    // which is included in index.html
    //template: _.template($('#donorViz').html()),
    initialize: function() {

        app.donor = true;

        this.allDonors = new Donors();
        this.listenTo(this.allDonors,'sync',this.render);
        this.allDonors.fetch();
    },
    render: function() {
        var that = this;
        var donorFilter =_(app.app.filters).findWhere({collection:"donor_countries"}),
            donor = donorFilter.id;

        // total and donor related items from collection
        // are being calculated
        this.total = this.allDonors.total(); // total amount of the core + non-core
        this.collection = this.allDonors.selectedDonor(donor); // amount of the core + non-core of the specific donor

        var overallContrib = this.collection.findWhere({'name': 'core'}).get('value') + this.collection.findWhere({'name': 'non-core'}).get('value');

        // varibles that power the table and graph, for example
        var variables = {
            // contributions of this particular donor in each category
            'core': this.collection.findWhere({'name': 'core'}).get('value'),
            'nonCore': this.collection.findWhere({'name': 'non-core'}).get('value'),
            'costSharing': this.collection.findWhere({'name': 'cost sharing'}).get('value'),
            'unv': this.collection.findWhere({'name': 'unv'}).get('value'),
            'specialActivities': this.collection.findWhere({'name': 'special activities'}).get('value'),
            'trustFunds': this.collection.findWhere({'name': 'trust funds'}).get('value'),
            'thematicTrustFunds': this.collection.findWhere({'name': 'thematic trust funds'}).get('value'),

            // total contributions in each category
            'coreTotal': this.total.findWhere({'name': 'core'}).get('value'),
            'nonCoreTotal': this.total.findWhere({'name': 'non-core'}).get('value'),
            'costSharingTotal': this.total.findWhere({'name': 'cost sharing'}).get('value'),
            'unvTotal': this.total.findWhere({'name': 'unv'}).get('value'),
            'specialActivitiesTotal': this.total.findWhere({'name': 'special activities'}).get('value'),
            'trustFundsTotal': this.total.findWhere({'name': 'trust funds'}).get('value'),
            'thematicTrustFundsTotal': this.total.findWhere({'name': 'thematic trust funds'}).get('value'),

            // percentage (allocation) of this donor's contributions in core vs. non-core funds
            'coreAllocation': (this.collection.findWhere({'name': 'core'}).get('value') / overallContrib * 100).toFixed(1),
            'nonCoreAllocation': (this.collection.findWhere({'name': 'non-core'}).get('value') / overallContrib * 100).toFixed(1),

            // percentage (allocation) of this donor's contributions to each non-core fund category
            'costSharingAllocation': (this.collection.findWhere({'name': 'cost sharing'}).get('value') / this.collection.findWhere({'name': 'non-core'}).get('value') * 100).toFixed(1),
            'unvAllocation': (this.collection.findWhere({'name': 'unv'}).get('value') / this.collection.findWhere({'name': 'non-core'}).get('value') * 100).toFixed(1),
            'specialActivitiesAllocation': (this.collection.findWhere({'name': 'special activities'}).get('value') / this.collection.findWhere({'name': 'non-core'}).get('value') * 100).toFixed(1),
            'trustFundsAllocation': (this.collection.findWhere({'name': 'trust funds'}).get('value') / this.collection.findWhere({'name': 'non-core'}).get('value') * 100).toFixed(1),
            'thematicTrustFundsAllocation': (this.collection.findWhere({'name': 'thematic trust funds'}).get('value') / this.collection.findWhere({'name': 'non-core'}).get('value') * 100).toFixed(1),

            // this donor's percentage of the total UNDP funds in each category
            'corePct': (this.collection.findWhere({'name': 'core'}).get('value') / this.total.findWhere({'name': 'core'}).get('value') * 100).toFixed(1),
            'nonCorePct': (this.collection.findWhere({'name': 'non-core'}).get('value') / this.total.findWhere({'name': 'non-core'}).get('value') * 100).toFixed(1),
            'costSharingPct': (this.collection.findWhere({'name': 'cost sharing'}).get('value') / this.total.findWhere({'name': 'cost sharing'}).get('value') * 100).toFixed(1),
            'unvPct': (this.collection.findWhere({'name': 'unv'}).get('value') / this.total.findWhere({'name': 'non-core'}).get('value') * 100).toFixed(1),
            'specialActivitiesPct': (this.collection.findWhere({'name': 'special activities'}).get('value') / this.total.findWhere({'name': 'special activities'}).get('value') * 100).toFixed(1),
            'trustFundsPct': (this.collection.findWhere({'name': 'trust funds'}).get('value') / this.total.findWhere({'name': 'trust funds'}).get('value') * 100).toFixed(1),
            'thematicTrustFundsPct': (this.collection.findWhere({'name': 'thematic trust funds'}).get('value') / this.total.findWhere({'name': 'thematic trust funds'}).get('value') * 100).toFixed(1)
        };

        // Make the Core vs. Non-Core Pie Chart
        data = [{label: 'Core', data: variables.core, color: "#2980b9"},
               {label: 'Non-Core', data: variables.nonCore, color: "#e74c3c"}];
        $.plot($('#donorPieChart'), data, {
                series: {
                  pie: {
                      show: true,
                      radius: 0.8
                  },
                  label: {
                    show: true,
                    formatter: function(label, series) {
                      return '<div style="font-size:11px; text-align:center; color:black">'+label+'<br/>'+Math.round(series.percent)+'%<br/>$'+series.data+'</div>';
                    }
                  }
                },
                legend: {
                    show: true,
                    labelBoxBorderColor: "none",
                    labelFormatter: function(label, series) {
                      pct = series.percent.toFixed(2);
                      return label+' - '+pct+'% ($'+series.data[0][1].toLocaleString()+')';
                    }
                }
        });

        // Make the % of total core contributions bar chart
        coreData = [[0, variables.corePct]];
        var data = [
        {
            label: "Core",
            data: coreData,
            bars: {
                show: true,
                fill: true,
                lineWidth: 1,
                order: 1,
                fillColor:  "#2980b9"
            },
            color: "#2980b9"
        }];

        $.plot($('#percentCoreBar'), data, {
                xaxis: {
                  ticks: false,
                  axisLabel: 'Fund Type',
                  axisLabelUseCanvas: true,
                  axisLabelFontSizePixels: 12,
                  axisLabelFontFamily: 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
                  axisLabelPadding: 5
              },
              yaxis: {
                  axisLabel: 'Percent of Total Contributions (All Donors)',
                  axisLabelUseCanvas: true,
                  axisLabelFontSizePixels: 12,
                  axisLabelFontFamily: 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
                  axisLabelPadding: 5,
                  max: 100
              },
              legend: {
                  show: true,
                  labelBoxBorderColor: "none",
                  labelFormatter: function(label, series) {
                    pct = parseFloat(series.data[0][1]).toFixed(2);
                    return label+' - '+pct+'%';
                  }
              }
          });

        // Make the Non-core modalities pie chart
        data = [{label: 'Cost Sharing', data: variables.costSharing},
                {label: 'UNV', data: variables.unv},
                {label: 'Special Activities', data: variables.specialActivities},
                {label: 'Trust Funds', data: variables.trustFunds},
                {label: 'Thematic Trust Funds', data: variables.thematicTrustFunds}
                ];

        $.plot($('#nonCorePieChart'), data, {
                series: {
                  pie: {
                      show: true,
                      radius: 0.8
                  }
                },
                legend: {
                  show: true,
                  labelBoxBorderColor: "none",
                  labelFormatter: function(label, series) {
                    return label+' - '+series.percent.toFixed(2)+'% ($'+series.data[0][1].toLocaleString()+')';
                  }
                }
          });
      }
});
