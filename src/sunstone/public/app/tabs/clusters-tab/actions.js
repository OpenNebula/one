define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/cluster');
  var OpenNebulaAction = require('opennebula/action');

  var RESOURCE = "Cluster";
  var XML_ROOT = "CLUSTER";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _actions = {

    "Cluster.create" : {
      type: "create",
      call: OpenNebulaResource.create,
      callback: function(request, response){
        Sunstone.resetFormPanel(TAB_ID, CREATE_DIALOG_ID);
        Sunstone.hideFormPanel(TAB_ID);
        Sunstone.getDataTable(TAB_ID).addElement(request, response);

        for (var host in request.request.data[0].cluster.hosts)
          if (request.request.data[0].cluster.hosts[host])
            Sunstone.runAction("Cluster.addhost",response[XML_ROOT].ID,host);
        for (var vnet in request.request.data[0].cluster.vnets)
          if (request.request.data[0].cluster.vnets[vnet])
            Sunstone.runAction("Cluster.addvnet",response[XML_ROOT].ID,vnet);
        for (var datastore in request.request.data[0].cluster.datastores)
          if (request.request.data[0].cluster.datastores[datastore])
            Sunstone.runAction("Cluster.adddatastore",response[XML_ROOT].ID,datastore);

        Notifier.notifyCustom(Locale.tr("Cluster created"), " ID: " + response[XML_ROOT].ID, false);
      },
      error: Notifier.onError
    },

    "Cluster.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },

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

    "Cluster.show_to_update" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function(request, response) {
        Sunstone.resetFormPanel(TAB_ID, CREATE_DIALOG_ID);
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "update",
          function(formPanelInstance, context) {
            formPanelInstance.fill(context, response[XML_ROOT]);
          });
      },
      error: Notifier.onError
    },

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

    "Cluster.addhost" : {
      type: "single",
      call : OpenNebulaResource.addhost,
      callback : function (req) {
        OpenNebulaAction.clear_cache("HOST");
        Sunstone.runAction('Cluster.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Cluster.delhost" : {
      type: "single",
      call : OpenNebulaResource.delhost,
      callback : function (req) {
        OpenNebulaAction.clear_cache("HOST");
        Sunstone.runAction('Cluster.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Cluster.adddatastore" : {
      type: "single",
      call : OpenNebulaResource.adddatastore,
      callback : function (req) {
        OpenNebulaAction.clear_cache("DATASTORE");
        Sunstone.runAction('Cluster.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Cluster.deldatastore" : {
      type: "single",
      call : OpenNebulaResource.deldatastore,
      callback : function (req) {
        OpenNebulaAction.clear_cache("DATASTORE");
        Sunstone.runAction('Cluster.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Cluster.addvnet" : {
      type: "single",
      call : OpenNebulaResource.addvnet,
      callback : function (req) {
        OpenNebulaAction.clear_cache("VNET");
        Sunstone.runAction('Cluster.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Cluster.delvnet" : {
      type: "single",
      call : OpenNebulaResource.delvnet,
      callback : function (req) {
        OpenNebulaAction.clear_cache("VNET");
        Sunstone.runAction('Cluster.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

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

    "Cluster.update_template" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(request) {
        Sunstone.runAction(RESOURCE+'.show',request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Cluster.update_dialog" : {
      type: "single",
      call: function() {
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        if (selected_nodes.length != 1) {
          Notifier.notifyMessage("Please select one (and just one) cluster to update.");
          return false;
        }

        var resource_id = "" + selected_nodes[0];
        Sunstone.runAction(RESOURCE+'.show_to_update', resource_id);
      }
    },

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
