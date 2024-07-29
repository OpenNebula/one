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
  var Buttons = require('./groups-tab/buttons');
  var Actions = require('./groups-tab/actions');
  var Table = require('./groups-tab/datatable');

  var TAB_ID = require('./groups-tab/tabId');
  var DATATABLE_ID = "dataTableGroups";

  var _dialogs = [
    require('./groups-tab/dialogs/quotas')
  ];

  var _panels = [
    require('./groups-tab/panels/info'),
    require('./groups-tab/panels/users'),
    require('./groups-tab/panels/quotas'),
    require('./groups-tab/panels/accounting'),
    require('./groups-tab/panels/showback')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _formPanels = [
    require('./groups-tab/form-panels/create')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Groups"),
    icon: 'fa-users',
    tabClass: "subTab",
    parentTab: "system-top-tab",
    listHeader: Locale.tr("Groups"),
    infoHeader: Locale.tr("Group"),
    lockable: false,
    subheader: '<span>\
        <span class="total_groups"/> <small>'+Locale.tr("TOTAL")+'</small>\
      </span>',
    resource: 'Group',
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
