define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var OpenNebulaResource = require('opennebula/image');

  var RESOURCE = "File";
  var XML_ROOT = "IMAGE";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _actions = {
    "File.create" : {
      type: "create",
      call: OpenNebulaResource.create,
      callback: function(request, response) {
        Sunstone.resetFormPanel(TAB_ID, CREATE_DIALOG_ID);
        Sunstone.hideFormPanel(TAB_ID);
        Sunstone.getDataTable(TAB_ID).addElement(request, response);
        Notifier.notifyCustom(Locale.tr("File created"), " ID: " + response[XML_ROOT].ID, false);
      },
      error: function(request, response) {
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      },
    },

    "File.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },

    "File.list" : {
      type: "list",
      call: OpenNebulaResource.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: Notifier.onError
    },

    "File.show" : {
      type : "single",
      call: OpenNebulaResource.show,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateElement(request, response);
        if (Sunstone.rightInfoVisible($('#'+TAB_ID))) {
          Sunstone.insertPanels(TAB_ID, response);
        }
      },
      error: Notifier.onError
    },

    "File.refresh" : {
      type: "custom",
      call: function () {
        var tab = $('#' + TAB_ID);
        if (Sunstone.rightInfoVisible(tab)) {
          Sunstone.runAction(RESOURCE+".show", Sunstone.rightInfoResourceId(tab));
        } else {
          Sunstone.getDataTable(TAB_ID).waitingNodes();
          Sunstone.runAction(RESOURCE+".list", {force: true});
        }
      }
    },

    "File.update_template" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(request) {
        Sunstone.runAction(RESOURCE+".show", request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "File.enable" : {
      type: "multiple",
      call: OpenNebulaResource.enable,
      callback: function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "File.disable" : {
      type: "multiple",
      call: OpenNebulaResource.disable,
      callback: function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "File.delete" : {
      type: "multiple",
      call: OpenNebulaResource.del,
      callback : function(request, response) {
        Sunstone.getDataTable(TAB_ID).deleteElement(request, response);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "File.chown" : {
      type: "multiple",
      call: OpenNebulaResource.chown,
      callback:  function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "File.chgrp" : {
      type: "multiple",
      call: OpenNebulaResource.chgrp,
      callback: function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "File.chmod" : {
      type: "single",
      call: OpenNebulaResource.chmod,
      callback: function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      error: Notifier.onError,
      notify: true
    },

    "File.chtype" : {
      type: "single",
      call: OpenNebulaResource.chtype,
      callback: function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0][0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "File.rename" : {
      type: "single",
      call: OpenNebulaResource.rename,
      callback: function(request) {
        Sunstone.runAction(RESOURCE+".show", request.request.data[0][0]);
      },
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
});
