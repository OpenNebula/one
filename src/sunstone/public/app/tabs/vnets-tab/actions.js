define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaNetwork = require('opennebula/network');

  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./dialogs/create/dialogId');

  var _actions = {
    "Network.create" : {
      type: "create",
      call: OpenNebulaNetwork.create,
      callback: function(request, response) {
        Sunstone.getDialog(CREATE_DIALOG_ID).hide();
        Sunstone.getDialog(CREATE_DIALOG_ID).reset();
        DataTable.addElement(request, response);
      },
      error: Notifier.onError,
      notify: true
    },

    "Network.create_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(CREATE_DIALOG_ID).show();
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
        if (Sunstone.rightInfoVisible($('#'+TAB_ID))) {
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
        Sunstone.runAction("Network.show",req.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Network.release" : {
      type: "single",
      call: OpenNebulaNetwork.release,
      callback: function(req) {
        Sunstone.runAction("Network.show",req.request.data[0][0]);
      },
      error: Notifier.onError
    },
    // TODO: update
    /*
    "Network.add_ar" : {
      type: "single",
      call: OpenNebulaNetwork.add_ar,
      callback: function(req) {
        // Reset the wizard
        $add_ar_dialog.foundation('reveal', 'close');
        $add_ar_dialog.empty();
        setupAddARDialog();

        Sunstone.runAction("Network.show",req.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Network.rm_ar" : {
      type: "single",
      call: OpenNebulaNetwork.rm_ar,
      callback: function(req) {
        OpenNebula.Helper.clear_cache("VNET");
        Sunstone.runAction("Network.show",req.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Network.update_ar" : {
      type: "single",
      call: OpenNebulaNetwork.update_ar,
      callback: function(req) {
        // Reset the wizard
        $update_ar_dialog.foundation('reveal', 'close');
        $update_ar_dialog.empty();
        setupUpdateARDialog();

        Sunstone.runAction("Network.show",req.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Network.reserve_dialog" : {
      type: "custom",
      call: popUpReserveDialog
    },

    "Network.reserve" : {
      type: "single",
      call: OpenNebulaNetwork.reserve,
      callback: function(req) {
        // Reset the wizard
        $reserve_dialog.foundation('reveal', 'close');
        $reserve_dialog.empty();
        setupReserveDialog();

        OpenNebula.Helper.clear_cache("VNET");
        Sunstone.runAction("Network.show",req.request.data[0][0]);
      },
      error: Notifier.onError
    },
    */

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

    // TODO: update
    /*
    "Network.update_dialog" : {
      type: "custom",
      call: function(){
        var selected_nodes = getSelectedNodes(dataTable_vNetworks);
        if ( selected_nodes.length != 1 ) {
          notifyMessage("Please select one (and just one) Virtual Network to update.");
          return false;
        }

        var resource_id = ""+selected_nodes[0];
        Sunstone.runAction("Network.show_to_update", resource_id);
      }
    },

    "Network.show_to_update" : {
      type: "single",
      call: OpenNebulaNetwork.show,
      callback: function(request, response) {
        // TODO: global var, better use jquery .data
        vnet_to_update_id = response.VNET.ID;

        Sunstone.popUpFormPanel("create_vnet_form", "vnets-tab", "update", true, function(context){
          fillVNetUpdateFormPanel(response.VNET, context);

          $("#default_sg_warning").hide();
        });
      },
      error: Notifier.onError
    },
    */

    // TODO: update
    /*
    "Network.update" : {
      type: "single",
      call: OpenNebulaNetwork.update,
      callback: function(request, response){
        $("a[href=back]", $("#vnets-tab")).trigger("click");
        popFormDialog("create_vnet_form", $("#vnets-tab"));

        notifyMessage(tr("Virtual Network updated correctly"));
      },
      error: function(request, response){
        popFormDialog("create_vnet_form", $("#vnets-tab"));

        onError(request, response);
      }
    },
    */

    "Network.update_template" : {
      type: "single",
      call: OpenNebulaNetwork.update,
      callback: function(request) {
        Sunstone.runAction('Network.show',request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    // TODO: update
    /*
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
                OpenNebula.Cluster.delvnet({
                  data: {
                    id: current_cluster,
                    extra_param: vnet
                  },
                  success: function(){
                    OpenNebula.Helper.clear_cache("VNET");
                    Sunstone.runAction('Network.show',vnet);
                  },
                  error: Notifier.onError
                });
              } else {
                OpenNebula.Helper.clear_cache("VNET");
                Sunstone.runAction('Network.show',vnet);
              }
            },
            error: Notifier.onError
          });
        } else {
          OpenNebula.Cluster.addvnet({
            data: {
              id: cluster,
              extra_param: vnet
            },
            success: function(){
              OpenNebula.Helper.clear_cache("VNET");
              Sunstone.runAction('Network.show',vnet);
            },
            error: Notifier.onError
          });
        }
      },
      elements: vnElements
    }
    */
  };

  return _actions;
})
