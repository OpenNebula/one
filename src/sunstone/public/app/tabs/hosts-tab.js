define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./hosts-tab/buttons');
  var Actions = require('./hosts-tab/actions');
  var Table = require('./hosts-tab/datatable');

  var TAB_ID = require('./hosts-tab/tabId');
  var DATATABLE_ID = "dataTableHosts";

  //var _dialogs = [
  //  require('./hosts-tab/dialogs/create'),
  //  require('./hosts-tab/dialogs/clone')
  //];

  var _panels = [
    require('./hosts-tab/panels/info'),
  //  require('./hosts-tab/panels/vms')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Hosts"),
    tabClass: "subTab",
    parentTab: "infra-tab",
    listHeader: '<i class="fa fa-fw fa-hdd-o"></i>&emsp;' + Locale.tr("Hosts"),
    infoHeader: '<i class="fa fa-fw fa-hdd-o"></i>&emsp;' + Locale.tr("Host"),
    subheader: '<span class="total_hosts"/> <small>' + Locale.tr("TOTAL") + '</small>&emsp;\
        <span class="on_hosts"/> <small>' + Locale.tr("ON") + '</small>&emsp;\
        <span class="off_hosts"/> <small>' + Locale.tr("OFF") + '</small>&emsp;\
        <span class="error_hosts"/> <small>' + Locale.tr("ERROR") + '</small>',
    resource: 'Host',
    content: '',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    //dialogs: _dialogs
  };

  return Tab;
});
