define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./oneflow-templates-tab/buttons');
  var Actions = require('./oneflow-templates-tab/actions');
  var Table = require('./oneflow-templates-tab/datatable');

  var TAB_ID = require('./oneflow-templates-tab/tabId');
  var DATATABLE_ID = "dataTableServiceTemplates";
  var RESOURCE = "ServiceTemplate";

  var _dialogs = [
  ];

  var _panels = [
    require('./oneflow-templates-tab/panels/info'),
    require('./oneflow-templates-tab/panels/roles')
  ];

  var _formPanels = [
    require('./oneflow-templates-tab/form-panels/create'),
    require('./oneflow-templates-tab/form-panels/instantiate')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Templates"),
    tabClass: "subTab",
    parentTab: "oneflow-dashboard",
    listHeader: '<i class="fa fa-fw fa-file-o"></i>&emsp;'+Locale.tr("OneFlow - Templates"),
    infoHeader: '<i class="fa fa-fw fa-file-o"></i>&emsp;'+Locale.tr("OneFlow - Template"),
    subheader: '',
    content: '<div class="row oneflow_templates_error_message" hidden>\
        <div class="small-6 columns small-centered text-center">\
            <div class="alert-box alert radius">'+Locale.tr("Cannot connect to OneFlow server")+'</div>\
        </div>\
    </div>',
    resource: RESOURCE,
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return Tab;
});
