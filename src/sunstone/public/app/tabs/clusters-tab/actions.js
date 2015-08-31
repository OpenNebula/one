define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/cluster');
  var OpenNebulaAction = require('opennebula/action');
  var CommonActions = require('utils/common-actions');

  var RESOURCE = "Cluster";
  var XML_ROOT = "CLUSTER";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID, XML_ROOT);

  var _actions = {
    "Cluster.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "Cluster.list" : _commonActions.list(),
    "Cluster.show" : _commonActions.show(),
    "Cluster.refresh" : _commonActions.refresh(),
    "Cluster.delete" : _commonActions.del(),
    "Cluster.update_template" : _commonActions.updateTemplate(),
    "Cluster.update_dialog" : _commonActions.checkAndShowUpdate(),
    "Cluster.show_to_update" : _commonActions.showUpdate(CREATE_DIALOG_ID),
    "Cluster.rename": _commonActions.singleAction('rename'),

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
    }
  };

  return _actions;
});
