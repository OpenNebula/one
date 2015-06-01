define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/acl');

  var RESOURCE = "Acl";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _actions = {
    "Acl.create" : {
      type: "create",
      call: OpenNebulaResource.create,
      callback : function(request, response) {
        Sunstone.resetFormPanel(TAB_ID, CREATE_DIALOG_ID);
        Sunstone.hideFormPanel(TAB_ID);
        Sunstone.getDataTable(TAB_ID).addElement(request, response);
      },
      error: function(request, response) {
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      },
      notify: true
    },

    "Acl.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },

    "Acl.list" : {
      type: "list",
      call: OpenNebulaResource.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: Notifier.onError
    },

    "Acl.refresh" : {
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
      error: Notifier.onError
    },

    "Acl.delete" : {
      type: "multiple",
      call : OpenNebulaResource.del,
      callback : function(request, response) {
        Sunstone.getDataTable(TAB_ID).deleteElement(request, response);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
    },
  };

  return _actions;
});
