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
  var HostsTable = require('tabs/hosts-tab/datatable');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./hosts/panelId');
  var HOSTS_TABLE_ID = PANEL_ID + "HostsTable";
  var RESOURCE = "Cluster";
  var XML_ROOT = "CLUSTER";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Hosts");
    this.icon = "fa-hdd";

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
    var hosts = [];

    if (this.element.HOSTS.ID != undefined){
      hosts = this.element.HOSTS.ID;

      if (!Array.isArray(hosts)){
        hosts = [hosts];
      }
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: hosts
      }
    };

    this.HostsTable = new HostsTable(HOSTS_TABLE_ID, opts);

    return this.HostsTable.dataTableHTML;
  }

  function _setup(context) {
    this.HostsTable.initialize();
    this.HostsTable.refreshResourceTableSelect();

    return false;
  }
});
