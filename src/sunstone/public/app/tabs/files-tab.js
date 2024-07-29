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
  var Buttons = require('./files-tab/buttons');
  var Actions = require('./files-tab/actions');
  var Table = require('./files-tab/datatable');

  var TAB_ID = require('./files-tab/tabId');
  var DATATABLE_ID = "dataTableFiles";

  var _dialogs = [];

  var _panels = [
    require('./files-tab/panels/info')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [
    require('./files-tab/form-panels/create')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Files"),
    icon: 'fa-archive',
    tabClass: "subTab",
    parentTab: "storage-top-tab",
    listHeader: Locale.tr("Files"),
    infoHeader: Locale.tr("File"),
    lockable: false,
    subheader: '<span>\
        <span class="total_files"/> <small>'+Locale.tr("TOTAL")+'</small>\
      </span>',
    resource: 'File',
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
