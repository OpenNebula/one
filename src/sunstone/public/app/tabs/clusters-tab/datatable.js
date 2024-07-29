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
  var LabelsUtils = require('utils/labels/utils');
  var Status = require('utils/status');

  /*
    CONSTANTS
   */

  var RESOURCE = "Cluster";
  var XML_ROOT = "CLUSTER";
  var TAB_NAME = require('./tabId');
  var TEMPLATE_ATTR = 'TEMPLATE';
  var COLUMNS = {
    ID: 1,
    NAME: 2,
    HOSTS: 3,
    VNETS: 4,
    DATASTORES: 5,
    LABELS: 6
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
          {"bSortable": false, "aTargets": ["check"] },
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']},
          {"sType": "num", "aTargets": [1, 3, 4, 5]}
      ]
    };

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Name"),
      Locale.tr("Hosts"),
      Locale.tr("VNets"),
      Locale.tr("Datastores"),
      Locale.tr("Labels")
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "select_resource": Locale.tr("Please select a Cluster from the list"),
      "you_selected": Locale.tr("You selected the following Cluster:"),
      "select_resource_multiple": Locale.tr("Please select one or more clusters from the list"),
      "you_selected_multiple": Locale.tr("You selected the following clusters:")
    };

    this.totalClusters = 0;

    TabDataTable.call(this);
  }

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
    var element = element_json[XML_ROOT];
    this.totalClusters++;

    var color_html = Status.state_lock_to_color("CLUSTER",false, element_json[XML_ROOT]["LOCK"]);

    return [
      '<input class="check_item" type="checkbox" style="vertical-align: inherit;" id="'+this.resource.toLowerCase()+'_' + element.ID + '" name="selected_items" value="' + element.ID + '"/>'+color_html,
      element.ID,
      element.NAME,
      _lengthOf(element.HOSTS.ID),
      _lengthOf(element.VNETS.ID),
      _lengthOf(element.DATASTORES.ID),
      (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||'')
    ];
  }

  function _lengthOf(ids){
    var l = 0;
    if (Array.isArray(ids))
      l = ids.length;
    else if (!$.isEmptyObject(ids))
      l = 1;

    return l;
  }

  function _preUpdateView() {
    this.totalClusters = 0;
  }

  function _postUpdateView() {
    $(".total_clusters").text(this.totalClusters);
  }
});
