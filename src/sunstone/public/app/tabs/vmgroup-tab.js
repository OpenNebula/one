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
  var Buttons = require('./vmgroup-tab/buttons');
  var Actions = require('./vmgroup-tab/actions');
  var Table = require('./vmgroup-tab/datatable');

  var TAB_ID = require('./vmgroup-tab/tabId');
  var DATATABLE_ID = "dataTableVMGroup";

  var _panels = [
    require('./vmgroup-tab/panels/info'),
    require('./vmgroup-tab/panels/vms')
  ];

  var _formPanels = [
    require('./vmgroup-tab/form-panels/create')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("VM Groups"),
    icon: 'fa-folder-open',
    tabClass: "subTab",
    parentTab: "templates-top-tab",
    listHeader: Locale.tr("VM Groups"),
    infoHeader: Locale.tr("VM Groups"),
    lockable: true,
    subheader: '<span>\
        <span class="total_vmgroup"/> <small>'+Locale.tr("TOTAL")+'</small>\
        </small>&emsp;\
        <span class="total_vms_vmgroup"/> <small>'+Locale.tr("TOTAL VMs")+'</small></span>',
    resource: 'VMGroup',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    formPanels: _formPanels
  };

  return Tab;
});
