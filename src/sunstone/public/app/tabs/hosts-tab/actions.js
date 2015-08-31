define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/host');
  var OpenNebulaCluster = require('opennebula/cluster');
  var OpenNebulaAction = require('opennebula/action');
  var CommonActions = require('utils/common-actions');

  var TAB_ID = require('./tabId');
  var XML_ROOT = "HOST"
  var RESOURCE = "Host"
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID, XML_ROOT);

  var _actions = {
    "Host.create" : _commonActions.create(CREATE_DIALOG_ID),
    "Host.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "Host.list" : _commonActions.list(),
    "Host.show" : _commonActions.show(),
    "Host.refresh" : _commonActions.refresh(),
    "Host.delete" : _commonActions.del(),
    "Host.update_template" : _commonActions.updateTemplate(),
    "Host.enable": _commonActions.multipleAction('enable'),
    "Host.disable": _commonActions.multipleAction('disable'),
    "Host.rename": _commonActions.singleAction('rename'),

    "Host.addtocluster" : {
      type: "multiple",
      call: function(params){
        var cluster = params.data.extra_param;
        var host = params.data.id;

        if (cluster == -1){
          OpenNebulaResource.show({
            data : {
              id: host
            },
            success: function (request, info){
              var element = info.HOST;

              var current_cluster = element.CLUSTER_ID;

              if(current_cluster != -1){
                OpenNebulaCluster.delhost({
                  data: {
                    id: current_cluster,
                    extra_param: host
                  },
                  success: function(){
                    OpenNebulaAction.clear_cache("HOST");
                    Sunstone.runAction('Host.show',host);
                  },
                  error: Notifier.onError
                });
              } else {
                OpenNebulaAction.clear_cache("HOST");
                Sunstone.runAction('Host.show',host);
              }
            },
            error: Notifier.onError
          });
        } else {
          OpenNebulaCluster.addhost({
            data: {
              id: cluster,
              extra_param: host
            },
            success: function(){
              OpenNebulaAction.clear_cache("HOST");
              Sunstone.runAction('Host.show',host);
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
})
