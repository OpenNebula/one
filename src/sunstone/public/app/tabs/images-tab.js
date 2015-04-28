define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./images-tab/buttons');
  var Actions = require('./images-tab/actions');
  var DataTable = require('./images-tab/datatable');

  var TAB_ID = require('./images-tab/tabId');

  //var _dialogs = [
  //  require('./images-tab/dialogs/create')
  //];

  //var _panels = [
  //  require('./images-tab/panels/info')
  //];

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
    dataTable: DataTable,
    //panels: _panels,
    //dialogs: _dialogs
  };

  return Tab;
});
