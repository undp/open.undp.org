---
---
var CURRENT_YR = FISCALYEARS[0],
    BASE_URL = '/',
    MAPID = "undp.map-6grwd0n3";

var IE = $.browser.msie;
if (IE) {var IE_VERSION = parseInt($.browser.version);} // should return 6, 7, 8, 9

var util = {};

// MAP
util.ctyBounds = function(coords) {
    if (coords.length > 1) {
        var polyline = L.polyline(_.flatten(_.flatten(coords,true),true));
    } else {
        var polyline = L.polyline(coords[0]);
    }
    var bbox = polyline.getBounds();


    return [[bbox.getSouthWest().lng, bbox.getSouthWest().lat],
            [bbox.getNorthEast().lng, bbox.getNorthEast().lat]];
}

// define map center based on region filter
util.regionCenter = function(region) {
    var coord,
        zoom;
    if (region === "RBA"){
        coord = [0,20];
        zoom =3;
    } else if (region === "RBAP"){
        coord = [37,80];
        zoom =2;
    } else if (region === "RBAS" || region === "PAPP"){
        coord = [32,32];
        zoom = 3;
    } else if (region === "RBEC"){
        coord = [50,55];
        zoom = 3;
    } else if (region === "RBLAC"){
        coord = [-2,-67]
        zoom = 2;
    } else if (region === "global"){
        coord = [0,0];
        zoom = 2;
    }

    return {"coord":coord, "zoom":zoom}
}
util.radius = function(scaleResult){
    var r = Math.round(Math.sqrt(scaleResult/ Math.PI));
    return r
}

util.scale = function(cat,feature) {
    if (cat == 'budget' || cat == 'expenditure') {
        var size = Math.round(feature.properties[cat] / 100000);
        if (size < 10) {
            return 10;
        } else {
            return size;
        }
    } else if (cat == 'hdi') {
        return Math.round(Math.pow(feature.properties[cat],2) / 0.0008);
    } else {
        return Math.round(feature.properties[cat] / 0.05);
    }
}

// https://gist.github.com/mbostock/1696080
util.request = function(url, callback) {
  var req = new XMLHttpRequest;
  req.open("GET", url, true);
  req.setRequestHeader("Accept", "application/json");
  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      if (req.status < 300) callback(null, JSON.parse(req.responseText));
      else callback(req.status);
    }
  };
  req.send(null);
}

// bolding
util.bold = function(word){
    return '<b>' + word + '</b>'
}

util.abbreviateNumber = function(n) {
  return n > 1000000 ? (+(n / 1000000).toFixed(1)).toLocaleString() + 'M' :
    n > 1000 ? (+(n / 1000).toFixed(1)).toLocaleString() + 'K' : n.toLocaleString();
};

$(document).ready(function() {
    var models = {},
        views = {},
        routers = {};

    {% include models.js %}
    {% include collections.js %}

    // Views
    {% include views/App.js %}
    {% include views/Chart.js %}
    {% include views/Filters.js %}
    {% include views/Nav.js %}
    {% include views/Projects.js %}
    {% include views/ProjectProfile.js %}
    {% include views/Map.js %}
    {% include views/ProjectMap.js %}
    {% include views/HDI.js %}
    {% include views/TopDonors.js %}
    {% include views/Widget.js %}
    {% include views/DonorCharts.js %}
    {% include views/DonorTexts.js %}
    {% include views/Breadcrumbs.js %}
    {% include views/YearNav.js %}
    {% include views/Facets.js %}
    {% include views/Description.js%}

    // Router
    {% include routers/Router.js %}

    // String helper
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };

    // Via https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
            'use strict';
            if (this == null) {
                throw new TypeError();
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 1) {
                n = Number(arguments[1]);
                if (n != n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n != 0 && n != Infinity && n != -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        }
    }

    // To Title Case 2.0.1 – http://individed.com/code/to-title-case/
    // Copyright © 2008–2012 David Gouch. Licensed under the MIT License.
    String.prototype.toTitleCase = function () {
      var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|vs?\.?|via)$/i;

      return this.replace(/([^\W_]+[^\s\-]*) */g, function (match, p1, index, title) {
        if (index > 0 && index + p1.length !== title.length &&
          p1.search(smallWords) > -1 && title.charAt(index - 2) !== ":" &&
          title.charAt(index - 1).search(/[^\s\-]/) < 0) {
          return match.toLowerCase();
        }

        if (p1.substr(1).search(/[A-Z]|\../) > -1) {
          return match;
        }

        return match.charAt(0).toUpperCase() + match.substr(1);
      })
        // Words that should be all caps
        .replace(/Un\b/g, 'UN ')
        .replace(/Undp/g, 'UNDP')
        .replace(/Unesco/g, 'UNESCO')
        .replace(/Unfip/g, 'UNFIP')
        .replace(/Unocha\/central_emg_resp_fund/g, 'UNOCHA Central Emg Resp Fund')
        .replace(/Unocha/g, 'UNOCHA')
        .replace(/Mdtfo\\jp_mdg-F_conflict_\&_pb/g, 'MDTFO / JP MDG-F Conflict & PB')
        .replace(/Bcpr/g, 'BCPR')
        .replace(/Dfid/g, 'DFID')
        .replace(/Usaid/g, 'USAID')
        .replace(/Unaids/g, 'UNAIDS')
        .replace(/Mdtfo\\jp_peace_building_fund/g, 'MDTFO / JP Peace Building Fund')
        .replace(/Jp/g, 'JP')
        .replace(/Pb/g, 'PB')
        .replace(/south Korea/g, 'South Korea')
        .replace(/ivoire\b/g, 'Ivoire')
        .replace(/brussels/g, 'Brussels')
        .replace(/geneva/g, 'Geneva')
        .replace(/copenhagen/g, 'Copenhagen')
        .replace(/tokyo/g, 'Tokyo')
        .replace(/liaison/g, 'Liaison')
        .replace(/Mdtfo/g, 'MDTFO')
        .replace(/Aa for Jp/g, 'AA for JP')
        .replace(/Gtz\b/g, 'GTZ')
        .replace(/Mdg\b/g, 'MDG')
        .replace(/Hiv\b/g, 'HIV')
        .replace(/Bra\b/g, 'BRA')
        .replace(/BCPR/g, 'Bureau for Crisis Prevention and Recovery')
        .replace(/'Belarus$'/g, 'Belarus')
        .replace(/Bolivia/g, 'Bolivia (Plurinational State of)')
        .replace(/Bom ofc of Asst Administrator \b/g, 'Bureau of Management')
        .replace(/Bratislava Regional Center/g, 'Regional Centre in Bratislava')
        .replace(/Cameroon Republic of/g, 'Cameroon')
        .replace(/Congo/, 'Republic of Congo')
        .replace(/Democr Peoples Repub of Korea/g, 'Korea, Democratic Peoples Republic of')
        .replace(/Human Development Report Ofc/g, 'Human Development Report Office')
        .replace(/Iran Islamic Republic of/g, 'Iran (Islamic Republic of)')
        .replace(/Kyrgyzstan/g, 'Kyrgyz Republic')
        .replace(/Lao Peoples Democratic Republ/g, 'Lao Peoples Democratic Republic')
        .replace(/Latvia, Republic of/g, 'Latvia')
        .replace(/Libya/g, 'Libyan Arab Jamahiriya')
        .replace(/Democratic Republic of Republic of Congo/g, 'Democratic Republic of Congo')
        .replace(/Lithuania, Republic of/g, 'Lithuania')
        .replace(/Macedonia, former Yugoslav Rep/g, 'The former Yugoslav Republic of Macedonia')
        .replace(/Micronesia, Federated Statesof/g, 'Micronesia')
        .replace(/Moldova, Republic of/g, 'Moldova')
        .replace(/Ii\b/g, 'II')
        .replace(/Iii\b/g, 'III')
        .replace(/Iv\b/g, 'IV')
        .replace(/Vi\b/g, 'VI')
        .replace(/Vii\b/g, 'VII');
    };

    // Start the application
    global = new routers.Global();
    Backbone.history.start();
});
