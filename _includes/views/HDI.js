views.HDI = Backbone.View.extend({
    initialize: function() {
        this.render();
    },

    render: function() {
        var view = this,
            unit = view.options.unit,
            hdiWorld = HDI['A-000'];
            
            app.hdi = true;
            
            view.hdiChart(HDI[unit],hdiWorld);
            view.hdiDetails(HDI[unit]);
        
        $('#hdi').html(_.last(HDI[unit].hdi)[1]);
        $('.map-btn[data-value="hdi"] .total-caption').html('HDI');
    },
    
    // Builds HDI bar chart
    hdiChart: function(country,world) {
        $('#chart-hdi h3').html('Human Development Index');
        $('.data', '#chart-hdi').empty().append(
            '<div class="total" style="width:' + _.last(country.hdi)[1]*100 + '%">' + _.last(country.hdi)[1] + '</div>' +
            '<div class="subdata total" style="width:' + _.last(world.hdi)[1]*100 + '%;"></div>' +
            '<div class="health" style="width:' + _.last(country.health)[1]*100 + '%">' + _.last(country.health)[1] + '</div>' +
            '<div class="subdata health" style="width:' + _.last(world.health)[1]*100 + '%;"></div>' +
            '<div class="education" style="width:' + _.last(country.education)[1]*100 + '%">' + _.last(country.education)[1] + '</div>' +
            '<div class="subdata education" style="width:' + _.last(world.education)[1]*100 + '%;"></div>' +
            '<div class="income" style="width:' + _.last(country.income)[1]*100 + '%">' + _.last(country.income)[1] + '</div>' +
            '<div class="subdata income" style="width:' + _.last(world.income)[1]*100 + '%;"></div>'
        );
        $('#chart-hdi .ranking').html(country.rank + '<span class="outof">/' + HDI.total + '</span>');
    },

    // Builds HDI historical graph, uses flot.js
    hdiDetails: function(data) {

        var beginYr = _.first(data.hdi)[0],
            endYr = _.last(data.hdi)[0],
            ctry = data.hdi,
            health = data.health,
            ed = data.education,
            inc = data.income;

        var sparklineOptions = {
            xaxis: {show: false, min: beginYr, max: endYr},
            yaxis: {show: false, min: 0, max: 1},
            grid: { show: true, borderWidth: 0, color: '#CEDEDD', minBorderMargin: 0,
                markings: function (axes) {
                    var markings = [];
                    for (var x = 5; x < axes.xaxis.max; x += 5)
                        markings.push({ xaxis: { from: x, to: x }, lineWidth: 1, color: '#CEDEDD' });
                    for (var y = 0.2; y < axes.yaxis.max; y += 0.2)
                        markings.push({ yaxis: { from: y, to: y }, lineWidth: 1, color: '#CEDEDD' });
                    return markings;
                }
            },
            series: {
                lines: { lineWidth: 1 },
                shadowSize: 0
            },
            colors: ['#96CCE6', '#70B678', '#DC9B75', '#036']
        };

        var points = {points: { show:true, radius: 1 }};

        if (beginYr === endYr) {
            _.extend(sparklineOptions.series, points);
            endYr = '';
        }

        $('#xlabel .beginyear').html(beginYr);
        $('#xlabel .endyear').html(endYr);

        if (data.change > 0) {
            $('#chart-hdi .change').html('<div class="trend hdi-up"></div>' + Math.round(data.change*1000)/1000);
        } else if (data.change < 0) {
            $('#chart-hdi .change').html('<div class="trend hdi-down"></div>' + Math.round(data.change*1000)/1000);
        } else {
            $('#chart-hdi .change').html('<div class="trend hdi-nochange">--</div>' + Math.round(data.change*1000)/1000);
        }

        $.plot($("#sparkline"), [health,ed,inc,{data: ctry, lines: {lineWidth: 1.5}}], sparklineOptions);
    }
});