define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/marketplace');

  var RESOURCE = "Marketplace";
  var TAB_ID = require('./tabId');
  //var IMPORT_DIALOG_ID = require('./dialogs/import/dialogId');

  var _actions = {
    "Marketplace.list" : {
      type: "list",
      call: OpenNebulaResource.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response.appliances);
      }
    },

    "Marketplace.refresh" : {
      type: "custom",
      call: function() {
        var tab = $('#' + TAB_ID);
        if (Sunstone.rightInfoVisible(tab)) {
          Sunstone.runAction(RESOURCE+".show", Sunstone.rightInfoResourceId(tab));
        } else {
          Sunstone.getDataTable(TAB_ID).waitingNodes();
          Sunstone.runAction(RESOURCE+".list", {force: true});
        }
      },
    },

    "Marketplace.import" : {
      // TODO
    },

    "Marketplace.show" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function(request, response) {
        if (Sunstone.rightInfoVisible($('#'+TAB_ID))) {
          Sunstone.insertPanels(TAB_ID, response);
        }
      },
      error: Notifier.onError
    }
  };

  return _actions;
});
