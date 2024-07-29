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
  var Locale = require('utils/locale');
  var Buttons = require('./clusters-tab/buttons');
  var Actions = require('./clusters-tab/actions');
  var Table = require('./clusters-tab/datatable');

  var TAB_ID = require('./clusters-tab/tabId');
  var DATATABLE_ID = "dataTableClusters";

  var _dialogs = [
  ];

  var _panels = [
    require('./clusters-tab/panels/info'),
    require('./clusters-tab/panels/hosts'),
    require('./clusters-tab/panels/vnets'),
    require('./clusters-tab/panels/datastores')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [
    require('./clusters-tab/form-panels/create')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Clusters"),
    icon: 'fa-server',
    tabClass: "subTab",
    parentTab: "infrastructure-top-tab",
    listHeader: Locale.tr("Clusters"),
    infoHeader: Locale.tr("Cluster"),
    lockable: false,
    subheader: '<span>\
        <span class="total_clusters"/> <small>'+Locale.tr("TOTAL")+'</small>\
      </span>',
    resource: 'Cluster',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    panelsHooks: _panelsHooks,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return Tab;
});
