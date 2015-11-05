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
  var Buttons = require('./templates-tab/buttons');
  var Actions = require('./templates-tab/actions');
  var Table = require('./templates-tab/datatable');

  var TAB_ID = require('./templates-tab/tabId');
  var DATATABLE_ID = "dataTableTemplates";

  var _dialogs = [
    require('./templates-tab/dialogs/clone')
  ];

  var _panels = [
    require('./templates-tab/panels/info'),
    require('./templates-tab/panels/template')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [
    require('./templates-tab/form-panels/create'),
    require('./templates-tab/form-panels/import'),
    require('./templates-tab/form-panels/instantiate')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Templates"),
    tabClass: "subTab",
    parentTab: "vresources-tab",
    listHeader: '<i class="fa fa-fw fa-file-o"></i>&emsp;' + Locale.tr("Templates"),
    infoHeader: '<i class="fa fa-fw fa-file-o"></i>&emsp;' + Locale.tr("Template"),
    subheader: '',
    resource: 'Template',
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
