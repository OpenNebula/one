define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var OpenNebulaTemplate = require('opennebula/template');
  var CommonActions = require('utils/common-actions');
  var OpenNebulaAction = require('opennebula/action');

  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var CLONE_DIALOG_ID = require('./dialogs/clone/dialogId');
  var INSTANTIATE_DIALOG_ID = require('./form-panels/instantiate/formPanelId');
  var IMPORT_DIALOG_ID = require('./form-panels/import/formPanelId');

  var XML_ROOT = "VMTEMPLATE"
  var RESOURCE = "Template"

  var _commonActions = new CommonActions(OpenNebulaTemplate, RESOURCE, TAB_ID);

  var _actions = {
    "Template.list" : _commonActions.list(),
    "Template.show" : _commonActions.show(),
    "Template.refresh" : _commonActions.refresh(),
    "Template.delete" : _commonActions.delete(),
    "Template.create" : {
      type: "create",
      call: OpenNebulaTemplate.create,
      callback: function(request, response) {
        Sunstone.resetFormPanel(TAB_ID, CREATE_DIALOG_ID);
        Sunstone.hideFormPanel(TAB_ID);
        Sunstone.getDataTable(TAB_ID).addElement(request, response);
      },
      error: function(request, response) {
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      },
      notify: true
    },
    "Template.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },
    "Template.import_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, IMPORT_DIALOG_ID, "import");
      }
    },
    "Template.update_dialog" : {
      type: "custom",
      call: function() {
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        if (selected_nodes.length != 1) {
          Notifier.notifyMessage("Please select one (and just one) Virtual Template to update.");
          return false;
        }

        var resource_id = "" + selected_nodes[0];
        Sunstone.runAction("Template.show_to_update", resource_id);
      }
    },
    "Template.show_to_update" : {
      type: "single",
      call: OpenNebulaTemplate.show,
      callback: function(request, response) {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "update",
          function(formPanelInstance, context) {
            formPanelInstance.fill(context, response[XML_ROOT])
          });
      },
      error: Notifier.onError
    },
    "Template.update" : {
      type: "single",
      call: OpenNebulaTemplate.update,
      callback: function(request, response) {
        Sunstone.hideFormPanel(TAB_ID);
        Notifier.notifyMessage(Locale.tr("Virtual Template updated correctly"));
      },
      error: function(request, response) {
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      }
    },
    "Template.rename" : {
      type: "single",
      call: OpenNebulaTemplate.rename,
      callback: function(request) {
        Sunstone.runAction('Template.show', request.request.data[0][0]);
      },
      error: Notifier.onError,
      notify: true
    },
    "Template.instantiate" : {
      type: "multiple",
      call: OpenNebulaTemplate.instantiate,
      callback: function(req) {
        Sunstone.hideFormPanel(TAB_ID);
        OpenNebulaAction.clear_cache("VM");
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },
    "Template.instantiate_quiet" : {
      type: "single",
      call: OpenNebulaTemplate.instantiate,
      callback: function(req) {
        Sunstone.hideFormPanel(TAB_ID);
        OpenNebulaAction.clear_cache("VM");
      },
      error: Notifier.onError
    },
    "Template.instantiate_vms" : {
      type: "custom",
      call: function(){
        //Sunstone.resetFormPanel(TAB_ID, INSTANTIATE_DIALOG_ID);
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();

        Sunstone.showFormPanel(TAB_ID, INSTANTIATE_DIALOG_ID, "instantiate",
          function(formPanelInstance, context) {
            formPanelInstance.setTemplateIds(context, selected_nodes);
          });
      }
    },
    "Template.clone_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(CLONE_DIALOG_ID).show();
      }
    },
    "Template.clone" : {
      type: "single",
      call: OpenNebulaTemplate.clone,
      error: Notifier.onError,
      notify: true
    },
    "Template.chown" : {
      type: "multiple",
      call: OpenNebulaTemplate.chown,
      callback:  function (req) {
        Sunstone.runAction("Template.show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },
    "Template.chgrp" : {
      type: "multiple",
      call: OpenNebulaTemplate.chgrp,
      callback:  function (req) {
        Sunstone.runAction("Template.show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },
    "Template.chmod" : {
      type: "single",
      call: OpenNebulaTemplate.chmod,
      callback:  function (req) {
        Sunstone.runAction("Template.show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
})
