/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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
  var Buttons = require('./backupjob-tab/buttons');
  var Actions = require('./backupjob-tab/actions');
  var Table = require('./backupjob-tab/datatable');

  var TAB_ID = require('./backupjob-tab/tabId');
  var DATATABLE_ID = "dataTableBackupJob";

  var _dialogs = [
    require('./backupjob-tab/dialogs/editVms')
  ];

  var _panels = [
    require('./backupjob-tab/panels/info'),
    require('./backupjob-tab/panels/vms'),
    require('./backupjob-tab/panels/actions'),
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [
    require('./backupjob-tab/form-panels/create')
  ];

  var BackupJobTab = {
    tabId: TAB_ID,
    title: Locale.tr("BackupsJobs"),
    icon: 'fa-clock',
    tabClass: "subTab",
    parentTab: "storage-top-tab",
    listHeader: Locale.tr("BackupsJobs"),
    infoHeader: Locale.tr("BackupsJobs"),
    lockable: false,
    resource: 'BackupJob',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    panelsHooks: _panelsHooks,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return BackupJobTab;
});
