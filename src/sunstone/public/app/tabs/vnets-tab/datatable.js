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
  var ProgressBar = require('utils/progress-bar');
  var Utils = require('./utils/common');
  var LabelsUtils = require('utils/labels/utils');
  var SearchDropdown = require('hbs!./datatable/search');
  var OpenNebulaNetwork = require('opennebula/network');
  var DashboardUtils = require('utils/dashboard');
  var Status = require('utils/status');

  /*
    CONSTANTS
   */

  var RESOURCE = "Network";
  var XML_ROOT = "VNET";
  var TAB_NAME = require('./tabId');
  var LABELS_COLUMN = 11;
  var SEARCH_COLUMN = 12;
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
          {"bSortable": false, "aTargets": ["check"]},
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']},
          {"sType": "num", "aTargets": [1, 6]}
      ]
    }

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Name"),
      Locale.tr("Owner"),
      Locale.tr("Group"),
      Locale.tr("Status"),
      Locale.tr("Reservation"),
      Locale.tr("Cluster"),
      Locale.tr("Bridge"),
      Locale.tr("Leases"),
      Locale.tr("VLAN ID"),
      Locale.tr("Labels"),
      "search_data"
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "uname_index": 3,
      "select_resource": Locale.tr("Please select a network from the list"),
      "you_selected": Locale.tr("You selected the following network:"),
      "select_resource_multiple": Locale.tr("Please select one or more networks from the list"),
      "you_selected_multiple": Locale.tr("You selected the following networks:")
    };

    this.usedLeases = 0;
    this.totalVNets = 0;

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
    var element = element_json[XML_ROOT];

    this.usedLeases = this.usedLeases + parseInt(element.USED_LEASES);
    this.totalVNets++;

    var total_size = 0;

    var arList = Utils.getARList(element);

    $.each(arList, function(){
      total_size += parseInt(this.SIZE);
    });

    var clusters = '-';
    if (element.CLUSTERS.ID != undefined){
      clusters = Array.isArray(element.CLUSTERS.ID) ? element.CLUSTERS.ID.join(",") : element.CLUSTERS.ID;
    }

    var parent_net = "";

    if(element.PARENT_NETWORK_ID.length > 0){
      parent_net = OpenNebulaNetwork.getName(element.PARENT_NETWORK_ID);
    }

    var search = {
      NAME:     element.NAME,
      UNAME:    element.UNAME,
      GNAME:    element.GNAME,
      VLAN_ID: (element.VLAN_ID.length ? element.VLAN_ID : ""),
      PARENT_NETWORK: parent_net
    }

    var color_html = Status.state_lock_to_color("VNET",false, element_json[XML_ROOT]["LOCK"]);

    return [
      '<input class="check_item" type="checkbox" '+
                          'style="vertical-align: inherit;" id="'+this.resource.toLowerCase()+'_' +
                           element.ID + '" name="selected_items" value="' +
                           element.ID + '"/>'+color_html,
      element.ID,
      element.NAME,
      element.UNAME,
      element.GNAME,
      OpenNebulaNetwork.stateStr(element.STATE),
      element.PARENT_NETWORK_ID.length ? Locale.tr("Yes") : Locale.tr("No"),
      clusters,
      element.BRIDGE,
      ProgressBar.html(element.USED_LEASES, total_size),
      element.VLAN_ID.length ? element.VLAN_ID : "-",
      (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||''),
      btoa(unescape(encodeURIComponent(JSON.stringify(search))))
    ];
  }

  function _preUpdateView() {
    this.totalVNets = 0;
    this.usedLeases = 0;
  }

  function _postUpdateView() {
    $(".total_vnets").removeClass("fadeinout");
    DashboardUtils.counterAnimation(".total_vnets", this.totalVNets);
    $(".addresses_vnets").removeClass("fadeinout");
    DashboardUtils.counterAnimation(".addresses_vnets", this.usedLeases);
  }
});
