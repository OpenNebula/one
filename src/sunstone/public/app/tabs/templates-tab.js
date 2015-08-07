define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./templates-tab/buttons');
  var Actions = require('./templates-tab/actions');
  var Table = require('./templates-tab/datatable');

  var TAB_ID = require('./templates-tab/tabId');
  var DATATABLE_ID = "dataTableTemplates";

  var _dialogs = [
    require('./templates-tab/dialogs/clone')
  ];

  var _panels = [
    require('./templates-tab/panels/info'),
    require('./templates-tab/panels/template')
  ];

  var _formPanels = [
    require('./templates-tab/form-panels/create'),
    require('./templates-tab/form-panels/import'),
    require('./templates-tab/form-panels/instantiate')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Templates"),
    tabClass: "subTab",
    parentTab: "vresources-tab",
    listHeader: '<i class="fa fa-fw fa-file-o"></i>&emsp;' + Locale.tr("Templates"),
    infoHeader: '<i class="fa fa-fw fa-file-o"></i>&emsp;' + Locale.tr("Template"),
    subheader: '',
    resource: 'Template',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return Tab;
});
