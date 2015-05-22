define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./vdcs-tab/buttons');
  var Actions = require('./vdcs-tab/actions');
  var Table = require('./vdcs-tab/datatable');

  var TAB_ID = require('./vdcs-tab/tabId');
  var DATATABLE_ID = "dataTableVDCs";

  var _dialogs = [
  ];

  var _panels = [
    require('./vdcs-tab/panels/info')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("VDCs"),
    tabClass: "subTab",
    parentTab: "system-tab",
    listHeader: '<i class="fa fa-fw fa-th"></i>&emsp;'+Locale.tr("Virtual Data Centers"),
    infoHeader: '<i class="fa fa-fw fa-th"></i>&emsp;'+Locale.tr("Virtual Data Center"),
    subheader: '<span>\
        <span class="total_vdcs"/> <small>'+Locale.tr("TOTAL")+'</small>\
      </span>',
    resource: 'Vdc',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    dialogs: _dialogs
  };

  return Tab;
});
