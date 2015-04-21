define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./zones-tab/buttons');
  var Actions = require('./zones-tab/actions');
  var DataTable = require('./zones-tab/datatable');

  var DialogCreate = require('./zones-tab/dialogs/create');

  var _dialogs = {};
  $.each([DialogCreate], function(index, dialog){
    _dialogs[dialog.dialogId] = dialog
  })

  var PanelInfo = require('./zones-tab/panels/info');

  var _panels = {};
  $.each([PanelInfo], function(index, panel){
    _panels[panel.panelId] = panel
  })

  var zonesTab = {
    title: Locale.tr("Zones"),
    resource: 'Zone',
    tabClass: "subTab",
    parentTab: "infra-tab",
    listHeader: '<i class="fa fa-fw fa-files-o"></i>&emsp;' + Locale.tr("Zones"),
    infoHeader: '<i class="fa fa-fw fa-files-o"></i>&emsp;' + Locale.tr("Zone"),
    subheader: '',
    buttons: Buttons,
    actions: Actions,
    dataTable: DataTable,
    panels: _panels,
    dialogs: _dialogs
  };

  return {
    'definition': zonesTab
  }
});
