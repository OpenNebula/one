define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./users-tab/buttons');
  var Actions = require('./users-tab/actions');
  var Table = require('./users-tab/datatable');

  var TAB_ID = require('./users-tab/tabId');
  var DATATABLE_ID = "dataTableUsers";

  var _dialogs = [
  ];

  var _panels = [
    require('./users-tab/panels/info'),
    require('./users-tab/panels/quotas')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Users"),
    tabClass: "subTab",
    parentTab: "system-tab",
    listHeader: '<i class="fa fa-fw fa-user"></i>&emsp;'+Locale.tr("Users"),
    infoHeader: '<i class="fa fa-fw fa-user"></i>&emsp;'+Locale.tr("User"),
    subheader: '<span>\
        <span class="total_users"/> <small>'+Locale.tr("TOTAL")+'</small>\
      </span>',
    resource: 'User',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    dialogs: _dialogs
  };

  return Tab;
});
