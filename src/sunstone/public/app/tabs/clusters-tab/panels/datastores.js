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
  var DatastoresTable = require('tabs/datastores-tab/datatable');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./datastores/panelId');
  var DATASTORES_TABLE_ID = PANEL_ID + "DatastoresTable";
  var RESOURCE = "Cluster";
  var XML_ROOT = "CLUSTER";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Datastores");
    this.icon = "fa-folder-open";

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
    var datastores = [];

    if (this.element.DATASTORES.ID != undefined){
      datastores = this.element.DATASTORES.ID;

      if (!Array.isArray(datastores)){
        datastores = [datastores];
      }
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: datastores
      }
    };

    this.DatastoresTable = new DatastoresTable(DATASTORES_TABLE_ID, opts);

    return this.DatastoresTable.dataTableHTML;
  }

  function _setup(context) {
    this.DatastoresTable.initialize();
    this.DatastoresTable.refreshResourceTableSelect();

    return false;
  }
});
