define(function(require) {
  /*
    DEPENDENCIES
   */
  
  require('flot');
  require('flot.stack');
  require('flot.resize');
  // TODO Check if necessary require('flot.tooltip');
  require('flot.time');
  var Humanize = require('utils/humanize');

  /*
    CONSTRUCTOR
   */

   return {
    'plot': _plotGraph
   }

  /*
    FUNCTION DEFINITIONS
   */

  function _plotGraph(response, info) {
    series = [];

    var attributes = info.monitor_resources.split(',');

    if (info.labels) {
      labels = info.labels.split(',')
    }

    for (var i = 0; i < attributes.length; i++) {
      var attribute = attributes[i];

      var data = response.monitoring[attribute];

      if (data) {
        if (info.derivative == true) {
          derivative(data);
        }

        series.push({
          stack: attribute,
          // Turns label TEMPLATE/BLABLA into BLABLA
          label: labels ? labels[i] : attribute[i].split('/').pop(),
          data: data
        });
      }
    }

    var humanize = info.humanize_figures ?
        Humanize.size : function(val) { return val };

    var options = {
      //        colors: [ "#cdebf5", "#2ba6cb", "#6f6f6f" ]
      colors: ["#2ba6cb", "#707D85", "#AC5A62"],
      legend : {show : (info.div_legend != undefined),
                 noColumns: attributes.length,
                 container: info.div_legend
               },
      xaxis : {
        tickFormatter: function(val, axis) {
          return Humanize.prettyTimeAxis(val, info.show_date);
        },
        color: "#efefef",
        size: 8
      },
      yaxis : {
        tickFormatter: function(val, axis) {
          return humanize(val, info.convert_from_bytes, info.y_sufix);
        },
        min: 0,
        color: "#efefef",

        size: 8
      },
      series: {
        lines: {
          lineWidth: 1
        }
      },
      grid: {
        borderWidth: 1,
        borderColor: "#efefef"
      }
    };

    if (series.length > 0) {
      $.plot(info.div_graph, series, options);
    };
  }
});
