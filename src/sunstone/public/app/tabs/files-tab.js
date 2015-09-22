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
  var Buttons = require('./files-tab/buttons');
  var Actions = require('./files-tab/actions');
  var Table = require('./files-tab/datatable');

  var TAB_ID = require('./files-tab/tabId');
  var DATATABLE_ID = "dataTableFiles";

  var _dialogs = [];

  var _panels = [
    require('./files-tab/panels/info')
  ];

  var _formPanels = [
    require('./files-tab/form-panels/create')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Files & Kernels"),
    tabClass: "subTab",
    parentTab: "vresources-tab",
    listHeader: '<i class="fa fa-fw fa-folder-open"></i>&emsp;' + Locale.tr("Files & Kernels"),
    infoHeader: '<i class="fa fa-fw fa-folder-open"></i>&emsp;' + Locale.tr("File"),
    subheader: '',
    resource: 'File',
    content: '<div class="large-12 columns">\
                <div id="files_upload_progress_bars"></div>\
              </div>',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return Tab;
});
