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

  var Humanize = require('utils/humanize');
  var LabelsUtils = require('utils/labels/utils');
  var Locale = require('utils/locale');
  var OpenNebulaImage = require('opennebula/image');
  var SearchDropdown = require('hbs!./datatable/search');
  var Status = require('utils/status');
  var SunstoneConfig = require('sunstone-config');
  var TabDataTable = require('utils/tab-datatable');

  /*
    CONSTANTS
   */

  var XML_ROOT = "IMAGE"
  var LABELS_COLUMN = 13;
  var SEARCH_COLUMN = 14;
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
        {
          "aTargets": [2, 3, 4, 5, 6, 7, 8, 9, 10],
          "sClass": "overflow",
          "fnCreatedCell": function (nTd, sData) {
            $(nTd).attr('title', sData)
          }
        },
        {"bSortable": false, "aTargets": ["check"]},
        {"sWidth": "35px", "aTargets": [0]},
        {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(tabId)},
        {"bVisible": false, "aTargets": ['_all']},
        {"sType": "file-size", "aTargets": [ 6 ] },
        {"sType": "num", "aTargets": [1, 11]}
      ]
    }

    this.columns = [
      /* 1 */   Locale.tr("ID"),
      /* 2 */   Locale.tr("Name"),
      /* 3 */   Locale.tr("Owner"),
      /* 4 */   Locale.tr("Group"),
      /* 5 */   Locale.tr("Datastore"),
      /* 6 */   Locale.tr("Size"),
      /* 7 */   Locale.tr("Type"),
      /* 8 */   Locale.tr("Registration time"),
      /* 9 */   Locale.tr("Persistent"),
      /* 10 */  Locale.tr("Status"),
      /* 11 */  Locale.tr("#VMS"),
      /* 12 */  Locale.tr("Target"),
      /* 13 */  Locale.tr("Labels"),
      /* 14 */  "search_data"
    ]

    this.conf.searchDropdownHTML = SearchDropdown({tableId: this.dataTableId});
    this.searchColumn = SEARCH_COLUMN;

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

    var type = OpenNebulaImage.typeStr(element.TYPE);
    if (type === Locale.tr("BACKUP")) {
      if (element.BACKUP_INCREMENTS.INCREMENT){
        type = Locale.tr("INCREMENTAL")
      }
      else {
        type = Locale.tr("FULL")
      }
    }
    var state = OpenNebulaImage.stateStr(element.STATE);

    var search = {
      NAME:       element.NAME,
      UNAME:      element.UNAME,
      GNAME:      element.GNAME,
      DATASTORE:  element.DATASTORE,
      TYPE:       type,
      STATE:      state,
      REGTIME_AFTER:  element.REGTIME,
      REGTIME_BEFORE: element.REGTIME
    }
    var color_html = Status.state_lock_to_color("IMAGES",state, element_json[XML_ROOT]["LOCK"]);

    return [
      '<input class="check_item" type="checkbox" '+
                          'style="vertical-align: inherit;" id="'+this.resource.toLowerCase()+'_' +
                           element.ID + '" name="selected_items" value="' +
                           element.ID + '"/>'+color_html,
      element.ID,
      element.NAME,
      element.UNAME,
      element.GNAME,   
      element.DATASTORE,
      Humanize.sizeFromMB(element.SIZE),
      type,
      Humanize.prettyTime(element.REGTIME),
      parseInt(element.PERSISTENT) ? "yes" : "no",
      state,
      element.RUNNING_VMS,
      element.TEMPLATE.TARGET ? element.TEMPLATE.TARGET : '--',
      (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||''),
      btoa(unescape(encodeURIComponent(JSON.stringify(search))))
    ];
  }
});
