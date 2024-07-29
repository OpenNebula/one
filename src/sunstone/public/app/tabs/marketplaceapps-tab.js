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
  var Buttons = require('./marketplaceapps-tab/buttons');
  var Actions = require('./marketplaceapps-tab/actions');
  var Table = require('./marketplaceapps-tab/datatable');

  var TAB_ID = require('./marketplaceapps-tab/tabId');
  var DATATABLE_ID = "dataTableMarketplaceApps";

  var _dialogs = [
  ];

  var _panels = [
    require('./marketplaceapps-tab/panels/info'),
    require('./marketplaceapps-tab/panels/templates')
  ];

  var _panelsHooks = [
    require('../utils/hooks/header')
  ];

  var _initHooks = [
    require('./marketplaceapps-tab/hooks/init')
  ];

  var _formPanels = [
    require('./marketplaceapps-tab/form-panels/create'),
    require('./marketplaceapps-tab/form-panels/export')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Apps"),
    icon: 'fa-cloud-download-alt',
    tabClass: "subTab",
    parentTab: "storage-top-tab",
    listHeader: Locale.tr("Apps"),
    infoHeader: Locale.tr("App"),
    lockable: true,
    subheader: '<span>\
        <span class="total_apps"/> <small>'+Locale.tr("TOTAL")+'</small>\
      </span>',
    resource: 'MarketPlaceApp',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    panelsHooks: _panelsHooks,
    initHooks: _initHooks,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return Tab;
});
