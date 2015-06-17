define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/group');

  var RESOURCE = "Group";
  var XML_ROOT = "GROUP";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var QUOTAS_DIALOG_ID = require('./dialogs/quotas/dialogId');

  var _actions = {
    "Group.create" : {
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

    "Group.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },

    "Group.list" : {
      type: "list",
      call: OpenNebulaResource.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: Notifier.onError
    },

    "Group.show" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateElement(request, response);
        if (Sunstone.rightInfoVisible($('#'+TAB_ID))) {
          Sunstone.insertPanels(TAB_ID, response);
        }
      },
      error: Notifier.onError
    },

    "Group.refresh" : {
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

    "Group.update" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(request, response){
        Sunstone.hideFormPanel(TAB_ID);
      },
      error: function(request, response){
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      }
    },

    "Group.update_template" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(request) {
        Sunstone.runAction(RESOURCE+'.show',request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Group.update_dialog" : {
      type: "single",
      call: function() {
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        if (selected_nodes.length != 1) {
          Notifier.notifyMessage("Please select one (and just one) group to update.");
          return false;
        }

        var resource_id = "" + selected_nodes[0];
        Sunstone.runAction(RESOURCE+".show_to_update", resource_id);
      }
    },

    "Group.show_to_update" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function(request, response) {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "update",
          function(formPanelInstance, context) {
            formPanelInstance.fill(context, response[XML_ROOT]);
          });
      },
      error: Notifier.onError
    },

    "Group.delete" : {
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

    "Group.fetch_quotas" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function (request,response) {
        Sunstone.getDialog(QUOTAS_DIALOG_ID).setParams({element: response[XML_ROOT]});
        Sunstone.getDialog(QUOTAS_DIALOG_ID).reset();
        Sunstone.getDialog(QUOTAS_DIALOG_ID).show();
      },
      error: Notifier.onError
    },

    "Group.quotas_dialog" : {
      type: "custom",
      call: function() {
        var tab = $('#' + TAB_ID);
        if (Sunstone.rightInfoVisible(tab)) {
          $('a[href="#group_quotas_tab"]', tab).click();
          $('#edit_quotas_button', tab).click();
        } else {
          var sel_elems = Sunstone.getDataTable(TAB_ID).elements();
          //If only one group is selected we fecth the group's quotas
          if (sel_elems.length == 1){
            Sunstone.runAction(RESOURCE+'.fetch_quotas',sel_elems[0]);
          } else {
            // More than one, shows '0' usage
            Sunstone.getDialog(QUOTAS_DIALOG_ID).setParams({element: {}});
            Sunstone.getDialog(QUOTAS_DIALOG_ID).reset();
            Sunstone.getDialog(QUOTAS_DIALOG_ID).show();
          }
        }
      }
    },

    "Group.set_quota" : {
      type: "multiple",
      call: OpenNebulaResource.set_quota,
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      callback: function(request) {
        Sunstone.getDialog(QUOTAS_DIALOG_ID).hide();

        Sunstone.runAction(RESOURCE+'.show',request.request.data[0]);
      },
      error: Notifier.onError
    },

    "Group.add_admin" : {
      type: "single",
      call : OpenNebulaResource.add_admin,
      callback : function (req) {
        Sunstone.runAction(RESOURCE+'.show',req.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Group.del_admin" : {
      type: "single",
      call : OpenNebulaResource.del_admin,
      callback : function (req) {
        Sunstone.runAction(RESOURCE+'.show',req.request.data[0][0]);
      },
      error: Notifier.onError
    }
  };

  return _actions;
});
