define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var OpenNebulaImage = require('opennebula/image');

  var RESOURCE = "Image";
  var XML_ROOT = "IMAGE";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var CLONE_DIALOG_ID = require('./dialogs/clone/dialogId');

  var _actions = {
    "Image.create" : {
      type: "create",
      call: OpenNebulaImage.create,
      callback: function(request, response) {
        Sunstone.resetFormPanel(TAB_ID, CREATE_DIALOG_ID);
        Sunstone.hideFormPanel(TAB_ID);
        Sunstone.getDataTable(TAB_ID).addElement(request, response);
        Notifier.notifyCustom(Locale.tr("Image created"), " ID: " + response[XML_ROOT].ID, false);
      },
      error: Notifier.onError,
    },

    "Image.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },

    "Image.list" : {
      type: "list",
      call: OpenNebulaImage.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: Notifier.onError
    },

    "Image.show" : {
      type : "single",
      call: OpenNebulaImage.show,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateElement(request, response);
        if (Sunstone.rightInfoVisible($('#'+TAB_ID))) {
          Sunstone.insertPanels(TAB_ID, response);
        }
      },
      error: Notifier.onError
    },

    "Image.refresh" : {
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

    "Image.update_template" : {
      type: "single",
      call: OpenNebulaImage.update,
      callback: function(request) {
        Sunstone.runAction(RESOURCE+".show", request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Image.enable" : {
      type: "multiple",
      call: OpenNebulaImage.enable,
      callback: function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "Image.disable" : {
      type: "multiple",
      call: OpenNebulaImage.disable,
      callback: function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "Image.persistent" : {
      type: "multiple",
      call: OpenNebulaImage.persistent,
      callback: function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "Image.nonpersistent" : {
      type: "multiple",
      call: OpenNebulaImage.nonpersistent,
      callback: function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "Image.delete" : {
      type: "multiple",
      call: OpenNebulaImage.del,
      callback : function(request, response) {
        Sunstone.getDataTable(TAB_ID).deleteElement(request, response);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "Image.chown" : {
      type: "multiple",
      call: OpenNebulaImage.chown,
      callback:  function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "Image.chgrp" : {
      type: "multiple",
      call: OpenNebulaImage.chgrp,
      callback: function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "Image.chmod" : {
      type: "single",
      call: OpenNebulaImage.chmod,
      callback: function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      error: Notifier.onError,
      notify: true
    },

    "Image.chtype" : {
      type: "single",
      call: OpenNebulaImage.chtype,
      callback: function (req) {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0][0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },
    "Image.clone_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(CLONE_DIALOG_ID).show();
      }
    },
    "Image.clone" : {
      type: "single",
      call: OpenNebulaImage.clone,
      error: Notifier.onError,
      notify: true
    },
    "Image.rename" : {
      type: "single",
      call: OpenNebulaImage.rename,
      callback: function(request) {
        Sunstone.runAction(RESOURCE+".show", request.request.data[0][0]);
      },
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
});
