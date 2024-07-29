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

  var CPUBars = require("./utils/cpu-bars");
  var DashboardUtils = require('utils/dashboard');
  var Humanize = require("utils/humanize");
  var LabelsUtils = require("utils/labels/utils");
  var Locale = require("utils/locale");
  var MemoryBars = require("./utils/memory-bars");
  var OpenNebulaAction = require("opennebula/action");
  var OpenNebulaHost = require("opennebula/host");
  var Reserved = require("./utils/reserved");
  var Status = require('utils/status');
  var Sunstone = require("sunstone");
  var SunstoneConfig = require("sunstone-config");
  var TabDataTable = require("utils/tab-datatable");
  
  /*
    TEMPLATES
   */

  var SearchDropdown = require("hbs!./datatable/search");

  /*
    CONSTANTS
   */

  var RESOURCE = "Host";
  var XML_ROOT = "HOST";
  var TAB_NAME = require("./tabId");
  var TEMPLATE_ATTR = "TEMPLATE";
  var COLUMNS = {
    ID: 1,
    NAME: 2,
    CLUSTER: 3,
    RVMS: 4,
    ALLOCATED_CPU: 5,
    ALLOCATED_MEM: 6,
    STATUS: 7,
    IM_MAD: 8,
    VM_MAD: 9,
    LABELS: 10,
    SEARCH: 11,
  }

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.xmlRoot = XML_ROOT;
    this.labelsColumn = COLUMNS.LABELS;

    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check", 5, 6, 7, 8]},
          {"sWidth": "35px", "aTargets": [0]},
          {"sWidth": "155px", "aTargets": [6, 8]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ["_all"]},
          {"sType": "num", "aTargets": [1, 4]}
      ]
    };

    this.columns = [
      Locale.tr("ID") ,
      Locale.tr("Name") ,
      Locale.tr("Cluster"),
      Locale.tr("RVMs"),
      Locale.tr("Allocated CPU"),
      Locale.tr("Allocated MEM"),
      Locale.tr("Status"),
      Locale.tr("IM MAD"),
      Locale.tr("VM MAD"),
      Locale.tr("Labels"),
      "search_data"
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "select_resource": Locale.tr("Please select a Host from the list"),
      "you_selected": Locale.tr("You selected the following Host:"),
      "select_resource_multiple": Locale.tr("Please select one or more hosts from the list"),
      "you_selected_multiple": Locale.tr("You selected the following hosts:")
    };

    this.totalHosts = 0;
    this.onHosts = 0;
    this.offHosts = 0;
    this.errorHosts = 0;
    this.maxCPU = 0;
    this.allocatedCPU = 0;
    this.maxMemory = 0;
    this.allocatedMemory = 0;

    this.conf.searchDropdownHTML = SearchDropdown({tableId: this.dataTableId});
    this.searchColumn = COLUMNS.SEARCH;

    TabDataTable.call(this);
  };

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.preUpdateView = _preUpdateView;
  Table.prototype.postUpdateView = _postUpdateView;
  Table.prototype.columnsIndex = COLUMNS;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var cache = OpenNebulaAction.cache("CLUSTER");
    if (!cache){
      Sunstone.runAction("Cluster.list");
      cache = OpenNebulaAction.cache("CLUSTER");
    }
    var element = element_json.HOST;
    var elementAux = Reserved.updateHostTemplate(cache, element);
    var cpuBars = CPUBars.html(elementAux);
    var memoryBars = MemoryBars.html(elementAux);

    this.totalHosts++;

    switch (parseInt(element.STATE)) {
      case OpenNebulaHost.STATES.INIT:
      case OpenNebulaHost.STATES.MONITORING_INIT:
      case OpenNebulaHost.STATES.MONITORING_MONITORED:
      case OpenNebulaHost.STATES.MONITORED:
        this.onHosts++;
        break;
      case OpenNebulaHost.STATES.ERROR:
      case OpenNebulaHost.STATES.MONITORING_ERROR:
        this.errorHosts++;
        break;
      case OpenNebulaHost.STATES.DISABLED:
      case OpenNebulaHost.STATES.MONITORING_DISABLED:
      case OpenNebulaHost.STATES.OFFLINE:
        this.offHosts++;
        break;
      default:
        break;
    }

    this.maxCPU += parseInt((element && element.HOST_SHARE && element.HOST_SHARE.MAX_CPU)||0);
    this.allocatedCPU += parseInt((element && element.HOST_SHARE && element.HOST_SHARE.CPU_USAGE)||0);
    this.maxMemory += parseInt((element && element.HOST_SHARE && element.HOST_SHARE.MAX_MEM)||0);
    this.allocatedMemory += parseInt((element && element.HOST_SHARE && element.HOST_SHARE.MEM_USAGE)||0);

    var state = OpenNebulaHost.simpleStateStr(element.STATE);

    var search = {
      NAME:     element.NAME,
      CLUSTER:  element.CLUSTER,
      STATE:    state,
      IM_MAD:   element.IM_MAD,
      VM_MAD:   element.VM_MAD
    };

    var color_html = Status.state_lock_to_color("HOST",state, element_json[XML_ROOT]["LOCK"]);

    return [
      '<input class="check_item" type="checkbox" '+
                          'style="vertical-align: inherit;" id="'+this.resource.toLowerCase()+'_' +
                           element.ID + '" name="selected_items" value="' +
                           element.ID + '"/>'+color_html,
        element.ID,
        element.NAME,
        element.CLUSTER_ID.length ? element.CLUSTER_ID : "-",
        element.HOST_SHARE.RUNNING_VMS, //rvm
        cpuBars.allocated||"",
        memoryBars.allocated||"",
        state,
        element.IM_MAD,
        element.VM_MAD,
        (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||""),
        btoa(unescape(encodeURIComponent(JSON.stringify(search))))
    ];
  }

  function _preUpdateView() {
    this.totalHosts = 0;
    this.onHosts = 0;
    this.offHosts = 0;
    this.errorHosts = 0;
    this.maxCPU = 0;
    this.allocatedCPU = 0;
    this.maxMemory = 0;
    this.allocatedMemory = 0;
  }

  function _postUpdateView() {
    var time = 2000;

    if ( !SunstoneConfig.doCountAnimation ){
      time = 1;
    }

    //$(".total_hosts").text(this.totalHosts);
    $(".on_hosts").removeClass("fadeinout");
    DashboardUtils.counterAnimation(".on_hosts", this.onHosts);
    $(".off_hosts").removeClass("fadeinout");
    DashboardUtils.counterAnimation(".off_hosts", this.offHosts);
    $(".error_hosts").removeClass("fadeinout");
    DashboardUtils.counterAnimation(".error_hosts", this.errorHosts);

    var ratio_allocated_cpu = 0;
    if (this.maxCPU > 0) {
      ratio_allocated_cpu = Math.round((this.allocatedCPU / this.maxCPU) * 100);
      info_str = this.allocatedCPU + " / " + this.maxCPU ;
    } else {
      info_str = "- / -";
    }
    $("#dashboard_host_allocated_cpu").html(quotaDashboard(
      "dashboard_host_allocated_cpu",
      Locale.tr("Allocated CPU"),
      "1.2rem",
      "1rem",
      {"percentage": ratio_allocated_cpu, "str": info_str})
    ).fadeIn("slow", function() {
      // Fill percentage allocated CPU
      if(!isNaN(ratio_allocated_cpu)){
        var percentage = ratio_allocated_cpu > 100 ? 100 : ratio_allocated_cpu;
        $("#dashboard_host_allocated_cpu_meter").animate({
          value: percentage,
        }, time, "swing");
      }
    });

    var ratio_allocated_mem = 0;
    if (this.maxMemory > 0) {
      ratio_allocated_mem = Math.round((this.allocatedMemory / this.maxMemory) * 100);
      info_str = Humanize.size(this.allocatedMemory) + " / " + Humanize.size(this.maxMemory);
    } else {
      info_str = Humanize.size(this.allocatedMemory) + " / -";
    }
    $("#dashboard_host_allocated_mem").html(quotaDashboard(
      "dashboard_host_allocated_mem",
      Locale.tr("Allocated Memory"),
      "1.2rem",
      "1rem",
      {"percentage": ratio_allocated_mem, "str": info_str})
    ).fadeIn("slow", function() {
      // Fill percentage allocated MEMORY
      if(!isNaN(ratio_allocated_mem)){
        var percentage = ratio_allocated_mem > 100 ? 100 : ratio_allocated_mem;
        $("#dashboard_host_allocated_mem_meter").animate({
          value: percentage,
        }, time, "swing");
      }
    });
  }

  function quotaDashboard(html_tag, legend, _, _, quota) {
    var min = SunstoneConfig.thresholds.min;
    var low = SunstoneConfig.thresholds.low;
    var high = SunstoneConfig.thresholds.high;
    return "<div class=\"row\">" +
      "<div class=\"large-12 columns\">" +
        "<span>" + legend + "</span>" +
      "</div>" +
    "</div>" +
    "<div class=\"row\">" +
      "<div class=\"large-12 columns\">" +
        "  <meter id=\"" + html_tag + "_meter\" min=\""+ min +"\" low=\""+ low +"\" high=\""+ high +"\" optimum=\"0\" max=\"100\" value=\"0\"></meter>" +
      "</div>" +
    "</div>" +
    "<div class=\"row\">" +
      "<div class=\"large-12 columns\">" +
        "<span id=\"" + html_tag + "_str\" class=\"right\">" + quota.str + "</span>" +
      "</div>" +
    "</div>";
  }
});
