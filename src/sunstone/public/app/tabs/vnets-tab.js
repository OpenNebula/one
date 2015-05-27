define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./vnets-tab/buttons');
  var Actions = require('./vnets-tab/actions');
  var Table = require('./vnets-tab/datatable');

  var TAB_ID = require('./vnets-tab/tabId');
  var DATATABLE_ID = "dataTableVNets";

  var _dialogs = [
    require('./vnets-tab/dialogs/add-ar')
  ];

  var _panels = [
    require('./vnets-tab/panels/info'),
    require('./vnets-tab/panels/ar'),
    require('./vnets-tab/panels/leases'),
    require('./vnets-tab/panels/secgroups')
  ];

  var _formPanels = [
    require('./vnets-tab/form-panels/create')
  ]

  var VNetsTab = {
    tabId: TAB_ID,
    title: Locale.tr("Virtual Networks"),
    tabClass: "subTab",
    parentTab: "infra-tab",
    listHeader: '<i class="fa fa-fw fa-globe"></i>&emsp;' + Locale.tr("Virtual Networks"),
    infoHeader: '<i class="fa fa-fw fa-globe"></i>&emsp;' + Locale.tr("Virtual Network"),
    subheader: '<span class="total_vnets"/> <small>'+Locale.tr("TOTAL")+'</small>&emsp;\
        <span class="addresses_vnets"/> <small>'+Locale.tr("USED IPs")+'</small>',
    resource: 'Network',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return VNetsTab;
});
