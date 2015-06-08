define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./vms-tab/buttons');
  var Actions = require('./vms-tab/actions');
  var Table = require('./vms-tab/datatable');

  var TAB_ID = require('./vms-tab/tabId');
  var DATATABLE_ID = "dataTableVms";

  var _dialogs = [
    require('./vms-tab/dialogs/deploy'),
    require('./vms-tab/dialogs/migrate'),
    require('./vms-tab/dialogs/resize')
  ];

  var _panels = [
    require('./vms-tab/panels/info'),
    require('./vms-tab/panels/capacity'),
  //  require('./vms-tab/panels/template')
  ];

  var _formPanels = [
    require('./vms-tab/form-panels/create')
  ]

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Virtual Machines"),
    tabClass: "subTab",
    parentTab: "vresources-tab",
    listHeader: '<i class="fa fa-fw fa-th"></i>&emsp;' + Locale.tr("Virtual Machines"),
    infoHeader: '<i class="fa fa-fw fa-th"></i>&emsp;' + Locale.tr("VM"),
    subheader: '<span class="total_vms"/> <small>' + Locale.tr("TOTAL") + '</small>&emsp;\
        <span class="active_vms"/> <small>' + Locale.tr("ACTIVE") + '</small>&emsp;\
        <span class="off_vms"/> <small>' + Locale.tr("OFF") + '</small>&emsp;\
        <span class="pending_vms"/> <small>' + Locale.tr("PENDING") + '</small>&emsp;\
        <span class="failed_vms"/> <small>' + Locale.tr("FAILED") + '</small>',
    resource: 'VM',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return Tab;
});
