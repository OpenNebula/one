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
  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var LabelsUtils = require('utils/labels/utils');
  var Status = require('utils/status');

  /*
    CONSTANTS
   */

  var RESOURCE = "Vdc";
  var XML_ROOT = "VDC";
  var TAB_NAME = require('./tabId');
  var LABELS_COLUMN = 8;
  var TEMPLATE_ATTR = 'TEMPLATE';

  var Utils = require('./utils/common');
  var VDC_ALL_RESOURCES = Utils.VDC_ALL_RESOURCES;

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
          { "bSortable": false, "aTargets": ["check"] },
          { "sWidth": "35px", "aTargets": [0] },
          { "bVisible": true, "aTargets": Config.tabTableColumns(TAB_NAME)},
          { "bVisible": false, "aTargets": ['_all']},
          {"sType": "num", "aTargets": [1, 3, 5, 6, 7]}
      ]
    };

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Name"),
      Locale.tr("Groups"),
      Locale.tr("Clusters"),
      Locale.tr("Hosts"),
      Locale.tr("VNets"),
      Locale.tr("Datastores"),
      Locale.tr("Labels")
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "select_resource": Locale.tr("Please select a VDC from the list"),
      "you_selected": Locale.tr("You selected the following VDC:"),
      "select_resource_multiple": Locale.tr("Please select one or more VDCs from the list"),
      "you_selected_multiple": Locale.tr("You selected the following VDCs:")
    };

    this.totalElements = 0;

    TabDataTable.call(this);
  }

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
    this.totalElements++;

    var element = element_json[XML_ROOT];

    var groupColumn = 0;

    var gIds = element.GROUPS.ID;
    if (Array.isArray(gIds)){
      groupColumn = gIds.length;
    } else if (!$.isEmptyObject(gIds)){
      groupColumn = 1;
    }

    var color_html = Status.state_lock_to_color("VDC",false, element_json[XML_ROOT]["LOCK"]);

    return [
      '<input class="check_item" type="checkbox" '+
                          'style="vertical-align: inherit;" id="'+this.resource.toLowerCase()+'_' +
                           element.ID + '" name="selected_items" value="' +
                           element.ID + '"/>'+color_html,
      element.ID,
      element.NAME,
      groupColumn,
      _lengthOf(element.CLUSTERS.CLUSTER, "CLUSTER"),
      _lengthOf(element.HOSTS.HOST, "HOST"),
      _lengthOf(element.VNETS.VNET, "VNET"),
      _lengthOf(element.DATASTORES.DATASTORE, "DATASTORE"),
      (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||'')
    ];
  }

  function _lengthOf(ids, res_name){
    var l = 0;
    if (Array.isArray(ids)){
      l = ids.length;
    } else if (!$.isEmptyObject(ids)){
      if (ids[res_name+"_ID"] == VDC_ALL_RESOURCES){
        l = Locale.tr("All");
      } else {
        l = 1;
      }
    }

    return l;
  }

  function _preUpdateView() {
    this.totalElements = 0;
  }

  function _postUpdateView() {
    $(".total_vdcs").text(this.totalElements);
  }
});
