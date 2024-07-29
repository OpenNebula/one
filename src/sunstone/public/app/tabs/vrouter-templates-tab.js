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
  var Buttons = require('./vrouter-templates-tab/buttons');
  var Actions = require('./vrouter-templates-tab/actions');
  var Table = require('./vrouter-templates-tab/datatable');

  var TAB_ID = require('./vrouter-templates-tab/tabId');
  var DATATABLE_ID = "dataTableVRTemplates";

  var _dialogs = [
  ];

  var _panels = [
    require('./vrouter-templates-tab/panels/info'),
    require('./vrouter-templates-tab/panels/template')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [
    require('./vrouter-templates-tab/form-panels/create'),
    require('./vrouter-templates-tab/form-panels/instantiate')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Virtual Routers"),
    icon: 'fa-random',
    tabClass: "subTab",
    parentTab: "templates-top-tab",
    listHeader: Locale.tr("Virtual Router VM Templates"),
    infoHeader: Locale.tr("Virtual Router VM Template"),
    lockable: true,
    subheader: '<span>\
        <span class="total_vrouters"/> <small>'+Locale.tr("TOTAL")+'</small>\
      </span>',
    resource: 'VirtualRouterTemplate',
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
