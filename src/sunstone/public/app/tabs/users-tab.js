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
  var Buttons = require('./users-tab/buttons');
  var Actions = require('./users-tab/actions');
  var Table = require('./users-tab/datatable');

  var TAB_ID = require('./users-tab/tabId');
  var DATATABLE_ID = "dataTableUsers";

  var _dialogs = [
    require('./users-tab/dialogs/password'),
    require('./users-tab/dialogs/auth-driver'),
    require('./users-tab/dialogs/quotas'),
    require('./users-tab/dialogs/groups'),
    require('./users-tab/dialogs/login-token')
  ];

  var _panels = [
    require('./users-tab/panels/info'),
    require('./users-tab/panels/groups'),
    require('./users-tab/panels/quotas'),
    require('./users-tab/panels/accounting'),
    require('./users-tab/panels/showback'),
    require('./users-tab/panels/auth')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [
    require('./users-tab/form-panels/create')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Users"),
    icon: 'fa-user',
    tabClass: "subTab",
    parentTab: "system-top-tab",
    listHeader: Locale.tr("Users"),
    infoHeader: Locale.tr("User"),
    lockable: false,
    subheader: '<span>\
        <span class="total_users"/> <small>'+Locale.tr("TOTAL")+'</small>\
      </span>',
    resource: 'User',
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
