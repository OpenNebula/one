/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
  var Buttons = require('./secgroups-tab/buttons');
  var Actions = require('./secgroups-tab/actions');
  var Table = require('./secgroups-tab/datatable');

  var TAB_ID = require('./secgroups-tab/tabId');
  var DATATABLE_ID = "dataTableSecurityGroups";

  var _dialogs = [
    require('./secgroups-tab/dialogs/clone')
  ];

  var _panels = [
    require('./secgroups-tab/panels/info')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [
    require('./secgroups-tab/form-panels/create')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Security Groups"),
    tabClass: "subTab",
    parentTab: "infra-tab",
    listHeader: '<i class="fa fa-fw fa-shield"></i>&emsp;'+Locale.tr("Security Groups"),
    infoHeader: '<i class="fa fa-fw fa-shield"></i>&emsp;'+Locale.tr("Security Group"),
    subheader: '<span/> <small></small>&emsp;',
    resource: 'SecurityGroup',
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
