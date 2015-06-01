define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaNetwork = require('opennebula/network');
  var OpenNebulaCluster = require('opennebula/cluster');
  var OpenNebulaAction = require('opennebula/action');

  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var ADD_AR_DIALOG_ID = require('./dialogs/add-ar/dialogId');
  var UPDATE_AR_DIALOG_ID = require('./dialogs/update-ar/dialogId');
  var RESERVE_DIALOG_ID = require('./dialogs/reserve/dialogId');

  var _actions = {
    "Network.create" : {
      type: "create",
      call: OpenNebulaNetwork.create,
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

    "Network.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },

    // TODO
    /*
    "Network.import_dialog" : {
      type: "create",
      call: function(){
        popUpNetworkImportDialog();
      }
    },
    */

    "Network.list" : {
      type: "list",
      call: OpenNebulaNetwork.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: Notifier.onError
    },

    "Network.show" : {
      type: "single",
      call: OpenNebulaNetwork.show,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateElement(request, response);
        if (Sunstone.rightInfoVisible($('#' + TAB_ID))) {
          Sunstone.insertPanels(TAB_ID, response);
        }
      },
      error: Notifier.onError
    },

    "Network.refresh" : {
      type: "custom",
      call: function() {
        var tab = $('#' + TAB_ID);
        if (Sunstone.rightInfoVisible(tab)) {
          Sunstone.runAction("Network.show", Sunstone.rightInfoResourceId(tab));
        } else {
          Sunstone.getDataTable(TAB_ID).waitingNodes();
          Sunstone.runAction("Network.list", {force: true});
        }
      },
      error: Notifier.onError
    },

    // TODO: update
    /*
    "Network.publish" : {
      type: "multiple",
      call: OpenNebulaNetwork.publish,
      callback: function(req) {
        Sunstone.runAction("Network.show",req.request.data[0][0]);
      },
      elements: vnElements,
      error: Notifier.onError
    },

    "Network.unpublish" : {
      type: "multiple",
      call: OpenNebulaNetwork.unpublish,
      callback: function(req) {
        Sunstone.runAction("Network.show",req.request.data[0][0]);
      },
      elements: vnElements,
      error: Notifier.onError
    },
    */

    "Network.delete" : {
      type: "multiple",
      call : OpenNebulaNetwork.del,
      callback : function(request, response) {
        Sunstone.getDataTable(TAB_ID).deleteElement(request, response);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error : Notifier.onError,
      notify:true
    },

    "Network.hold" : {
      type: "single",
      call: OpenNebulaNetwork.hold,
      callback: function(req) {
        Sunstone.runAction("Network.show", req.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Network.release" : {
      type: "single",
      call: OpenNebulaNetwork.release,
      callback: function(req) {
        Sunstone.runAction("Network.show", req.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Network.add_ar" : {
      type: "single",
      call: OpenNebulaNetwork.add_ar,
      callback: function(req) {
        // Reset the wizard
        Sunstone.getDialog(ADD_AR_DIALOG_ID).hide();
        Sunstone.getDialog(ADD_AR_DIALOG_ID).reset();

        Sunstone.runAction("Network.show",req.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Network.rm_ar" : {
      type: "single",
      call: OpenNebulaNetwork.rm_ar,
      callback: function(req) {
        OpenNebulaAction.clear_cache("VNET");
        Sunstone.runAction("Network.show",req.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Network.update_ar" : {
      type: "single",
      call: OpenNebulaNetwork.update_ar,
      callback: function(req) {
        // Reset the wizard
        Sunstone.getDialog(UPDATE_AR_DIALOG_ID).hide();
        Sunstone.getDialog(UPDATE_AR_DIALOG_ID).reset();

        Sunstone.runAction("Network.show",req.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Network.reserve_dialog" : {
      type: "custom",
      call: function() {
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        if (selected_nodes.length != 1) {
          Notifier.notifyMessage("Please select one (and just one) Virtual Network.");
          return false;
        }

        var resource_id = "" + selected_nodes[0];

        Sunstone.getDialog(RESERVE_DIALOG_ID).setParams({vnetId: resource_id});
        Sunstone.getDialog(RESERVE_DIALOG_ID).reset();
        Sunstone.getDialog(RESERVE_DIALOG_ID).show();
      }
    },

    "Network.reserve" : {
      type: "single",
      call: OpenNebulaNetwork.reserve,
      callback: function(req) {
        // Reset the wizard
        Sunstone.getDialog(RESERVE_DIALOG_ID).hide();
        Sunstone.getDialog(RESERVE_DIALOG_ID).reset();

        OpenNebulaAction.clear_cache("VNET");
        Sunstone.runAction("Network.show",req.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Network.chown" : {
      type: "multiple",
      call: OpenNebulaNetwork.chown,
      callback:  function (req) {
        Sunstone.runAction("Network.show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "Network.chgrp" : {
      type: "multiple",
      call: OpenNebulaNetwork.chgrp,
      callback:  function (req) {
        Sunstone.runAction("Network.show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "Network.chmod" : {
      type: "single",
      call: OpenNebulaNetwork.chmod,
      callback:  function (req) {
        Sunstone.runAction("Network.show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "Network.rename" : {
      type: "single",
      call: OpenNebulaNetwork.rename,
      callback: function(request) {
        Sunstone.runAction('Network.show', request.request.data[0][0]);
      },
      error: Notifier.onError,
      notify: true
    },

    "Network.update_dialog" : {
      type: "custom",
      call: function() {
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        if (selected_nodes.length != 1) {
          Notifier.notifyMessage("Please select one (and just one) Virtual Network to update.");
          return false;
        }

        var resource_id = "" + selected_nodes[0];
        Sunstone.runAction("Network.show_to_update", resource_id);
      }
    },

    "Network.show_to_update" : {
      type: "single",
      call: OpenNebulaNetwork.show,
      callback: function(request, response) {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "update", 
          function(formPanelInstance, context) {
            formPanelInstance.fill(context, response.VNET)
          });
      },
      error: Notifier.onError
    },

    "Network.update" : {
      type: "single",
      call: OpenNebulaNetwork.update,
      callback: function(request, response) {
        Sunstone.hideFormPanel(TAB_ID);
        Notifier.notifyMessage(Locale.tr("Virtual Network updated correctly"));
      },
      error: function(request, response) {
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      }
    },
    
    "Network.update_template" : {
      type: "single",
      call: OpenNebulaNetwork.update,
      callback: function(request) {
        Sunstone.runAction('Network.show', request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Network.addtocluster" : {
      type: "multiple",
      call: function(params){
        var cluster = params.data.extra_param;
        var vnet = params.data.id;

        if (cluster == -1){
          OpenNebulaNetwork.show({
            data : {
              id: vnet
            },
            success: function (request, vn){
              var vn_info = vn.VNET;

              var current_cluster = vn_info.CLUSTER_ID;

              if(current_cluster != -1){
                OpenNebulaCluster.delvnet({
                  data: {
                    id: current_cluster,
                    extra_param: vnet
                  },
                  success: function(){
                    OpenNebulaAction.clear_cache("VNET");
                    Sunstone.runAction('Network.show',vnet);
                  },
                  error: Notifier.onError
                });
              } else {
                OpenNebulaAction.clear_cache("VNET");
                Sunstone.runAction('Network.show',vnet);
              }
            },
            error: Notifier.onError
          });
        } else {
          OpenNebulaCluster.addvnet({
            data: {
              id: cluster,
              extra_param: vnet
            },
            success: function(){
              OpenNebulaAction.clear_cache("VNET");
              Sunstone.runAction('Network.show',vnet);
            },
            error: Notifier.onError
          });
        }
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      }
    }
  };

  return _actions;
});
