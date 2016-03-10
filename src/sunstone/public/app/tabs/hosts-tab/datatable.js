/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var CPUBars = require('./utils/cpu-bars');
  var MemoryBars = require('./utils/memory-bars');
  var OpenNebulaHost = require('opennebula/host');
  var LabelsUtils = require('utils/labels/utils');


  /*
    CONSTANTS
   */

  var RESOURCE = "Host";
  var XML_ROOT = "HOST";
  var TAB_NAME = require('./tabId');
  var LABELS_COLUMN = 13;
  var TEMPLATE_ATTR = 'TEMPLATE';

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
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']}
      ]
    }

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
      Locale.tr("Labels")
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
    var element = element_json.HOST;

    var cpuBars = CPUBars.html(element);
    var memoryBars = MemoryBars.html(element);

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
        this.offHosts++;
        break;
      default:
        break;
    }

    this.maxCPU += parseInt(element.HOST_SHARE.MAX_CPU);
    this.allocatedCPU += parseInt(element.HOST_SHARE.CPU_USAGE);
    this.realCPU += parseInt(element.HOST_SHARE.USED_CPU);
    this.maxMemory += parseInt(element.HOST_SHARE.MAX_MEM);
    this.allocatedMemory += parseInt(element.HOST_SHARE.MEM_USAGE);
    this.realMemory += parseInt(element.HOST_SHARE.USED_MEM);

    var clusters = '-';
    if (element.CLUSTERS.ID != undefined){
      clusters = $.isArray(element.CLUSTERS.ID) ? element.CLUSTERS.ID.join(",") : element.CLUSTERS.ID;
    }

    return [
        '<input class="check_item" type="checkbox" id="' + RESOURCE.toLowerCase() + '_' +
                             element.ID + '" name="selected_items" value="' +
                             element.ID + '"/>',
        element.ID,
        element.NAME,
        clusters,
        element.HOST_SHARE.RUNNING_VMS, //rvm
        cpuBars.real,
        cpuBars.allocated,
        memoryBars.real,
        memoryBars.allocated,
        OpenNebulaHost.simpleStateStr(element.STATE),
        element.IM_MAD,
        element.VM_MAD,
        Humanize.prettyTime(element.LAST_MON_TIME),
        (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||'')
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
    $(".total_hosts").text(this.totalHosts);
    $(".on_hosts").text(this.onHosts);
    $(".off_hosts").text(this.offHosts);
    $(".error_hosts").text(this.errorHosts);

    var ratio_allocated_cpu = 0;
    if (this.maxCPU > 0) {
      ratio_allocated_cpu = Math.round((this.allocatedCPU / this.maxCPU) * 100);
      info_str = this.allocatedCPU + ' / ' + this.maxCPU ;
    } else {
      info_str = "- / -";
    }

    //$("#dash_host_allocated_cpu").html(usageBarHtml(allocated_cpu, max_cpu, info_str, true));

    $("#dashboard_host_allocated_cpu").html(quotaDashboard(
      "dashboard_host_allocated_cpu",
      Locale.tr("Allocated CPU"),
      "30px",
      "14px",
      {"percentage": ratio_allocated_cpu, "str": info_str})
    );

    var ratio_real_cpu = 0;
    if (this.maxCPU > 0) {
      ratio_real_cpu = Math.round((this.realCPU / this.maxCPU) * 100);
      info_str = this.realCPU + ' / ' + this.maxCPU;
    } else {
      info_str = "- / -";
    }

    $("#dashboard_host_real_cpu").html(quotaDashboard(
      "dashboard_host_real_cpu",
      Locale.tr("Real CPU"),
      "30px",
      "14px",
      {"percentage": ratio_real_cpu, "str": info_str})
    );

    var ratio_allocated_mem = 0;
    if (this.maxMemory > 0) {
      ratio_allocated_mem = Math.round((this.allocatedMemory / this.maxMemory) * 100);
      info_str = Humanize.size(this.allocatedMemory) + ' / ' + Humanize.size(this.maxMemory);
    } else {
      info_str = Humanize.size(this.allocatedMemory) + ' / -';
    }

    $("#dashboard_host_allocated_mem").html(quotaDashboard(
      "dashboard_host_allocated_mem",
      Locale.tr("Allocated Memory"),
      "30px",
      "14px",
      {"percentage": ratio_allocated_mem, "str": info_str})
    );

    var ratio_real_mem = 0;
    if (this.maxMemory > 0) {
      ratio_real_mem = Math.round((this.realMemory / this.maxMemory) * 100);
      info_str = Humanize.size(this.realMemory) + ' / ' + Humanize.size(this.maxMemory);
    } else {
      info_str = Humanize.size(this.realMemory) + ' / -';
    }

    $("#dashboard_host_real_mem").html(quotaDashboard(
      "dashboard_host_real_mem",
      Locale.tr("Real Memory"),
      "30px",
      "14px",
      {"percentage": ratio_real_mem, "str": info_str})
    );

  }

  function quotaDashboard(html_tag, legend, font_large_size, font_small_size, quota) {
    var percentage = quota.percentage > 100 ? 100 : quota.percentage;

    return '<div class="row">' +
          '<div class="large-12 columns text-center" style="margin-bottom: 5px">' +
            '<h4 class="subheader">'+
              '<small>'+ legend +'</small>'+
            '</h4>'+
          '</div>' +
        '</div>' +
        '<div class="row">' +
          '<div class="large-12 columns text-center">' +
            '<div class="progress large radius">' +
            '  <span id="' + html_tag + '_meter" class="meter" style="width: ' + percentage + '%"></span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="row">' +
          '<div class="large-12 columns text-center">' +
            '<span id="' + html_tag + '_percentage" class="left" style="font-size:' + font_small_size + ';">' + quota.percentage + ' %</span>' +
            '<span id="' + html_tag + '_str" class="right" style="color: #999; font-size: ' + font_small_size + ';">' + quota.str + '</span>' +
          '</div>' +
        '</div>';
  }
});
