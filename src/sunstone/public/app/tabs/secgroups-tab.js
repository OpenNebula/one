define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./secgroups-tab/buttons');
  var Actions = require('./secgroups-tab/actions');
  var Table = require('./secgroups-tab/datatable');

  var TAB_ID = require('./secgroups-tab/tabId');
  var DATATABLE_ID = "dataTableSecurityGroups";

  var _dialogs = [
  ];

  var _panels = [
    require('./secgroups-tab/panels/info')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Security Groups"),
    tabClass: "subTab",
    parentTab: "infra-tab",
    listHeader: '<i class="fa fa-fw fa-shield"></i>&emsp;'+Locale.tr("Security Groups"),
    infoHeader: '<i class="fa fa-fw fa-shield"></i>&emsp;'+Locale.tr("Security Group"),
    subheader: '<span/> <small></small>&emsp;',
    resource: 'SecurityGroup',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    dialogs: _dialogs
  };

  return Tab;
});
