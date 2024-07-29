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
  var Buttons = require('./vrouters-tab/buttons');
  var Actions = require('./vrouters-tab/actions');
  var Table = require('./vrouters-tab/datatable');

  var TAB_ID = require('./vrouters-tab/tabId');
  var DATATABLE_ID = "dataTableVirtualRouters";

  var _dialogs = [
    require('./vrouters-tab/dialogs/attach-nic')
  ];

  var _panels = [
    require('./vrouters-tab/panels/info'),
    require('./vrouters-tab/panels/vms')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [
    require('./vrouters-tab/form-panels/create'),
    require('./vrouters-tab/form-panels/instantiate')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Virtual Routers"),
    icon: 'fa-random',
    tabClass: "subTab",
    parentTab: "instances-top-tab",
    listHeader: Locale.tr("Virtual Routers"),
    infoHeader: Locale.tr("Virtual Router"),
    lockable: true,
    subheader: '<span>\
        <span class="total_routers"/> <small>'+Locale.tr("TOTAL")+'</small>\
      </span>',
    resource: 'VirtualRouter',
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
