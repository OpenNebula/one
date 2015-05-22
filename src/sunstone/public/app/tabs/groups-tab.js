define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./groups-tab/buttons');
  var Actions = require('./groups-tab/actions');
  var Table = require('./groups-tab/datatable');

  var TAB_ID = require('./groups-tab/tabId');
  var DATATABLE_ID = "dataTableGroups";

  var _dialogs = [
  ];

  var _panels = [
    require('./groups-tab/panels/info'),
    require('./groups-tab/panels/users'),
    require('./groups-tab/panels/quotas'),
    require('./groups-tab/panels/accounting'),
    require('./groups-tab/panels/showback')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Groups"),
    tabClass: "subTab",
    parentTab: "system-tab",
    listHeader: '<i class="fa fa-fw fa-users"></i>&emsp;'+Locale.tr("Groups"),
    infoHeader: '<i class="fa fa-fw fa-users"></i>&emsp;'+Locale.tr("Group"),
    subheader: '<span>\
        <span class="total_groups"/> <small>'+Locale.tr("TOTAL")+'</small>\
      </span>',
    resource: 'Group',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    dialogs: _dialogs
  };

  return Tab;
});
