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
  var Humanize = require('utils/humanize');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var LabelsUtils = require('utils/labels/utils');
  var SearchDropdown = require('hbs!./datatable/search');
  var Status = require('utils/status');

  /*
    CONSTANTS
   */

  var RESOURCE = "ServiceTemplate";
  var XML_ROOT = "DOCUMENT";
  var TAB_NAME = require('./tabId');
  var LABELS_COLUMN = 6;
  var SEARCH_COLUMN = 7;
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
          {"sType": "num", "aTargets": [1]}
      ]
    };

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Owner"),
      Locale.tr("Group"),
      Locale.tr("Name"),
      Locale.tr("Registration time"),
      Locale.tr("Labels"),
      "search_data"
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "select_resource": Locale.tr("Please select a Template from the list"),
      "you_selected": Locale.tr("You selected the following Template:"),
      "select_resource_multiple": Locale.tr("Please select one or more Templates from the list"),
      "you_selected_multiple": Locale.tr("You selected the following Templates:")
    };

    this.conf.searchDropdownHTML = SearchDropdown({tableId: this.dataTableId});
    this.searchColumn = SEARCH_COLUMN;

    TabDataTable.call(this);
  }

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var element = element_json[XML_ROOT];

    var search = {
      UNAME: element.UNAME,
      GNAME: element.GNAME,
      NAME:  element.NAME
    }

    var color_html = Status.state_lock_to_color("SERVICE_TEMPLATE",false, element_json[XML_ROOT]["LOCK"]);
    var registration_time = element.TEMPLATE.BODY['registration_time'] ? Humanize.prettyTime(element.TEMPLATE.BODY['registration_time']) : "-";

    return [
      '<input class="check_item" type="checkbox" style="vertical-align: inherit;" id="'+this.resource.toLowerCase() + '_' + element.ID + '" name="selected_items" value="' + element.ID + '"/>'+color_html,
      element.ID,
      element.UNAME,
      element.GNAME,
      element.NAME,
      registration_time,
      (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||''),
      btoa(unescape(encodeURIComponent(JSON.stringify(search))))
    ];
  }
});
