/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
  var Buttons = require('./marketplace-tab/buttons');
  var Actions = require('./marketplace-tab/actions');
  var Table = require('./marketplace-tab/datatable');

  var TAB_ID = require('./marketplace-tab/tabId');
  var DATATABLE_ID = "dataTableMarketplace";

  var _dialogs = [
    require('./marketplace-tab/dialogs/import')
  ];

  var _panels = [
    require('./marketplace-tab/panels/info')
  ];

  var _formPanels = [
  ];

  var Tab = {
    tabId: TAB_ID,
    title: '<i class="fa fa-lg fa-fw fa-shopping-cart"></i>&emsp;' + Locale.tr("Marketplace"),
    listHeader: '<i class="fa fa-fw fa-shopping-cart"></i>&emsp;'+Locale.tr("OpenNebula Marketplace"),
    infoHeader: '<i class="fa fa-fw fa-shopping-cart"></i>&emsp;'+Locale.tr("Appliance"),
    subheader: '<span/> <small></small>&emsp;',
    resource: 'Marketplace',
    content: '<div class="row marketplace_error_message" hidden>\
        <div class="small-6 columns small-centered text-center">\
            <div class="alert-box alert radius">'+Locale.tr("Cannot connect to OpenNebula Marketplace")+'</div>\
        </div>\
    </div>',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true, oneSelection: true}),
    panels: _panels,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return Tab;
});
