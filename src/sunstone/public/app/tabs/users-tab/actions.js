define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/user');

  var RESOURCE = "User";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var PASSWORD_DIALOG_ID = require('./dialogs/password/dialogId');
  var AUTH_DRIVER_DIALOG_ID = require('./dialogs/auth-driver/dialogId');

  var _actions = {
    "User.create" : {
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

    "User.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },

    "User.list" : {
      type: "list",
      call: OpenNebulaResource.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: Notifier.onError
    },

    "User.refresh" : {
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

    "User.update_password" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(PASSWORD_DIALOG_ID).show();
      }
    },

    "User.passwd" : {
      type: "multiple",
      call: OpenNebulaResource.passwd,
      error: Notifier.onError
    },

    "User.chgrp" : {
      type: "multiple",
      call: OpenNebulaResource.chgrp,
      callback : function(req){
        Sunstone.runAction(RESOURCE+".show",req.request.data[0][0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
    },
    /* TODO
    "User.addgroup" : {
      type: "multiple",
      call: OpenNebulaResource.addgroup,
      callback : function(req){
        Sunstone.runAction(RESOURCE+".show",req.request.data[0][0]);
      },
      elements : userElements,
      error: onError
    },
    "User.delgroup" : {
      type: "multiple",
      call: OpenNebulaResource.delgroup,
      callback : function(req){
        Sunstone.runAction(RESOURCE+".show",req.request.data[0][0]);
      },
      elements : userElements,
      error: onError
    },
    */
    "User.change_authentication" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(AUTH_DRIVER_DIALOG_ID).show();
      }
    },

    "User.chauth" : {
      type: "multiple",
      call: OpenNebulaResource.chauth,
      error: Notifier.onError,
    },

    "User.show" : {
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

    "User.delete" : {
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

    "User.update_template" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(request) {
        Sunstone.runAction(RESOURCE+'.show',request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    /* TODO

    "User.fetch_quotas" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function (request,response) {
        populateQuotasDialog(
          response.USER,
          default_user_quotas,
          "#user_quotas_dialog",
          $user_quotas_dialog);
      },
      error: onError
    },

    "User.quotas_dialog" : {
      type: "custom",
      call: popUpUserQuotasDialog
    },
  */
 
    "User.set_quota" : {
      type: "multiple",
      call: OpenNebulaResource.set_quota,
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      callback: function(request) {
        Sunstone.runAction(RESOURCE+'.show',request.request.data[0]);
      },
      error: Notifier.onError
    },
    /* TODO
    "User.accounting" : {
      type: "monitor",
      call: OpenNebulaResource.accounting,
      callback: function(req,response) {
        var info = req.request.data[0].monitor;
        plot_graph(response,'#user_acct_tab','user_acct_', info);
      },
      error: onError
    }
    */
  };

  return _actions;
})
