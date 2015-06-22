define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var OpenNebulaDatastore = require('opennebula/datastore');
  var OpenNebulaCluster = require('opennebula/cluster');
  var OpenNebulaAction = require('opennebula/action');

  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _actions = {
    "Datastore.create" : {
      type: "create",
      call : OpenNebulaDatastore.create,
      callback : function(request, response) {
        Sunstone.resetFormPanel(TAB_ID, CREATE_DIALOG_ID);
        Sunstone.hideFormPanel(TAB_ID);
        Sunstone.getDataTable(TAB_ID).addElement(request, response);
        Notifier.notifyCustom(Locale.tr("Datastore created"), " ID: " + response.DATASTORE.ID, false);
      },
      error: function(request, response) {
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      },
    },

    "Datastore.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },

    "Datastore.list" : {
      type: "list",
      call: OpenNebulaDatastore.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: Notifier.onError
    },

    "Datastore.show" : {
      type: "single",
      call: OpenNebulaDatastore.show,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateElement(request, response);
        if (Sunstone.rightInfoVisible($('#' + TAB_ID))) {
          Sunstone.insertPanels(TAB_ID, response);
        }
      },
      error: Notifier.onError
    },

    "Datastore.refresh" : {
      type: "custom",
      call: function() {
          var tab = $('#' + TAB_ID);
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("Datastore.show", Sunstone.rightInfoResourceId(tab))
          } else {
            Sunstone.getDataTable(TAB_ID).waitingNodes();
            Sunstone.runAction("Datastore.list", {force: true});
          }
        },
      error: Notifier.onError
    },

    "Datastore.fetch_permissions" : {
      type: "single",
      call: OpenNebulaDatastore.show,
      callback: function(request, element_json) {
        //var ds = element_json.DATASTORE;
        //setPermissionsTable(ds, $(".datastore_permissions_table"));
      },
      error: Notifier.onError
    },

    "Datastore.update_template" : {
      type: "single",
      call: OpenNebulaDatastore.update,
      callback: function(request) {
        Sunstone.runAction('Datastore.show', request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Datastore.update" : {
      type: "single",
      call: OpenNebulaDatastore.update,
      callback: function() {
        Sunstone.runAction('Datastore.show', request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Datastore.delete" : {
      type: "multiple",
      call : OpenNebulaDatastore.del,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).deleteElement(request, response);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error : Notifier.onError,
      notify: true
    },

    "Datastore.chown" : {
      type: "multiple",
      call: OpenNebulaDatastore.chown,
      callback:  function (req) {
        Sunstone.runAction("Datastore.show", req.request.data[0][0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError
    },

    "Datastore.chgrp" : {
      type: "multiple",
      call: OpenNebulaDatastore.chgrp,
      callback: function (req) {
        Sunstone.runAction("Datastore.show", req.request.data[0][0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError
    },

    "Datastore.chmod" : {
      type: "single",
      call: OpenNebulaDatastore.chmod,
      callback: function (req) {
        Sunstone.runAction("Datastore.show", req.request.data[0]);
      },
      error: Notifier.onError
    },

    "Datastore.addtocluster" : {
      type: "multiple",
      call: function(params, success) {
        var cluster = params.data.extra_param;
        var ds = params.data.id;

        if (cluster == -1) {
          OpenNebulaDatastore.show({
            data : {
              id: ds
            },
            success: function (request, ds_info) {
              var current_cluster = ds_info.DATASTORE.CLUSTER_ID;

              if (current_cluster != -1) {
                OpenNebulaCluster.deldatastore({
                  data: {
                    id: current_cluster,
                    extra_param: ds
                  },
                  success: function() {
                    OpenNebulaAction.clear_cache("DATASTORE");
                    Sunstone.runAction('Datastore.show', ds);
                  },
                  error: Notifier.onError
                });
              } else {
                OpenNebulaAction.clear_cache("DATASTORE");
                Sunstone.runAction('Datastore.show', ds);
              }
            },
            error: Notifier.onError
          });
        } else {
          OpenNebulaCluster.adddatastore({
            data: {
              id: cluster,
              extra_param: ds
            },
            success: function() {
              OpenNebulaAction.clear_cache("DATASTORE");
              Sunstone.runAction('Datastore.show', ds);
            },
            error: Notifier.onError
          });
        }
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      }
    },

    "Datastore.rename" : {
      type: "single",
      call: OpenNebulaDatastore.rename,
      callback: function(request) {
        Sunstone.runAction('Datastore.show', request.request.data[0][0]);
      },
      error: Notifier.onError,
      notify: true
    },

    "Datastore.enable" : {
      type: "multiple",
      call: OpenNebulaDatastore.enable,
      callback: function (req) {
        Sunstone.runAction("Datastore.show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "Datastore.disable" : {
      type: "multiple",
      call: OpenNebulaDatastore.disable,
      callback: function (req) {
        Sunstone.runAction("Datastore.show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
});
