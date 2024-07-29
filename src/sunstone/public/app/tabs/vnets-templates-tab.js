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
  var Buttons = require('./vnets-templates-tab/buttons');
  var Actions = require('./vnets-templates-tab/actions');
  var Table = require('./vnets-templates-tab/datatable');

  var TAB_ID = require('./vnets-templates-tab/tabId');
  var DATATABLE_ID = "dataTableVNTemplate";

  var _dialogs = [
    require('./vnets-templates-tab/dialogs/add-ar'),
    require('./vnets-templates-tab/dialogs/update-ar'),
    require('./vnets-templates-tab/dialogs/instantiate-update-ar'),
    require('./vnets-templates-tab/dialogs/instantiate-add-ar')
  ];

  var _panels = [
    require('./vnets-templates-tab/panels/info'),
    require('./vnets-templates-tab/panels/ar'),
    require('./vnets-templates-tab/panels/secgroups'),
    require('./vnets-templates-tab/panels/clusters'),
    require('./vnets-templates-tab/panels/templates')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [
    require('./vnets-templates-tab/form-panels/create'),
    require('./vnets-templates-tab/form-panels/instantiate')
  ];

  var VNetsTemplatesTab = {
    tabId: TAB_ID,
    title: Locale.tr("Network Templates"),
    icon: 'fa-clone',
    tabClass: "subTab",
    parentTab: "network-top-tab",
    listHeader: Locale.tr("Virtual Network Templates"),
    infoHeader: Locale.tr("Virtual Network Template"),
    lockable: true,
    subheader: '<span class="total_vnets_templates"/> <small>'+Locale.tr("TOTAL")+'</small>',
    resource: 'VNTemplate',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    panelsHooks: _panelsHooks,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return VNetsTemplatesTab;
});
