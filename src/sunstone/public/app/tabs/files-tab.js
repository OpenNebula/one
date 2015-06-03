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
