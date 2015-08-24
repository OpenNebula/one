define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var OpenNebulaResource = require('opennebula/image');
  var CommonActions = require('utils/common-actions');

  var RESOURCE = "File";
  var XML_ROOT = "IMAGE";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID, XML_ROOT);

  var _actions = {
    "File.create" : _commonActions.create(CREATE_DIALOG_ID),
    "File.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "File.list" : _commonActions.list(),
    "File.show" : _commonActions.show(),
    "File.refresh" : _commonActions.refresh(),
    "File.delete" : _commonActions.del(),
    "File.update_template" : _commonActions.updateTemplate(),
    "File.chown": _commonActions.multipleAction('chown'),
    "File.chgrp": _commonActions.multipleAction('chgrp'),
    "File.chmod": _commonActions.singleAction('chmod'),
    "File.rename": _commonActions.singleAction('rename'),
    "File.enable": _commonActions.multipleAction('enable'),
    "File.disable": _commonActions.multipleAction('disable'),
    "File.chtype": _commonActions.singleAction('chtype')
  };

  return _actions;
});
