define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./acls-tab/buttons');
  var Actions = require('./acls-tab/actions');
  var Table = require('./acls-tab/datatable');

  var TAB_ID = require('./acls-tab/tabId');
  var DATATABLE_ID = "dataTableAcls";

  var _dialogs = [
  ];

  var _panels = [
  ];

  var _formPanels = [
    //require('./acls-tab/form-panels/create')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("ACLs"),
    tabClass: "subTab",
    parentTab: "system-tab",
    listHeader: '<i class="fa fa-key"></i>&emsp;'+Locale.tr("Access Control Lists"),
    subheader: '<span/><small></small>&emsp;',
    resource: 'Acl',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: false}),
    panels: _panels,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return Tab;
});
