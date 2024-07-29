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
  var Buttons = require('./datastores-tab/buttons');
  var Actions = require('./datastores-tab/actions');
  var Table = require('./datastores-tab/datatable');

  var TAB_ID = require('./datastores-tab/tabId');
  var DATATABLE_ID = "dataTableDatastores";

  var _dialogs = [
  ];

  var _formPanels = [
    require('./datastores-tab/form-panels/create'),
    require('./datastores-tab/form-panels/import')
  ];

  var _panels = [
    require('./datastores-tab/panels/info'),
    require('./datastores-tab/panels/images'),
    require('./datastores-tab/panels/clusters')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var DatastoresTab = {
    tabId: TAB_ID,
    title: Locale.tr("Datastores"),
    icon: 'fa-folder-open',
    tabClass: "subTab",
    parentTab: "storage-top-tab",
    listHeader: Locale.tr("Datastores"),
    infoHeader: Locale.tr("Datastore"),
    lockable: false,
    subheader: '<span class="total_ds"/> <small>'+Locale.tr("TOTAL")+'</small>&emsp;\
        <span class="total_on"/> <small>'+Locale.tr("ON")+'</small>&emsp;\
        <span class="total_off"/> <small>'+Locale.tr("OFF")+'</small>',
    resource: 'Datastore',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    panelsHooks: _panelsHooks,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return DatastoresTab;
});
