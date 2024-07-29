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
  var VNetsTable = require('tabs/vnets-tab/datatable');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./vnets/panelId');
  var VNETS_TABLE_ID = PANEL_ID + "VNetsTable";
  var RESOURCE = "Cluster";
  var XML_ROOT = "CLUSTER";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("VNets");
    this.icon = "fa-globe";

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
    var vnets = [];

    if (this.element.VNETS.ID != undefined){
      vnets = this.element.VNETS.ID;

      if (!Array.isArray(vnets)){
        vnets = [vnets];
      }
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: vnets
      }
    };

    this.VNetsTable = new VNetsTable(VNETS_TABLE_ID, opts);

    return this.VNetsTable.dataTableHTML;
  }

  function _setup(context) {
    this.VNetsTable.initialize();
    this.VNetsTable.refreshResourceTableSelect();

    return false;
  }
});
