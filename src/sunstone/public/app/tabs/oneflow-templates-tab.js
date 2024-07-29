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
  var Buttons = require('./oneflow-templates-tab/buttons');
  var Actions = require('./oneflow-templates-tab/actions');
  var Table = require('./oneflow-templates-tab/datatable');

  var TAB_ID = require('./oneflow-templates-tab/tabId');
  var DATATABLE_ID = "dataTableServiceTemplates";
  var RESOURCE = "ServiceTemplate";

  var _dialogs = [
    require('./oneflow-templates-tab/dialogs/clone')
  ];

  var _panels = [
    require('./oneflow-templates-tab/panels/info'),
    require('./oneflow-templates-tab/panels/roles'),
    require('./oneflow-templates-tab/panels/template')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [
    require('./oneflow-templates-tab/form-panels/create'),
    require('./oneflow-templates-tab/form-panels/instantiate')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Services"),
    icon: 'fa-copy',
    tabClass: "subTab",
    parentTab: "templates-top-tab",
    listHeader: Locale.tr("Service Templates"),
    infoHeader: Locale.tr("Service Template"),
    lockable: false,
    subheader: '',
    content: '<div class="row oneflow_templates_error_message" hidden>\
        <div class="small-6 columns small-centered text-center">\
            <div class="label alert radius">'+Locale.tr("Cannot connect to OneFlow server")+'</div>\
        </div>\
    </div>',
    resource: RESOURCE,
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
