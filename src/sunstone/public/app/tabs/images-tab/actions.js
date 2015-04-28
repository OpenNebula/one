define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaImage = require('opennebula/image');

  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./dialogs/create/dialogId');

  var _actions = {
    "Image.create" : {
      type: "create",
      call: OpenNebulaImage.create,
      callback: function(request, response) {
        Sunstone.hideDialog(CREATE_DIALOG_ID);
        Sunstone.resetDialog(CREATE_DIALOG_ID);
        DataTable.addElement(request, response);
        Notifier.notifyCustom(tr("Image created"), " ID: " + response.IMAGE.ID, false)
      },
      error: Notifier.onError,
    },

    "Image.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showDialog(CREATE_DIALOG_ID);
      }
    },

    "Image.list" : {
      type: "list",
      call: OpenNebulaImage.list,
      callback: DataTable.updateView,
      error: Notifier.onError
    },

    "Image.show" : {
      type : "single",
      call: OpenNebulaImage.show,
      callback: function(request, response) {
        if (Sunstone.rightInfoVisible($('#'+TAB_ID))) {
          // individual view
          Sunstone.insertPanels(TAB_ID, response);
        }

        // datatable row
        DataTable.updateElement(request, response);
      },
      error: Notifier.onError
    },

    "Image.refresh" : {
      type: "custom",
      call: function () {
        var tab = $('#' + TAB_ID);
        if (Sunstone.rightInfoVisible(tab)) {
          Sunstone.runAction("Image.show", Sunstone.rightInfoResourceId(tab))
        } else {
          DataTable.waitingNodes();
          Sunstone.runAction("Image.list", {force: true});
        }
      }
    },

    "Image.update_template" : {
      type: "single",
      call: OpenNebulaImage.update,
      callback: function(request) {
        Sunstone.runAction('Image.show', request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Image.enable" : {
      type: "multiple",
      call: OpenNebulaImage.enable,
      callback: function (req) {
        Sunstone.runAction("Image.show", req.request.data[0]);
      },
      elements: DataTable.elements,
      error: Notifier.onError,
      notify: true
    },

    "Image.disable" : {
      type: "multiple",
      call: OpenNebulaImage.disable,
      callback: function (req) {
        Sunstone.runAction("Image.show", req.request.data[0]);
      },
      elements: DataTable.elements,
      error: Notifier.onError,
      notify: true
    },

    "Image.persistent" : {
      type: "multiple",
      call: OpenNebulaImage.persistent,
      callback: function (req) {
        Sunstone.runAction("Image.show", req.request.data[0]);
      },
      elements: DataTable.elements,
      error: Notifier.onError,
      notify: true
    },

    "Image.nonpersistent" : {
      type: "multiple",
      call: OpenNebulaImage.nonpersistent,
      callback: function (req) {
        Sunstone.runAction("Image.show", req.request.data[0]);
      },
      elements: DataTable.elements,
      error: Notifier.onError,
      notify: true
    },

    "Image.delete" : {
      type: "multiple",
      call: OpenNebulaImage.del,
      callback : DataTable.deleteElement,
      elements: DataTable.elements,
      error: Notifier.onError,
      notify: true
    },

    "Image.chown" : {
      type: "multiple",
      call: OpenNebulaImage.chown,
      callback:  function (req) {
        Sunstone.runAction("Image.show", req.request.data[0]);
      },
      elements: DataTable.elements,
      error: Notifier.onError,
      notify: true
    },

    "Image.chgrp" : {
      type: "multiple",
      call: OpenNebulaImage.chgrp,
      callback: function (req) {
        Sunstone.runAction("Image.show", req.request.data[0]);
      },
      elements: DataTable.elements,
      error: Notifier.onError,
      notify: true
    },

    "Image.chmod" : {
      type: "single",
      call: OpenNebulaImage.chmod,
      callback: function (req) {
        Sunstone.runAction("Image.show", req.request.data[0]);
      },
      error: Notifier.onError,
      notify: true
    },

    "Image.chtype" : {
      type: "single",
      call: OpenNebulaImage.chtype,
      callback: function (req) {
        Sunstone.runAction("Image.show", req.request.data[0][0]);
      },
      elements: DataTable.elements,
      error: Notifier.onError,
      notify: true
    },
    "Image.clone_dialog" : {
      type: "custom",
      call: function(){} //TODO popUpImageCloneDialog
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
        Sunstone.runAction('Image.show', request.request.data[0][0]);
      },
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
})
