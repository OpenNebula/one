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

  var Locale = require('utils/locale');
  var GroupsTable = require('tabs/groups-tab/datatable');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./groups/panelId');
  var GROUPS_TABLE_ID = PANEL_ID + "GroupsTable";
  var RESOURCE = "User";
  var XML_ROOT = "USER";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Groups");
    this.icon = "fa-users";

    this.element = info[XML_ROOT];

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var groups;

    if (this.element.GROUPS !== undefined && this.element.GROUPS.ID !== undefined) {
      if ($.isArray(this.element.GROUPS.ID)) {
        groups = this.element.GROUPS.ID;
      } else {
        groups = [this.element.GROUPS.ID];
      }
    } else {
      groups = [];
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: groups
      }
    };

    this.GroupsTable = new GroupsTable(GROUPS_TABLE_ID, opts);

    return this.GroupsTable.dataTableHTML;
  }

  function _setup(context) {
    this.GroupsTable.initialize();
    this.GroupsTable.refreshResourceTableSelect();

    return false;
  }
});
