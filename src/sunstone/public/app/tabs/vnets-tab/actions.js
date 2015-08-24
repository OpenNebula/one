define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/network');
  var OpenNebulaCluster = require('opennebula/cluster');
  var OpenNebulaAction = require('opennebula/action');
  var CommonActions = require('utils/common-actions');

  var RESOURCE = "Network";
  var XML_ROOT = "VNET";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var ADD_AR_DIALOG_ID = require('./dialogs/add-ar/dialogId');
  var UPDATE_AR_DIALOG_ID = require('./dialogs/update-ar/dialogId');
  var RESERVE_DIALOG_ID = require('./dialogs/reserve/dialogId');
  var IMPORT_DIALOG_ID = require('./form-panels/import/formPanelId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID, XML_ROOT);

  var _actions = {
    "Network.create" : _commonActions.create(CREATE_DIALOG_ID),
    "Network.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "Network.import_dialog" :  _commonActions.showCreate(IMPORT_DIALOG_ID),
    "Network.list" : _commonActions.list(),
    "Network.show" : _commonActions.show(),
    "Network.refresh" : _commonActions.refresh(),
    "Network.delete" : _commonActions.del(),
    "Network.hold": _commonActions.singleAction('hold'),
    "Network.release": _commonActions.singleAction('release'),
    "Network.chown": _commonActions.multipleAction('chown'),
    "Network.chgrp": _commonActions.multipleAction('chgrp'),
    "Network.chmod": _commonActions.singleAction('chmod'),
    "Network.rename": _commonActions.singleAction('rename'),
    "Network.update" : _commonActions.updateTemplate(),
    "Network.update_template" : _commonActions.updateTemplate(),
    "Network.update_dialog" : _commonActions.checkAndShowUpdate(),
    "Network.show_to_update" : _commonActions.showUpdate(CREATE_DIALOG_ID),

    "Network.add_ar" : {
      type: "single",
      call: OpenNebulaResource.add_ar,
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
      call: OpenNebulaResource.rm_ar,
      callback: function(req) {
        OpenNebulaAction.clear_cache("VNET");
        Sunstone.runAction("Network.show",req.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Network.update_ar" : {
      type: "single",
      call: OpenNebulaResource.update_ar,
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
      call: OpenNebulaResource.reserve,
      callback: function(req) {
        // Reset the wizard
        Sunstone.getDialog(RESERVE_DIALOG_ID).hide();
        Sunstone.getDialog(RESERVE_DIALOG_ID).reset();

        OpenNebulaAction.clear_cache("VNET");
        Sunstone.runAction("Network.show",req.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Network.addtocluster" : {
      type: "multiple",
      call: function(params){
        var cluster = params.data.extra_param;
        var vnet = params.data.id;

        if (cluster == -1){
          OpenNebulaResource.show({
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
