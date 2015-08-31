define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var OpenNebulaResource = require('opennebula/template');
  var CommonActions = require('utils/common-actions');
  var OpenNebulaAction = require('opennebula/action');

  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var CLONE_DIALOG_ID = require('./dialogs/clone/dialogId');
  var INSTANTIATE_DIALOG_ID = require('./form-panels/instantiate/formPanelId');
  var IMPORT_DIALOG_ID = require('./form-panels/import/formPanelId');

  var XML_ROOT = "VMTEMPLATE"
  var RESOURCE = "Template"

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID, XML_ROOT);

  var _actions = {
    "Template.list" : _commonActions.list(),
    "Template.show" : _commonActions.show(),
    "Template.refresh" : _commonActions.refresh(),
    "Template.delete" : _commonActions.del(),
    "Template.chown": _commonActions.multipleAction('chown'),
    "Template.chgrp": _commonActions.multipleAction('chgrp'),
    "Template.chmod": _commonActions.singleAction('chmod'),
    "Template.rename": _commonActions.singleAction('rename'),
    "Template.create" : _commonActions.create(CREATE_DIALOG_ID),
    "Template.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "Template.import_dialog" : _commonActions.showCreate(IMPORT_DIALOG_ID),
    "Template.update" : _commonActions.update(),
    "Template.update_dialog" : _commonActions.checkAndShowUpdate(),
    "Template.show_to_update" : _commonActions.showUpdate(CREATE_DIALOG_ID),
    "Template.instantiate" : {
      type: "multiple",
      call: OpenNebulaResource.instantiate,
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
      call: OpenNebulaResource.instantiate,
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
      call: OpenNebulaResource.clone,
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
})
