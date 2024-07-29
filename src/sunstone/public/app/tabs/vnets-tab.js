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
  var Buttons = require('./vnets-tab/buttons');
  var Actions = require('./vnets-tab/actions');
  var Table = require('./vnets-tab/datatable');

  var TAB_ID = require('./vnets-tab/tabId');
  var DATATABLE_ID = "dataTableVNets";

  var _dialogs = [
    require('./vnets-tab/dialogs/add-ar'),
    require('./vnets-tab/dialogs/update-ar'),
    require('./vnets-tab/dialogs/reserve'),
    require('./vnets-templates-tab/dialogs/instantiate-add-ar'),
    require('./vnets-tab/dialogs/add-secgroups')
  ];

  var _panels = [
    require('./vnets-tab/panels/info'),
    require('./vnets-tab/panels/ar'),
    require('./vnets-tab/panels/leases'),
    require('./vnets-tab/panels/secgroups'),
    require('./vnets-tab/panels/vrouters'),
    require('./vnets-tab/panels/clusters')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [
    require('./vnets-tab/form-panels/create'),
    require('./vnets-tab/form-panels/import'),
    require('./vnets-tab/form-panels/instantiate')
  ];

  var VNetsTab = {
    tabId: TAB_ID,
    title: Locale.tr("Virtual Networks"),
    icon: 'fa-code-branch',
    tabClass: "subTab",
    parentTab: "network-top-tab",
    listHeader: Locale.tr("Virtual Networks"),
    infoHeader: Locale.tr("Virtual Network"),
    lockable: true,
    subheader: '<span class="total_vnets"/> <small>'+Locale.tr("TOTAL")+'</small>&emsp;\
        <span class="addresses_vnets"/> <small>'+Locale.tr("USED IPs")+'</small>',
    resource: 'Network',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    panelsHooks: _panelsHooks,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return VNetsTab;
});
