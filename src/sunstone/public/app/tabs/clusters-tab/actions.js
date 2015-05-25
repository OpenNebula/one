define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/cluster');

  var RESOURCE = "Cluster";
  var TAB_ID = require('./tabId');
  // TODO
  //var CREATE_DIALOG_ID = require('./dialogs/create/dialogId');

  var _actions = {

    /* TODO
    "Cluster.create" : {
      type: "create",
      call: OpenNebula.Cluster.create,
      callback: function(request, response){
        // Reset the create wizard
        $create_cluster_dialog.foundation('reveal', 'close');
        $create_cluster_dialog.empty();
        setupCreateClusterDialog();

        addClusterElement(request, response);
        // Sunstone.runAction('Cluster.list');

        for (var host in request.request.data[0].cluster.hosts)
          if (request.request.data[0].cluster.hosts[host])
            Sunstone.runAction("Cluster.addhost",response.CLUSTER.ID,host);
        for (var vnet in request.request.data[0].cluster.vnets)
          if (request.request.data[0].cluster.vnets[vnet])
            Sunstone.runAction("Cluster.addvnet",response.CLUSTER.ID,vnet);
        for (var datastore in request.request.data[0].cluster.datastores)
          if (request.request.data[0].cluster.datastores[datastore])
            Sunstone.runAction("Cluster.adddatastore",response.CLUSTER.ID,datastore);

        //Sunstone.runAction('Cluster.list');
        // Sunstone.runAction('Cluster.show',response.CLUSTER.ID);
        notifyCustom(tr("Cluster created"), " ID: " + response.CLUSTER.ID, false);
      },
      error: Notifier.onError
    },

    "Cluster.create_dialog" : {
      type: "custom",
      call: popUpCreateClusterDialog
    },
    */

    "Cluster.list" : {
      type: "list",
      call: OpenNebulaResource.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: Notifier.onError
    },

    "Cluster.show" : {
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
    /* TODO
    "Cluster.show_to_update" : {
      type: "single",
      call: OpenNebula.Cluster.show,
      callback: fillPopPup,
      error: Notifier.onError
    },
    */
    "Cluster.refresh" : {
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
    /* TODO
    "Cluster.addhost" : {
      type: "single",
      call : OpenNebula.Cluster.addhost,
      callback : function (req) {
        OpenNebula.Helper.clear_cache("HOST");
        Sunstone.runAction('Cluster.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Cluster.delhost" : {
      type: "single",
      call : OpenNebula.Cluster.delhost,
      callback : function (req) {
        OpenNebula.Helper.clear_cache("HOST");
        Sunstone.runAction('Cluster.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Cluster.adddatastore" : {
      type: "single",
      call : OpenNebula.Cluster.adddatastore,
      callback : function (req) {
        OpenNebula.Helper.clear_cache("DATASTORE");
        Sunstone.runAction('Cluster.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Cluster.deldatastore" : {
      type: "single",
      call : OpenNebula.Cluster.deldatastore,
      callback : function (req) {
        OpenNebula.Helper.clear_cache("DATASTORE");
        Sunstone.runAction('Cluster.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Cluster.addvnet" : {
      type: "single",
      call : OpenNebula.Cluster.addvnet,
      callback : function (req) {
        OpenNebula.Helper.clear_cache("VNET");
        Sunstone.runAction('Cluster.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Cluster.delvnet" : {
      type: "single",
      call : OpenNebula.Cluster.delvnet,
      callback : function (req) {
        OpenNebula.Helper.clear_cache("VNET");
        Sunstone.runAction('Cluster.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },
    */
    "Cluster.delete" : {
      type: "multiple",
      call: OpenNebulaResource.del,
      callback : function(request, response) {
        Sunstone.getDataTable(TAB_ID).deleteElement(request, response);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError
    },
    /* TODO
    "Cluster.update_template" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(request) {
        Sunstone.runAction(RESOURCE+'.show',request.request.data[0][0]);
      },
      error: Notifier.onError
    },
    /* TODO
    "Cluster.fetch_template" : {
      type: "single",
      call: OpenNebula.Cluster.fetch_template,
      callback: function(request,response){
        $('#template_update_dialog #template_update_textarea').val(response.template);
      },
      error: Notifier.onError
    },

    "Cluster.update_dialog" : {
      type: "single",
      call: popUpUpdateClusterDialog
    },
    */
    "Cluster.rename" : {
      type: "single",
      call: OpenNebulaResource.rename,
      callback: function(request) {
        Sunstone.runAction(RESOURCE+'.show',request.request.data[0][0]);
      },
      error: Notifier.onError
    }
  };

  return _actions;
});
