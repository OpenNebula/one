define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./datastores-tab/buttons');
  var Actions = require('./datastores-tab/actions');
  var Table = require('./datastores-tab/datatable');

  var TAB_ID = require('./datastores-tab/tabId');
  var DATATABLE_ID = "dataTableDatastores";

  var _dialogs = [
    require('./datastores-tab/dialogs/create')
  ];

  var _panels = [
    require('./datastores-tab/panels/info'),
    require('./datastores-tab/panels/images')
  ];

  var DatastoresTab = {
    tabId: TAB_ID,
    title: Locale.tr("Datastores"),
    tabClass: "subTab",
    parentTab: "infra-tab",
    listHeader: '<i class="fa fa-fw fa-files-o"></i>&emsp;' + Locale.tr("Datastores"),
    infoHeader: '<i class="fa fa-fw fa-files-o"></i>&emsp;' + Locale.tr("Datastore"),
    subheader: '',
    resource: 'Datastore',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID),
    panels: _panels,
    dialogs: _dialogs
  };

  return DatastoresTab;
});