define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/acl');
  var CommonActions = require('utils/common-actions');

  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var XML_ROOT = "ACL"
  var RESOURCE = "Acl"

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID);

  var _actions = {
    "Acl.list" : _commonActions.list(),
    "Acl.refresh" : _commonActions.refresh(),
    "Acl.delete" : _commonActions.del(),
    "Acl.create" : _commonActions.create(CREATE_DIALOG_ID),
    "Acl.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID)
  };

  return _actions;
});
