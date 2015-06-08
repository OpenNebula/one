define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./marketplace-tab/buttons');
  var Actions = require('./marketplace-tab/actions');
  var Table = require('./marketplace-tab/datatable');

  var TAB_ID = require('./marketplace-tab/tabId');
  var DATATABLE_ID = "dataTableMarketplace";

  var _dialogs = [
    require('./marketplace-tab/dialogs/import')
  ];

  var _panels = [
    require('./marketplace-tab/panels/info')
  ];

  var _formPanels = [
  ];

  var Tab = {
    tabId: TAB_ID,
    title: '<i class="fa fa-lg fa-fw fa-shopping-cart"></i>&emsp;' + Locale.tr("Marketplace"),
    listHeader: '<i class="fa fa-fw fa-shopping-cart"></i>&emsp;'+Locale.tr("OpenNebula Marketplace"),
    infoHeader: '<i class="fa fa-fw fa-shopping-cart"></i>&emsp;'+Locale.tr("Appliance"),
    subheader: '<span/> <small></small>&emsp;',
    resource: 'Marketplace',
    content: '<div class="row marketplace_error_message" hidden>\
        <div class="small-6 columns small-centered text-center">\
            <div class="alert-box alert radius">'+Locale.tr("Cannot connect to OpenNebula Marketplace")+'</div>\
        </div>\
    </div>',
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return Tab;
});
