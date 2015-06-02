define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/securitygroup');

  var RESOURCE = "SecurityGroup";
  var XML_ROOT = "SECURITY_GROUP";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _actions = {

    "SecurityGroup.create" : {
      type: "create",
      call: OpenNebulaResource.create,
      callback: function(request, response) {
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

    "SecurityGroup.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },

    "SecurityGroup.list" : {
      type: "list",
      call: OpenNebulaResource.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: Notifier.onError
    },

    "SecurityGroup.show" : {
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

    "SecurityGroup.refresh" : {
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

    "SecurityGroup.delete" : {
      type: "multiple",
      call : OpenNebulaResource.del,
      callback : function(request, response) {
        Sunstone.getDataTable(TAB_ID).deleteElement(request, response);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "SecurityGroup.update_dialog" : {
      type: "custom",
      call: function() {
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        if (selected_nodes.length != 1) {
          Notifier.notifyMessage("Please select one (and just one) Security Group to update.");
          return false;
        }

        var resource_id = "" + selected_nodes[0];
        Sunstone.runAction(RESOURCE+".show_to_update", resource_id);
      }
    },

    "SecurityGroup.show_to_update" : {
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

    "SecurityGroup.update" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(request, response){
        Sunstone.hideFormPanel(TAB_ID);
        Notifier.notifyMessage(Locale.tr("Security Group updated correctly"));
      },
      error: function(request, response) {
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      }
    },

    "SecurityGroup.update_template" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(request,response){
         Sunstone.runAction('SecurityGroup.show',request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "SecurityGroup.chown" : {
      type: "multiple",
      call: OpenNebulaResource.chown,
      callback:  function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "SecurityGroup.chgrp" : {
      type: "multiple",
      call: OpenNebulaResource.chgrp,
      callback:  function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "SecurityGroup.chmod" : {
      type: "single",
      call: OpenNebulaResource.chmod,
      callback:  function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    /*
    TODO
    "SecurityGroup.clone_dialog" : {
        type: "custom",
        call: popUpSecurityGroupCloneDialog
    },
    */

    "SecurityGroup.clone" : {
      type: "single",
      call: OpenNebulaResource.clone,
      error: Notifier.onError,
      notify: true
    },

    "SecurityGroup.rename" : {
      type: "single",
      call: OpenNebulaResource.rename,
      callback: function(request) {
          Sunstone.runAction('SecurityGroup.show',request.request.data[0][0]);
      },
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
})
