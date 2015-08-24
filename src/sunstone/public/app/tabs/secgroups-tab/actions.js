define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/securitygroup');
  var CommonActions = require('utils/common-actions');

  var RESOURCE = "SecurityGroup";
  var XML_ROOT = "SECURITY_GROUP";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var CLONE_DIALOG_ID = require('./dialogs/clone/dialogId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID, XML_ROOT);

  var _actions = {
    "SecurityGroup.create" : _commonActions.create(CREATE_DIALOG_ID),
    "SecurityGroup.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "SecurityGroup.list" : _commonActions.list(),
    "SecurityGroup.show" : _commonActions.show(),
    "SecurityGroup.refresh" : _commonActions.refresh(),
    "SecurityGroup.delete" : _commonActions.del(),
    "SecurityGroup.chown": _commonActions.multipleAction('chown'),
    "SecurityGroup.chgrp": _commonActions.multipleAction('chgrp'),
    "SecurityGroup.chmod": _commonActions.singleAction('chmod'),
    "SecurityGroup.rename": _commonActions.singleAction('rename'),
    "SecurityGroup.update" : _commonActions.update(),
    "SecurityGroup.update_template" : _commonActions.updateTemplate(),
    "SecurityGroup.update_dialog" : _commonActions.checkAndShowUpdate(),
    "SecurityGroup.show_to_update" : _commonActions.showUpdate(CREATE_DIALOG_ID),

    "SecurityGroup.clone_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(CLONE_DIALOG_ID).show();
      }
    },

    "SecurityGroup.clone" : {
      type: "single",
      call: OpenNebulaResource.clone,
      callback: function(request, response) {
        Sunstone.getDialog(CLONE_DIALOG_ID).hide();
        Sunstone.getDialog(CLONE_DIALOG_ID).reset();
        Sunstone.runAction('SecurityGroup.refresh');
      },
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
})
