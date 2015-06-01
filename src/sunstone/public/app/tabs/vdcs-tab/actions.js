define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/vdc');

  var RESOURCE = "Vdc";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _actions = {

    "Vdc.create" : {
      type: "create",
      call: OpenNebulaResource.create,
      callback: function(request, response) {
        Sunstone.resetFormPanel(TAB_ID, CREATE_DIALOG_ID);
        Sunstone.hideFormPanel(TAB_ID);

        var group_ids = request.request.data[0].group_ids;
        if(group_ids !=undefined){
          $.each(group_ids,function(){
            Sunstone.runAction(RESOURCE+".add_group",
              response.VDC.ID,
              { group_id : parseInt(this)});
          });
        }

        var clusters = request.request.data[0].clusters;
        if(clusters !=undefined){
          $.each(clusters,function(){
            Sunstone.runAction(RESOURCE+".add_cluster",
              response.VDC.ID,
              this);
          });
        }

        var hosts = request.request.data[0].hosts;
        if(hosts !=undefined){
          $.each(hosts,function(){
            Sunstone.runAction(RESOURCE+".add_host",
              response.VDC.ID,
              this);
          });
        }

        var vnets = request.request.data[0].vnets;
        if(vnets !=undefined){
          $.each(vnets,function(){
            Sunstone.runAction(RESOURCE+".add_vnet",
              response.VDC.ID,
              this);
          });
        }

        var datastores = request.request.data[0].datastores;
        if(datastores !=undefined){
          $.each(datastores,function(){
            Sunstone.runAction(RESOURCE+".add_datastore",
              response.VDC.ID,
              this);
          });
        }

        // TODO: this vdc.show may get the information before the add/del
        // actions end, showing "outdated" information

        Sunstone.runAction(RESOURCE+'.show',request.request.data[0][0]);

        Sunstone.getDataTable(TAB_ID).addElement(request, response);
        Notifier.notifyCustom(Locale.tr("VDC created"), " ID: " + response.VDC.ID, false);
      },
      error: Notifier.onError
    },

    "Vdc.create_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },

    "Vdc.list" : {
      type: "list",
      call: OpenNebulaResource.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: Notifier.onError
    },

    "Vdc.show" : {
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

    "Vdc.refresh" : {
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

    "Vdc.delete" : {
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

    "Vdc.rename" : {
      type: "single",
      call: OpenNebulaResource.rename,
      callback: function(request) {
        Sunstone.runAction(RESOURCE+'.show',request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Vdc.update_dialog" : {
      type: "custom",
      call: function(){
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        if ( selected_nodes.length != 1 ) {
          Notifier.notifyMessage("Please select one (and just one) VDC to update.");
          return false;
        }

        var resource_id = ""+selected_nodes[0];
        Sunstone.runAction(RESOURCE+".show_to_update", resource_id);
      }
    },

    "Vdc.show_to_update" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function(request, response) {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "update",
          function(formPanelInstance, context) {
            formPanelInstance.fill(context, response.VDC);
          });
      },
      error: Notifier.onError
    },

    "Vdc.update" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(request, response){
        Sunstone.hideFormPanel(TAB_ID);
        Notifier.notifyMessage(Locale.tr("VDC updated correctly"));
      },
      error: function(request, response){
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      }
    },

    "Vdc.update_template" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(request) {
        Sunstone.runAction(RESOURCE+'.show',request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Vdc.add_group" : {
      type: "single",
      call : OpenNebulaResource.add_group,
      callback : function (req) {
        //Sunstone.runAction(RESOURCE+'.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Vdc.del_group" : {
      type: "single",
      call : OpenNebulaResource.del_group,
      callback : function (req) {
        //Sunstone.runAction(RESOURCE+'.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Vdc.add_cluster" : {
      type: "single",
      call : OpenNebulaResource.add_cluster,
      callback : function (req) {
        //Sunstone.runAction(RESOURCE+'.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Vdc.del_cluster" : {
      type: "single",
      call : OpenNebulaResource.del_cluster,
      callback : function (req) {
        //Sunstone.runAction(RESOURCE+'.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Vdc.add_host" : {
      type: "single",
      call : OpenNebulaResource.add_host,
      callback : function (req) {
        //Sunstone.runAction(RESOURCE+'.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Vdc.del_host" : {
      type: "single",
      call : OpenNebulaResource.del_host,
      callback : function (req) {
        //Sunstone.runAction(RESOURCE+'.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Vdc.add_vnet" : {
      type: "single",
      call : OpenNebulaResource.add_vnet,
      callback : function (req) {
        //Sunstone.runAction(RESOURCE+'.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Vdc.del_vnet" : {
      type: "single",
      call : OpenNebulaResource.del_vnet,
      callback : function (req) {
        //Sunstone.runAction(RESOURCE+'.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Vdc.add_datastore" : {
      type: "single",
      call : OpenNebulaResource.add_datastore,
      callback : function (req) {
        //Sunstone.runAction(RESOURCE+'.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    },

    "Vdc.del_datastore" : {
      type: "single",
      call : OpenNebulaResource.del_datastore,
      callback : function (req) {
        //Sunstone.runAction(RESOURCE+'.show',req.request.data[0][0]);
      },
      error : Notifier.onError
    }
  };

  return _actions;
})
