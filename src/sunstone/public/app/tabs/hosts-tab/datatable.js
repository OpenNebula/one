/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

  var TabDataTable = require("utils/tab-datatable");
  var SunstoneConfig = require("sunstone-config");
  var Locale = require("utils/locale");
  var Humanize = require("utils/humanize");
  var CPUBars = require("./utils/cpu-bars");
  var MemoryBars = require("./utils/memory-bars");
  var Reserved = require("./utils/reserved");
  var OpenNebulaHost = require("opennebula/host");
  var LabelsUtils = require("utils/labels/utils");
  var SearchDropdown = require("hbs!./datatable/search");
  var OpenNebulaAction = require("opennebula/action");
  var Sunstone = require("sunstone");
  var Status = require('utils/status');


  /*
    CONSTANTS
   */

  var RESOURCE = "Host";
  var XML_ROOT = "HOST";
  var TAB_NAME = require("./tabId");
  var LABELS_COLUMN = 13;
  var SEARCH_COLUMN = 14;
  var TEMPLATE_ATTR = "TEMPLATE";

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.xmlRoot = XML_ROOT;
    this.labelsColumn = LABELS_COLUMN;

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
      Locale.tr("Real CPU"),
      Locale.tr("Allocated CPU"),
      Locale.tr("Real MEM"),
      Locale.tr("Allocated MEM"),
      Locale.tr("Status"),
      Locale.tr("IM MAD"),
      Locale.tr("VM MAD"),
      Locale.tr("Last monitored on"),
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
    this.realCPU = 0;
    this.maxMemory = 0;
    this.allocatedMemory = 0;
    this.realMemory = 0;

    this.conf.searchDropdownHTML = SearchDropdown({tableId: this.dataTableId});
    this.searchColumn = SEARCH_COLUMN;

    TabDataTable.call(this);
  };

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.preUpdateView = _preUpdateView;
  Table.prototype.postUpdateView = _postUpdateView;

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
    this.realCPU += parseInt((element && element.MONITORING && element.MONITORING.CAPACITY && element.MONITORING.CAPACITY.USED_CPU)||0);//
    this.maxMemory += parseInt((element && element.HOST_SHARE && element.HOST_SHARE.MAX_MEM)||0);
    this.allocatedMemory += parseInt((element && element.HOST_SHARE && element.HOST_SHARE.MEM_USAGE)||0);
    this.realMemory += parseInt((element && element.MONITORING && element.MONITORING.CAPACITY && element.MONITORING.CAPACITY.USED_MEMORY)||0);//MONITORING.CAPACITY.USED_MEMORY


    console.log("-->",element);

    var state = OpenNebulaHost.simpleStateStr(element.STATE);

    var search = {
      NAME:     element.NAME,
      CLUSTER:  element.CLUSTER,
      STATE:    state,
      IM_MAD:   element.IM_MAD,
      VM_MAD:   element.VM_MAD
    }

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
        cpuBars.real,
        cpuBars.allocated,
        memoryBars.real,
        memoryBars.allocated,
        state,
        element.IM_MAD,
        element.VM_MAD,
        Humanize.prettyTime(element.LAST_MON_TIME),
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
    this.realCPU = 0;
    this.maxMemory = 0;
    this.allocatedMemory = 0;
    this.realMemory = 0;
  }

  function _postUpdateView() {
    var time = 2000;

    if ( !SunstoneConfig.doCountAnimation ){
      time = 1;
    }

    $(".total_hosts").text(this.totalHosts);
    $(".on_hosts").text(this.onHosts);
    $(".off_hosts").text(this.offHosts);
    $(".error_hosts").text(this.errorHosts);

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
    );

    if(!isNaN(ratio_allocated_cpu)){
      var percentage = ratio_allocated_cpu > 100 ? 100 : ratio_allocated_cpu;
      $("#dashboard_host_allocated_cpu_meter").animate({
        value: percentage,
      }, time, "swing");
    }

    var ratio_real_cpu = 0;
    if (this.maxCPU > 0) {
      ratio_real_cpu = Math.round((this.realCPU / this.maxCPU) * 100);
      info_str = this.realCPU + " / " + this.maxCPU;
    } else {
      info_str = "- / -";
    }
    $("#dashboard_host_real_cpu").html(quotaDashboard(
      "dashboard_host_real_cpu",
      Locale.tr("Real CPU"),
      "1.2rem",
      "1rem",
      {"percentage": ratio_real_cpu, "str": info_str})
    );

    if(!isNaN(ratio_real_cpu)){
      var percentage = ratio_real_cpu > 100 ? 100 : ratio_real_cpu;
      $("#dashboard_host_real_cpu_meter").animate({
        value: percentage,
      }, time, "swing");
    }

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
    );

    if(!isNaN(ratio_allocated_mem)){
      var percentage = ratio_allocated_mem > 100 ? 100 : ratio_allocated_mem;
      $("#dashboard_host_allocated_mem_meter").animate({
        value: percentage,
      }, time, "swing");
    }

    var ratio_real_mem = 0;
    if (this.maxMemory > 0) {
      ratio_real_mem = Math.round((this.realMemory / this.maxMemory) * 100);
      info_str = Humanize.size(this.realMemory) + " / " + Humanize.size(this.maxMemory);
    } else {
      info_str = Humanize.size(this.realMemory) + " / -";
    }

    $("#dashboard_host_real_mem").html(quotaDashboard(
      "dashboard_host_real_mem",
      Locale.tr("Real Memory"),
      "1.2rem",
      "1rem",
      {"percentage": ratio_real_mem, "str": info_str})
    );

    if(!isNaN(ratio_real_mem)){
      var percentage = ratio_real_mem > 100 ? 100 : ratio_real_mem;
      $("#dashboard_host_real_mem_meter").animate({
        value: percentage,
      }, time, "swing");
    }

  }

  function quotaDashboard(html_tag, legend, font_large_size, font_small_size, quota) {
    return "<div class=\"row\">" +
          "<div class=\"large-12 columns\">" +
            "<span>" + legend + "</span>" +
          "</div>" +
        "</div>" +
        "<div class=\"row\">" +
          "<div class=\"large-12 columns\">" +
            "  <meter id=\"" + html_tag + "_meter\" min=\"0\" low=\"33\" high=\"66\" optimum=\"0\" max=\"100\" value=\"0\"></meter>" +
          "</div>" +
        "</div>" +
        "<div class=\"row\">" +
          "<div class=\"large-12 columns\">" +
            "<span id=\"" + html_tag + "_str\" class=\"right\">" + quota.str + "</span>" +
          "</div>" +
        "</div>";
  }
});
