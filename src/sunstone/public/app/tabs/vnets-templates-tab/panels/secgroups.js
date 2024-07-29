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

  var Locale = require('utils/locale');
  var SecurityGroupsTable = require('tabs/secgroups-tab/datatable');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./secgroups/panelId');
  var SG_TABLE_ID = PANEL_ID + "SecurityGroupsTable";
  var RESOURCE = "VNTemplate";
  var XML_ROOT = "VNTEMPLATE";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Security");
    this.icon = "fa-shield-alt";

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
    var secgroups = [];

    if (this.element.TEMPLATE.SECURITY_GROUPS != undefined &&
        this.element.TEMPLATE.SECURITY_GROUPS.length != 0){

        secgroups = this.element.TEMPLATE.SECURITY_GROUPS.split(",");
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: secgroups
      }
    };

    this.secgroupTable = new SecurityGroupsTable(SG_TABLE_ID, opts);

    return this.secgroupTable.dataTableHTML;
  }

  function _setup(context) {
    this.secgroupTable.initialize();
    this.secgroupTable.refreshResourceTableSelect();

    return false;
  }
});
