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

define(function(require){
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var ClustersTable = require('tabs/clusters-tab/datatable');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./clusters/panelId');
  var CLUSTERS_TABLE_ID = PANEL_ID + "ClustersTable"
  var RESOURCE = "VNTemplate";
  var XML_ROOT = "VNTEMPLATE";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Clusters");
    this.icon = "fa-server";

    this.element = info[XML_ROOT];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var clusters = [];

    if (this.element.TEMPLATE.CLUSTERS != undefined){
      clusters = this.element.TEMPLATE.CLUSTER_IDS.split(",");

      if (!Array.isArray(clusters)){
        clusters = [clusters];
      }
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: clusters
      }
    };

    this.clustersDataTable = new ClustersTable(CLUSTERS_TABLE_ID, opts);

    return this.clustersDataTable.dataTableHTML;
  }

  function _setup(context) {
    this.clustersDataTable.initialize();
    this.clustersDataTable.refreshResourceTableSelect();

    return false;
  }
})
