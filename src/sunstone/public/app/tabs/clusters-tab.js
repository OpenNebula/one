define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./clusters-tab/buttons');
  var Actions = require('./clusters-tab/actions');
  var Table = require('./clusters-tab/datatable');

  var TAB_ID = require('./clusters-tab/tabId');
  var DATATABLE_ID = "dataTableClusters";

  var _dialogs = [
  ];

  var _panels = [
    require('./clusters-tab/panels/info')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Clusters"),
    tabClass: "subTab",
    parentTab: "infra-tab",
    listHeader: '<i class="fa fa-fw fa-th"></i>&emsp;'+Locale.tr("Clusters"),
    infoHeader: '<i class="fa fa-fw fa-th"></i>&emsp;'+Locale.tr("Cluster"),
    subheader: '<span/> <small></small>&emsp;',
    resource: 'Cluster',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    dialogs: _dialogs
  };

  return Tab;
});
