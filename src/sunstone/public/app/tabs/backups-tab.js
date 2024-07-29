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
  var Buttons = require('./backups-tab/buttons');
  var Actions = require('./backups-tab/actions');
  var Table = require('./backups-tab/datatable');

  var TAB_ID = require('./backups-tab/tabId');
  var DATATABLE_ID = "dataTableBackup";

  var _dialogs = [
    require('./backups-tab/dialogs/restore')
  ];

  var _panels = [
    require('./backups-tab/panels/info'),
    require('./backups-tab/panels/vms'),
    require('./backups-tab/panels/increments'),
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Backups"),
    icon: 'fa-database',
    tabClass: "subTab",
    parentTab: "storage-top-tab",
    listHeader: Locale.tr("Backups"),
    infoHeader: Locale.tr("Backup"),
    lockable: false,
    subheader: '<span>\
        <span class="total_backups"/> <small>'+Locale.tr("TOTAL")+'</small>\
      </span>',
    resource: 'Backup',
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
