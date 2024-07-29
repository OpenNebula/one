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

  var OpenNebulaHost = require('opennebula/host');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var Graphs = require('utils/graphs');

  /*
    TEMPLATES
   */

  var TemplateInfo = require('hbs!./monitor/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./monitor/panelId');
  var RESOURCE = "Host"
  var XML_ROOT = "HOST"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Graphs");
    this.icon = "fa-chart-bar";
    this.element = info[XML_ROOT];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
  Panel.prototype.onShow = _onShow;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateInfo();
  }

  function _setup(context) {
    return false;
  }

  function _onShow(context) {
    OpenNebulaHost.monitor({
      data: {
        id: this.element.ID,
        monitor: {
          monitor_resources : "CAPACITY/USED_CPU,CAPACITY/FREE_CPU,CAPACITY/USED_MEMORY,CAPACITY/FREE_MEMORY"
        }
      },
      success: function(req, response) {
        var host_graphs = [
            {
              monitor_resources : "CAPACITY/USED_CPU,CAPACITY/FREE_CPU",
              labels : Locale.tr("Used CPU") + "," + Locale.tr("Free CPU"),
              humanize_figures : false,
              div_graph : $("#host_cpu_graph"),
              div_legend : $("#host_cpu_legend")
            },
            {
              monitor_resources : "CAPACITY/USED_MEMORY,CAPACITY/FREE_MEMORY",
              labels : Locale.tr("Used MEMORY") + "," + Locale.tr("Free MEMORY"),
              humanize_figures : true,
              div_graph : $("#host_mem_graph"),
              div_legend : $("#host_mem_legend")
            }
            ];

        for (var i = 0; i < host_graphs.length; i++) {
          Graphs.plot(response, host_graphs[i]);
        }
      },
      error: Notifier.onError
    });

    return false;
  }
});
