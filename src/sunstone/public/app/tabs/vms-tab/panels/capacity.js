/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');
  var OpenNebulaVM = require('opennebula/vm');
  var Notifier = require('utils/notifier');
  var Graphs = require('utils/graphs');
  var StateActions = require('tabs/vms-tab/utils/state-actions');

  /*
    TEMPLATES
   */

  var TemplateInfo = require('hbs!./capacity/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./capacity/panelId');
  var RESIZE_DIALOG_ID = require('../dialogs/resize/dialogId');
  var RESOURCE = "VM"
  var XML_ROOT = "VM"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Capacity");
    this.icon = "fa-laptop";

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
    var resizeStateEnabled = StateActions.enabledStateAction("VM.resize",
                                    this.element.STATE, this.element.LCM_STATE);

    var cpuCost    = this.element.TEMPLATE.CPU_COST;
    var memoryCost = this.element.TEMPLATE.MEMORY_COST;

    if (cpuCost == undefined){
      cpuCost = Config.onedConf.DEFAULT_COST.CPU_COST;
    }

    if (memoryCost == undefined){
      memoryCost = Config.onedConf.DEFAULT_COST.MEMORY_COST;
    }

    return TemplateInfo({
      'element': this.element,
      'resizeStateEnabled': resizeStateEnabled,
      'cpuCost': cpuCost,
      'memoryCost': memoryCost
    });
  }

  function _setup(context) {
    var that = this;
    if (Config.isTabActionEnabled("vms-tab", "VM.resize")) {
      context.off('click', '#resize_capacity');
      context.on('click', '#resize_capacity', function() {
        var dialog = Sunstone.getDialog(RESIZE_DIALOG_ID);
        dialog.setElement(that.element);
        dialog.show();
        return false;
      });
    }
  }

  function _onShow(context) {
    var that = this;
    OpenNebulaVM.monitor({
      data: {
        id: that.element.ID,
        monitor: {
          monitor_resources : "MONITORING/CPU,TEMPLATE/CPU,MONITORING/MEMORY,TEMPLATE/MEMORY"
        }
      },
      success: function(req, response) {
        var vmGraphs = [
          {
            monitor_resources : "TEMPLATE/CPU,MONITORING/CPU",
            labels : Locale.tr("Allocated") + "," + Locale.tr("Real"),
            humanize_figures : false,
            div_graph : $(".vm_cpu_graph", context),
            div_legend : $(".vm_cpu_legend", context)
          },
          {
            monitor_resources : "TEMPLATE/MEMORY,MONITORING/MEMORY",
            labels : Locale.tr("Allocated") + "," + Locale.tr("Real"),
            humanize_figures : true,
            div_graph : $(".vm_memory_graph", context),
            div_legend : $(".vm_memory_legend", context)
          }
        ];

        if(response.monitoring["TEMPLATE/CPU"] != undefined){
          response.monitoring["TEMPLATE/CPU"].map(function(e){
            e[1] = e[1] * 100;
          });
        }

        if(response.monitoring["TEMPLATE/MEMORY"] != undefined){
          response.monitoring["TEMPLATE/MEMORY"].map(function(e){
            e[1] = e[1] * 1024;
          });
        }

        for (var i = 0; i < vmGraphs.length; i++) {
          Graphs.plot(response, vmGraphs[i]);
        }
      },
      error: Notifier.onError
    });
  }
});
