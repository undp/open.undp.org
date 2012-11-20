views.WidgetMap = Backbone.View.extend({
    events: {
        'mouseover img.mapmarker': 'tooltipFlip'
    },
    initialize: function() {
        this.render();
        if (this.collection) {
            this.collection.on('update', this.render, this);
        }
    },
    render: function() {
        var that = this,
            layer,
            unit = (this.collection) ? this.collection
                : this.model.get('operating_unit_id');

        // Get HDI data
        $.getJSON('api/hdi.json', function(data) {

            var hdiWorld = _.find(data,function(d){return d.name == 'World';});
            hdiWorld.count = _.max(data,function(d){return d.rank;}).rank;

            var hdiArray = _.reduce(data, function(res,obj) {
                if (((_.isObject(unit)) ? unit.operating_unit[obj.id] : obj.id === unit) && obj.hdi) {
                    res[obj.id] = {
                        hdi: obj.hdi,
                        health: obj.health,
                        education: obj.education,
                        income: obj.income,
                        rank: obj.rank
                    };
                }
                return res;
            }, {});

            if (that.collection) {
                layer = 'count';
                that.collection.hdi = hdiArray;
                that.collection.hdiWorld = hdiWorld;
                if ($('#operating_unit .filter').hasClass('active')) {
                    var hdi = _.filter(data, function(d) {
                        return d.id == _.keys(unit.operating_unit);
                    })[0];

                    $('.map-btn[data-value="hdi"] .total-caption').html('HDI');

                    if (_.size(hdiArray) > 0) {
                        $('#hdi').html(_.last(hdi.hdi)[1]);
                        that.hdiChart(hdi,hdiWorld);
                        that.hdiDetails(hdi);
                    } else {
                        $('#hdi').html('no data');
                    }
                } else {
                    $('#hdi').html(_.last(hdiWorld.hdi)[1]);
                    $('.map-btn[data-value="hdi"] .total-caption').html('HDI Global');
                }
            } else {
                layer = 'budget';
                that.model.set('hdi',hdiArray[unit]);
                that.model.set('hdiWorld',hdiWorld);
            }
        }).success(function() {
                that.$el.empty().append('<div class="inner-shadow"></div>');
                that.buildMap(layer);
        });

        return this;
    },
    updateMap: function(layer) {
        var that = this,
            markers = this.map.layers[2],

            radii = function(f) {
                f.properties.description = that.tooltip(layer,f.properties);
                return clustr.area_to_radius(
                    Math.round(that.scale(layer,f))
                );
            };

        markers.sort(function(a,b){ return b.properties[layer] - a.properties[layer]; })
            .factory(clustr.scale_factory(radii, "rgba(0,85,170,0.6)", "#0B387C"));
    },
    buildMap: function(layer) {
        var that = this,
            locations = [],
            count, sources, budget, title, hdi, hdi_health, hdi_education, hdi_income,
            unit = (this.collection) ? this.collection
                : this.model.get('operating_unit_id'),

            // if unit is an object we're working with the homepage map, else the project map
            homepage = _.isObject(unit);

        mapbox.auto(this.el, 'undp.map-6grwd0n3', function(map) {
            that.map = map;
            map.setZoomRange(2, 17);

            var radii = function(f) {
                f.properties.description = that.tooltip(layer,f.properties);
                return clustr.area_to_radius(
                    Math.round(that.scale(layer,f))
                );
            };

            var markers = mapbox.markers.layer();

            if (homepage) {
                markers.factory(clustr.scale_factory(radii, "rgba(0,85,170,0.6)", "#0B387C"))
                    .sort(function(a,b){ return b.properties[layer] - a.properties[layer]; });
            }

            $.getJSON('api/operating-unit-index.json', function(data) {
                for (var i = 0; i < data.length; i++) {
                    var o = data[i];
                    if ((homepage) ? unit.operating_unit[o.id] : o.id === unit) {

                        if (!homepage) {
                            that.getwebData(o);
                            $('#country-summary').html(templates.ctrySummary(o));
                        }

                        if (o.lon) {
                            if (homepage) {
                                count = unit.operating_unit[o.id];
                                sources = unit.operating_unitSources[o.id];
                                budget = unit.operating_unitBudget[o.id];
                                expenditure = unit.operating_unitExpenditure[o.id];
                            } else {
                                count = false;
                                sources = false;
                                budget = that.model.get('budget');
                                expenditure = that.model.get('expenditure');
                            }
                            if ((homepage) ? unit.hdi[o.id] : that.model.get('hdi')) {
                                if (homepage) {
                                    hdi = _.last(unit.hdi[o.id].hdi)[1];
                                    hdi_health = _.last(unit.hdi[o.id].health)[1];
                                    hdi_education = _.last(unit.hdi[o.id].education)[1];
                                    hdi_income = _.last(unit.hdi[o.id].income)[1];
                                    hdi_rank = unit.hdi[o.id].rank;
                                } else {
                                    hdi = _.last(that.model.get('hdi').hdi)[1];
                                    hdi_health = _.last(that.model.get('hdi').health)[1];
                                    hdi_education = _.last(that.model.get('hdi').education)[1];
                                    hdi_income = _.last(that.model.get('hdi').income)[1];
                                    hdi_rank = that.model.get('hdi').rank;
                                }
                            } else {
                                hdi = hdi_health = hdi_education = hdi_income = hdi_rank = 'no data';
                            }

                            locations.push({
                                geometry: {
                                    coordinates: [
                                        o.lon,
                                        o.lat
                                    ]
                                },
                                properties: {
                                    id: o.id,
                                    project: (homepage) ? '' : that.model.get('project_title'),
                                    name: o.name,
                                    count: count,
                                    sources: sources,
                                    budget: budget,
                                    expenditure: expenditure,
                                    hdi: hdi,
                                    hdi_health: hdi_health,
                                    hdi_education: hdi_education,
                                    hdi_income: hdi_income,
                                    hdi_rank: hdi_rank
                                }
                            });

                            if (!homepage) {
                                locations[0].properties['marker-color'] = '#2970B8';
                            }
                        }
                    }
                }

                if (locations.length !== 0) {
                    markers.features(locations);
                    mapbox.markers.interaction(markers);
                    map.extent(markers.extent());
                    map.addLayer(markers);
                    if (locations.length === 1) {
                        map.zoom(4);
                    }
                } else {
                    map.centerzoom({lat:20,lon:0},2);
                }
            });
        });
    },

    scale: function(cat,x) {
        if (cat == 'budget' || cat == 'expenditure') {
            return Math.round(x.properties[cat] / 100000);
        } else if (cat == 'hdi') {
            return Math.round(Math.pow(x.properties[cat],2) / 0.0008);
        } else {
            return Math.round(x.properties[cat] / 0.05);
        }
    },

    tooltip: function(layer,data) {
        var description;
        if (layer == 'hdi') {
            description = '<div class="data-labels"><div>HDI</div><div>Health</div><div>Education</div><div>Income</div></div>' +
                '<div class="data"><div class="total" style="width:' + data.hdi*150 + 'px">' + data.hdi + '</div>' +
                '<div class="subdata total" style="width:' + _.last(this.collection.hdiWorld.hdi)[1]*150 + 'px;"></div>' +
                '<div class="health" style="width:' + data.hdi_health*150 + 'px">' + data.hdi_health + '</div>' +
                '<div class="subdata health" style="width:' + _.last(this.collection.hdiWorld.health)[1]*150 + 'px;"></div>' +
                '<div class="education" style="width:' + data.hdi_education*150 + 'px">' + data.hdi_education + '</div>' +
                '<div class="subdata education" style="width:' + _.last(this.collection.hdiWorld.education)[1]*150 + 'px;"></div>' +
                '<div class="income" style="width:' + data.hdi_income*150 + 'px">' + data.hdi_income + '</div>' +
                '<div class="subdata income" style="width:' + _.last(this.collection.hdiWorld.income)[1]*150 + 'px;"></div></div>';

            data.title = data.name + '<div class="subtitle">rank: ' + data.hdi_rank + '</div>';
        } else {
            description = '<div class="stat">Budget: <span class="value">' +
                accounting.formatMoney(data.budget) + '</span></div>' +
                '<div class="stat">Expenditure: <span class="value">' +
                accounting.formatMoney(data.expenditure) + '</span></div>';

            data.title = data.project + '<div class="subtitle">' + data.name + '</div>';

            // add this if we're counting projects (on homepage)
            if (data.count) {
                description = '<div class="stat">Projects: <span class="value">' +
                    data.count + '</span></div>' +
                    ((data.sources > 1) ? ('<div class="stat">Funding Sources: <span class="value">' +
                    data.sources + '</span></div>') : '') +
                    description +
                    '<div class="stat">HDI: <span class="value">' +
                    data.hdi + '</span></div>';

                data.title = data.name;
            }
        }

        return description;
    },

    tooltipFlip: function(e) {
        var $target = $(e.target),
            top = $target.offset().top - this.$el.offset().top;
        if (top <= 150) {
            var tipSize = $('.marker-popup').height() + 50;
            $('.marker-tooltip').addClass('flip')
                .css('margin-top',tipSize + $target.height());
        }
    }
});
