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
  var Buttons = require('./vdcs-tab/buttons');
  var Actions = require('./vdcs-tab/actions');
  var Table = require('./vdcs-tab/datatable');

  var TAB_ID = require('./vdcs-tab/tabId');
  var DATATABLE_ID = "dataTableVDCs";

  var _dialogs = [
  ];

  var _panels = [
    require('./vdcs-tab/panels/info'),
    require('./vdcs-tab/panels/groups'),
    require('./vdcs-tab/panels/resources')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [
    require('./vdcs-tab/form-panels/create')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("VDCs"),
    icon: 'fa-th-list',
    tabClass: "subTab",
    parentTab: "system-top-tab",
    listHeader: Locale.tr("Virtual Data Centers"),
    infoHeader: Locale.tr("Virtual Data Center"),
    lockable: false,
    subheader: '<span>\
        <span class="total_vdcs"/> <small>'+Locale.tr("TOTAL")+'</small>\
      </span>',
    resource: 'Vdc',
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
