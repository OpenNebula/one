/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
  var OpenNebulaImage = require('opennebula/image');
  var LabelsUtils = require('utils/labels/utils');

  /*
    CONSTANTS
   */

  var XML_ROOT = "IMAGE"
  var LABELS_COLUMN = 13;
  var TEMPLATE_ATTR = 'TEMPLATE';

  /*
    CONSTRUCTOR
   */

  function Table(resource, tabId, dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = tabId;
    this.dataTableId = dataTableId;
    this.resource = resource;
    this.xmlRoot = XML_ROOT;
    this.labelsColumn = LABELS_COLUMN;

    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check"]},
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(tabId)},
          {"bVisible": false, "aTargets": ['_all']}
      ]
    }

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Owner"),
      Locale.tr("Group"),
      Locale.tr("Name"),
      Locale.tr("Datastore"),
      Locale.tr("Size"),
      Locale.tr("Type"),
      Locale.tr("Registration time"),
      Locale.tr("Persistent"),
      Locale.tr("Status"),
      Locale.tr("#VMS"),
      Locale.tr("Target"),
      Locale.tr("Labels")
    ]

    TabDataTable.call(this);
  };

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArrayCommon = _elementArray;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var element = element_json.IMAGE;

    return [
      '<input class="check_item" type="checkbox" id="'+this.resource.toLowerCase()+'_' +
                           element.ID + '" name="selected_items" value="' +
                           element.ID + '"/>',
      element.ID,
      element.UNAME,
      element.GNAME,
      element.NAME,
      element.DATASTORE,
      element.SIZE,
      OpenNebulaImage.typeStr(element.TYPE),
      Humanize.prettyTime(element.REGTIME),
      parseInt(element.PERSISTENT) ? "yes" : "no",
      OpenNebulaImage.stateStr(element.STATE),
      element.RUNNING_VMS,
      element.TEMPLATE.TARGET ? element.TEMPLATE.TARGET : '--',
      (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||'')
    ];
  }
});
