define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaHost = require('opennebula/host');

  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _actions = {
    "Host.create" : {
      type: "create",
      call : OpenNebulaHost.create,
      callback : function(request, response) {
        $("a[href=back]", $("#"+TAB_ID)).trigger("click");
        Sunstone.hideFormPanelLoading($("#"+TAB_ID));
        Sunstone.resetFormPanel(TAB_ID, CREATE_DIALOG_ID);
        Sunstone.getDataTable(TAB_ID).addElement(request, response);
      },
      error: function(request, response) {
        Sunstone.hideFormPanelLoading($("#" + TAB_ID));
        Notifier.onError(request, response);
      },
      notify: true
    },

    "Host.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },

    "Host.list" : {
      type: "list",
      call: OpenNebulaHost.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: Notifier.onError
    },

    "Host.show" : {
      type: "single",
      call: OpenNebulaHost.show,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateElement(request, response);
        if (Sunstone.rightInfoVisible($('#' + TAB_ID))) {
          Sunstone.insertPanels(TAB_ID, response);
        }
      },
      error: Notifier.onError
    },

    "Host.refresh" : {
      type: "custom",
      call: function() {
        var tab = $('#' + TAB_ID);
        if (Sunstone.rightInfoVisible(tab)) {
          Sunstone.runAction("Host.show", Sunstone.rightInfoResourceId(tab))
        } else {
          Sunstone.getDataTable(TAB_ID).waitingNodes();
          Sunstone.runAction("Host.list", {force: true});
        }
      },
      error: Notifier.onError
    },

    "Host.enable" : {
      type: "multiple",
      call: OpenNebulaHost.enable,
      callback: function (req) {
        Sunstone.runAction("Host.show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "Host.disable" : {
      type: "multiple",
      call: OpenNebulaHost.disable,
      callback: function (req) {
        Sunstone.runAction("Host.show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "Host.delete" : {
      type: "multiple",
      call: OpenNebulaHost.del,
      callback : function(request, response) {
        Sunstone.getDataTable(TAB_ID).deleteElement(request, response);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "Host.update_template" : {
      type: "single",
      call: OpenNebulaHost.update,
      callback: function(request) {
        Sunstone.runAction('Host.show', request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    /* TODO "Host.addtocluster" : {
      type: "multiple",
      call: function(params) {
        var cluster = params.data.extra_param;
        var host = params.data.id;

        if (cluster == -1) {
          OpenNebulaHost.show({
            data : {
              id: host
            },
            success: function (request, host_info) {
              var current_cluster = host_info.HOST.CLUSTER_ID;

              if (current_cluster != -1) {
                OpenNebula.Cluster.delhost({
                  data: {
                    id: current_cluster,
                    extra_param: host
                  },
                  success: function() {
                    OpenNebula.Helper.clear_cache("HOST");
                    Sunstone.runAction('Host.show', host);
                  },
                  error: onError
                });
              } else {
                OpenNebula.Helper.clear_cache("HOST");
                Sunstone.runAction('Host.show', host);
              }
            },
            error: onError
          });
        } else {
          OpenNebula.Cluster.addhost({
            data: {
              id: cluster,
              extra_param: host
            },
            success: function() {
              OpenNebula.Helper.clear_cache("HOST");
              Sunstone.runAction('Host.show', host);
            },
            error: onError
          });
        }
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      }
    },*/

    "Host.rename" : {
      type: "single",
      call: OpenNebulaHost.rename,
      callback: function(request) {
        Sunstone.runAction('Host.show', request.request.data[0][0]);
      },
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
})
