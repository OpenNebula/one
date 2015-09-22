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
  var Buttons = require('./images-tab/buttons');
  var Actions = require('./images-tab/actions');
  var Table = require('./images-tab/datatable');

  var TAB_ID = require('./images-tab/tabId');
  var DATATABLE_ID = "dataTableImages";

  var _dialogs = [
    require('./images-tab/dialogs/clone')
  ];

  var _panels = [
    require('./images-tab/panels/info'),
    require('./images-tab/panels/vms'),
    require('./images-tab/panels/snapshots')
  ];

  var _formPanels = [
    require('./images-tab/form-panels/create')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Images"),
    tabClass: "subTab",
    parentTab: "vresources-tab",
    listHeader: '<i class="fa fa-fw fa-upload"></i>&emsp;' + Locale.tr("Images"),
    infoHeader: '<i class="fa fa-fw fa-upload"></i>&emsp;' + Locale.tr("Image"),
    subheader: '',
    resource: 'Image',
    content: '<div id="upload_progress_bars" class="large-12 columns"></div>',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return Tab;
});
