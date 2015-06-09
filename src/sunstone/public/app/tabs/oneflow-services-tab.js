define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./oneflow-services-tab/buttons');
  var Actions = require('./oneflow-services-tab/actions');
  var Table = require('./oneflow-services-tab/datatable');

  var TAB_ID = require('./oneflow-services-tab/tabId');
  var DATATABLE_ID = "dataTableService";
  var RESOURCE = "Service";

  var _dialogs = [
  ];

  var _panels = [
    require('./oneflow-services-tab/panels/info')
  ];

  var _formPanels = [
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Services"),
    tabClass: "subTab",
    parentTab: "oneflow-dashboard",
    listHeader: '<i class="fa fa-fw fa-cubes"></i>&emsp;'+Locale.tr("OneFlow - Services"),
    infoHeader: '<i class="fa fa-fw fa-cubes"></i>&emsp;'+Locale.tr("OneFlow - Service"),
    subheader: '',
    content: '<div class="row oneflow_services_error_message" hidden>\
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
