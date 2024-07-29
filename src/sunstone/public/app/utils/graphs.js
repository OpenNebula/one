/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

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
        Humanize.size : function(val) { 
          return (val * 100).toFixed() / 100 
        };
    //var valueX,valueY;
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
        font: {
          color: "#999",
          size: 10
        }
      },
      yaxis : {
        tickFormatter: function(val, axis) {
          this.valueY = val;
          return humanize(val, info.convert_from_bytes, info.y_sufix);
        },
        min: 0,
        color: "#efefef",
        font: {
          color: "#999",
          size: 10
        },
        zoomRange:[1, 10*1024*1024]
      },
      series: {
        lines: {
          lineWidth: 1,
          show: true
        },
        shadowSize: 0
      },
      grid: {
        borderWidth: 1,
        borderColor: "#efefef"
      },
      zoom: {
        interactive: true
      },
      pan: {
        interactive: true
      }
    };
    //options.xaxis.zoomRange = false;
    options.yaxis.panRange = false;
    if (series.length > 0) {
      $.plot(info.div_graph, series, options);
    };
  }

  function derivative(data) {
    for (var i = 0; i < data.length - 1; i++) {
      // Each elem is [timestamp, cumulative value]
      var first = data[i];
      var second = data[i + 1];

      // value now - value before / seconds
      var speed = (second[1] - first[1]) / (second[0] - first[0]);

      // The first element is replaced with the second one
      data[i] = [first[0], speed];
    }

    // The last elem must be removed
    data.pop();
  }
});
