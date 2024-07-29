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
  var Buttons = require('./acls-tab/buttons');
  var Actions = require('./acls-tab/actions');
  var Table = require('./acls-tab/datatable');

  var TAB_ID = require('./acls-tab/tabId');
  var DATATABLE_ID = "dataTableAcls";

  var _dialogs = [
  ];

  var _panels = [
  ];

  var _formPanels = [
    require('./acls-tab/form-panels/create')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("ACLs"),
    icon: 'fa-key',
    tabClass: "subTab",
    parentTab: "system-top-tab",
    listHeader: Locale.tr("Access Control Lists"),
    lockable: false,
    subheader: '<span>\
        <span class="total_acl"/> <small>'+Locale.tr("TOTAL")+'</small>\
      </span>',
    resource: 'Acl',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: false}),
    panels: _panels,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return Tab;
});
