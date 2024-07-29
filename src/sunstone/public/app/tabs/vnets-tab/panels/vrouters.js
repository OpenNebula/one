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
  var VirtualRoutersTable = require('tabs/vrouters-tab/datatable');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./vrouters/panelId');
  var VR_TABLE_ID = PANEL_ID + "VirtualRoutersTable";
  var RESOURCE = "Network";
  var XML_ROOT = "VNET";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("V. Routers");
    this.icon = "fa-random";

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
    var vrs = [];

    if (this.element.VROUTERS.ID != undefined){
      vrs = this.element.VROUTERS.ID;

      if (!Array.isArray(vrs)){
        vrs = [vrs];
      }
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: vrs
      }
    };

    this.vroutersTable = new VirtualRoutersTable(VR_TABLE_ID, opts);

    return this.vroutersTable.dataTableHTML;
  }

  function _setup(context) {
    this.vroutersTable.initialize();
    this.vroutersTable.refreshResourceTableSelect();

    return false;
  }
});
