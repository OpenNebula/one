define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./zones-tab/buttons');
  var Actions = require('./zones-tab/actions');
  var DataTable = require('./zones-tab/datatable');

  var TAB_ID = require('./zones-tab/tabId');

  var _dialogs = [
    require('./zones-tab/dialogs/create')
  ];

  var _panels = [
    require('./zones-tab/panels/info')
  ];

  var ZonesTab = {
    tabId: TAB_ID,
    title: Locale.tr("Zones"),
    tabClass: "subTab",
    parentTab: "infra-tab",
    listHeader: '<i class="fa fa-fw fa-files-o"></i>&emsp;' + Locale.tr("Zones"),
    infoHeader: '<i class="fa fa-fw fa-files-o"></i>&emsp;' + Locale.tr("Zone"),
    subheader: '',
    resource: 'Zone',
    buttons: Buttons,
    actions: Actions,
    dataTable: DataTable,
    panels: _panels,
    dialogs: _dialogs
  };

  return ZonesTab;
});
