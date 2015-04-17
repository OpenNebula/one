define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./zones-tab/buttons');
  var Actions = require('./zones-tab/actions');
  var DataTable = require('./zones-tab/datatable');
  var Panels = require('./zones-tab/panels');

  var zonesTab = {
    title: Locale.tr("Zones"),
    resource: 'Zone',
    tabClass: "subTab",
    parentTab: "infra-tab",
    listHeader: '<i class="fa fa-fw fa-files-o"></i>&emsp;' + Locale.tr("Zones"),
    infoHeader: '<i class="fa fa-fw fa-files-o"></i>&emsp;' + Locale.tr("Zone"),
    subheader: '',
    buttons: Buttons,
    actions: Actions,
    panels: Panels,
    dataTable: DataTable
  };

  return {
    'definition': zonesTab
  }
});
