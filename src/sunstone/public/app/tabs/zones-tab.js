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
  var Buttons = require('./zones-tab/buttons');
  var Actions = require('./zones-tab/actions');
  var Table = require('./zones-tab/datatable');

  var TAB_ID = require('./zones-tab/tabId');
  var DATATABLE_ID = "dataTableZones";

  var _dialogs = [
    require('./zones-tab/dialogs/create')
  ];

  var _panels = [
    require('./zones-tab/panels/info')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var ZonesTab = {
    tabId: TAB_ID,
    title: Locale.tr("Zones"),
    icon: 'fa-globe',
    tabClass: "subTab",
    parentTab: "infrastructure-top-tab",
    listHeader: Locale.tr("Zones"),
    infoHeader: Locale.tr("Zone"),
    lockable: false,
    subheader: '<span>\
        <span class="total_zones"/> <small>'+Locale.tr("TOTAL")+'</small>\
      </span>',
    resource: 'Zone',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    panelsHooks: _panelsHooks,
    dialogs: _dialogs
  };

  return ZonesTab;
});
