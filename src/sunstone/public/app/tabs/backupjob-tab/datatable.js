/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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
  var SearchDropdown = require('hbs!./datatable/search');
  var Status = require('utils/status');
  var Humanize = require('utils/humanize');
  var BackupJobState = require('./utils/status');

  /*
    CONSTANTS
   */

  var RESOURCE = "BackupJob";
  var XML_ROOT = "BACKUPJOB";
  var TAB_NAME = require('./tabId');
  var SEARCH_COLUMN = 7;

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
          {"sWidth": "250px", "aTargets": [5]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']},
          {"sType": "num", "aTargets": [1,6]}
      ]
    }

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Name"),
      Locale.tr("Owner"),
      Locale.tr("Group"),
      Locale.tr("Status"),
      Locale.tr("Priority"),
      Locale.tr("Last Backup"),
      "search_data"
    ]

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "uname_index": 3,
      "select_resource": Locale.tr("Please select a Backup job from the list"),
      "you_selected": Locale.tr("You selected the following backupsjobs:"),
      "select_resource_multiple": Locale.tr("Please select one or more backupjobs from the list"),
      "you_selected_multiple": Locale.tr("You selected the following backupsjobs:")
    }

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
    var element = element_json.BACKUPJOB;

    var search = {
      NAME:   element.NAME,
      UNAME:  element.UNAME,
      GNAME:  element.GNAME,
    }

    var color_html = Status.state_lock_to_color("BACKUPJOBS",false, element_json[XML_ROOT]["LOCK"]);

    var last_backup = element.LAST_BACKUP_TIME ? 
      element.LAST_BACKUP_TIME === '0' ? '-' : Humanize.prettyTime(element.LAST_BACKUP_TIME) : "-";


    return [
      '<input class="check_item" type="checkbox" '+
                          'style="vertical-align: inherit;" id="'+this.resource.toLowerCase()+'_' +
                           element.ID + '" name="selected_items" value="' +
                           element.ID + '"/>'+color_html,
        element.ID,
        element.NAME,
        element.UNAME,
        element.GNAME,
        Locale.tr(BackupJobState.state(element)),
        element.PRIORITY,
        last_backup,
        btoa(unescape(encodeURIComponent(JSON.stringify(search))))
    ];
  }

  function _preUpdateView() {
  }

  function _postUpdateView() {
  }
});
