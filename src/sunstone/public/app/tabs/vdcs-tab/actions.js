define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/vdc');

  var RESOURCE = "Vdc";
  var TAB_ID = require('./tabId');
  // TODO
  //var CREATE_DIALOG_ID = require('./dialogs/create/dialogId');

  var _actions = {

    /* TODO
    "Vdc.create" : {
      type: "create",
      call: OpenNebulaResource.create,
      callback: function(request, response) {
        $("a[href=back]", $("#vdcs-tab")).trigger("click");
        popFormDialog("create_vdc_form", $("#vdcs-tab"));

        var group_ids = request.request.data[0].group_ids;
        $.each(group_ids,function(){
          Sunstone.runAction(RESOURCE+".add_group",
            response.VDC.ID,
            { group_id : parseInt(this)});
        });

        var clusters = request.request.data[0].clusters;
        $.each(clusters,function(){
          Sunstone.runAction(RESOURCE+".add_cluster",
            response.VDC.ID,
            this);
        });

        var hosts = request.request.data[0].hosts;
        $.each(hosts,function(){
          Sunstone.runAction(RESOURCE+".add_host",
            response.VDC.ID,
            this);
        });

        var vnets = request.request.data[0].vnets;
        $.each(vnets,function(){
          Sunstone.runAction(RESOURCE+".add_vnet",
            response.VDC.ID,
            this);
        });

        var datastores = request.request.data[0].datastores;
        $.each(datastores,function(){
          Sunstone.runAction(RESOURCE+".add_datastore",
            response.VDC.ID,
            this);
        });

        // TODO: this vdc.show may get the information before the add/del
        // actions end, showing "outdated" information

        Sunstone.runAction(RESOURCE+'.show',request.request.data[0][0]);

        addVdcElement(request, response);
        notifyCustom(tr("VDC created"), " ID: " + response.VDC.ID, false);
      },
      error: Notifier.onError
    },

    "Vdc.create_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.popUpFormPanel("create_vdc_form", "vdcs-tab", "create", true, function(context){
          refreshGroupTableSelect(context, "vdc_wizard_groups");

          var zone_ids = [];

          OpenNebula.Zone.list({
            timeout: true,
            success: function (request, obj_list){
              $.each(obj_list,function(){
                zone_ids.push(this.ZONE.ID);

                addVdcResourceTab(
                  "vdc_create_wizard",
                  this.ZONE.ID,
                  this.ZONE.NAME,
                  $("#vdcCreateResourcesTab",context));
              });

              setupVdcResourceTab("vdc_create_wizard",
                $("#vdcCreateResourcesTab",context));

              context.data("zone_ids", zone_ids);
            },
            error: Notifier.onError
          });

          $("input#name",context).focus();
        });
      }
    },
    */
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
    /* TODO
    "Vdc.update_dialog" : {
      type: "custom",
      call: function(){
        var selected_nodes = getSelectedNodes(dataTable_vdcs);
        if ( selected_nodes.length != 1 ) {
          notifyMessage("Please select one (and just one) VDC to update.");
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
            // TODO: global var, better use jquery .data
            vdc_to_update_id = response.VDC.ID;

            Sunstone.popUpFormPanel("create_vdc_form", "vdcs-tab", "update", true, function(context){
                fillVdcUpdateFormPanel(response.VDC, context);
            });
        },
        error: Notifier.onError
    },

    "Vdc.update" : {
        type: "single",
        call: OpenNebulaResource.update,
        callback: function(request, response){
            $("a[href=back]", $("#vdcs-tab")).trigger("click");
            popFormDialog("create_vdc_form", $("#vdcs-tab"));

            notifyMessage(tr("VDC updated correctly"));
        },
        error: function(request, response){
            popFormDialog("create_vdc_form", $("#vdcs-tab"));

            onError(request, response);
        }
    },
    */

    "Vdc.update_template" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(request) {
        Sunstone.runAction(RESOURCE+'.show',request.request.data[0][0]);
      },
      error: Notifier.onError
    },
    /* TODO
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
    */
  };

  return _actions;
})
