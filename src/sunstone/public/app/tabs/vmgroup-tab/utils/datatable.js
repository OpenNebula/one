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

  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var CPUBars = require('tabs/hosts-tab/utils/cpu-bars');
  var MemoryBars = require('tabs/hosts-tab/utils/memory-bars');
  var OpenNebulaHost = require('opennebula/host');
  var LabelsUtils = require('utils/labels/utils');
  var SearchDropdown = require('hbs!./datatable/search');

  /*
    CONSTANTS
   */

  var RESOURCE = "Host";
  var XML_ROOT = "HOST";
  var TAB_NAME = require('../tabId');
  var SEARCH_COLUMN = 5;

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.xmlRoot = XML_ROOT;

    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check"]},
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets":[0,1,2,3,4]},
          {"bVisible": false, "aTargets": ['_all']}
      ]
    }

    this.columns = [
      Locale.tr("ID") ,
      Locale.tr("Name") ,
      Locale.tr("Cluster"),
      Locale.tr("Status"),
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
    var element = element_json.HOST;

    //var cpuBars = CPUBars.html(element);
    //var memoryBars = MemoryBars.html(element);

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

    var state = OpenNebulaHost.simpleStateStr(element.STATE);

    var search = {
      NAME:     element.NAME,
      CLUSTER:  element.CLUSTER,
      STATE:    state
    }

    return [
        '<input class="check_item" type="checkbox" id="' + RESOURCE.toLowerCase() + '_' +
                             element.ID + '" name="selected_items" value="' +
                             element.ID + '"/>',
        element.ID,
        element.NAME,
        element.CLUSTER.length ? element.CLUSTER : "-",
        state,
        btoa(unescape(encodeURIComponent(JSON.stringify(search))))
    ];
  }

  function _preUpdateView() {
    this.totalHosts = 0;
    this.onHosts = 0;
    this.offHosts = 0;
    this.errorHosts = 0;
  }

  function _postUpdateView() {
    $(".total_hosts").text(this.totalHosts);
    $(".on_hosts").text(this.onHosts);
    $(".off_hosts").text(this.offHosts);
    $(".error_hosts").text(this.errorHosts);
  }
});
