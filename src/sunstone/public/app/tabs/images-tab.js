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
