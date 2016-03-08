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
  var Buttons = require('./oneflow-services-tab/buttons');
  var Actions = require('./oneflow-services-tab/actions');
  var Table = require('./oneflow-services-tab/datatable');

  var TAB_ID = require('./oneflow-services-tab/tabId');
  var DATATABLE_ID = "dataTableService";
  var RESOURCE = "Service";

  var _dialogs = [
    require('./oneflow-services-tab/dialogs/scale'),
  ];

  var _panels = [
    require('./oneflow-services-tab/panels/info'),
    require('./oneflow-services-tab/panels/roles'),
    require('./oneflow-services-tab/panels/log')
  ];

  var _panelsHooks = [
    require('./oneflow-services-tab/hooks/header')
  ];

  var _formPanels = [
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Services"),
    tabClass: "subTab",
    parentTab: "oneflow-dashboard-tab",
    listHeader: '<i class="fa fa-fw fa-cubes"></i>&emsp;'+Locale.tr("OneFlow - Services"),
    infoHeader: '<i class="fa fa-fw fa-cubes"></i>&emsp;'+Locale.tr("OneFlow - Service"),
    subheader: '',
    content: '<div class="row oneflow_services_error_message" hidden>\
        <div class="small-6 columns small-centered text-center">\
            <div class="alert-box alert radius">'+Locale.tr("Cannot connect to OneFlow server")+'</div>\
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
