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
  var Buttons = require('./hosts-tab/buttons');
  var Actions = require('./hosts-tab/actions');
  var Table = require('./hosts-tab/datatable');

  var TAB_ID = require('./hosts-tab/tabId');
  var DATATABLE_ID = "dataTableHosts";

  var _panels = [
    require('./hosts-tab/panels/info'),
    require('./hosts-tab/panels/monitor'),
    require('./hosts-tab/panels/vms'),
    require('./hosts-tab/panels/wilds'),
    require('./hosts-tab/panels/zombies'),
    require('./hosts-tab/panels/esx'),
    require('./hosts-tab/panels/pci'),
    require('./hosts-tab/panels/numa'),
    require('./hosts-tab/panels/pool'),
    require('./hosts-tab/panels/nsx')
  ];
  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [
    require('./hosts-tab/form-panels/create')
  ]

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Hosts"),
    icon: 'fa-hdd',
    tabClass: "subTab",
    parentTab: "infrastructure-top-tab",
    listHeader: Locale.tr("Hosts"),
    infoHeader: Locale.tr("Host"),
    lockable: false,
    subheader: '<span class="total_hosts"/> <small>' + Locale.tr("TOTAL") + '</small>&emsp;\
        <span class="on_hosts"/> <small>' + Locale.tr("ON") + '</small>&emsp;\
        <span class="off_hosts"/> <small>' + Locale.tr("OFF") + '</small>&emsp;\
        <span class="error_hosts"/> <small>' + Locale.tr("ERROR") + '</small>',
    resource: 'Host',
    content: '',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    panelsHooks: _panelsHooks,
    formPanels: _formPanels,
    //dialogs: _dialogs
  };

  return Tab;
});
