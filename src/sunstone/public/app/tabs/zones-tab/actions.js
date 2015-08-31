define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/zone');
  var CommonActions = require('utils/common-actions');

  var XML_ROOT = "ZONE"
  var RESOURCE = "Zone"
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./dialogs/create/dialogId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID, XML_ROOT);

  var _actions = {
    "Zone.create" : {
      type: "create",
      call: OpenNebulaResource.create,
      callback: function(request, response) {
        Sunstone.getDialog(CREATE_DIALOG_ID).hide();
        Sunstone.getDialog(CREATE_DIALOG_ID).reset();
        Sunstone.getDataTable(TAB_ID).addElement(request, response);
      },
      error: Notifier.onError,
      notify: true
    },
    
    "Zone.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.getDialog(CREATE_DIALOG_ID).show();
      }
    },
    "Zone.list" : _commonActions.list(),
    "Zone.show" : _commonActions.show(),
    "Zone.refresh" : _commonActions.refresh(),
    "Zone.delete" : _commonActions.del(),
    "Zone.update_template" : _commonActions.updateTemplate(),
    "Zone.rename": _commonActions.singleAction('rename'),

    "Zone.show_to_update" : {
      type: "single",
      call: OpenNebulaResource.show,
      // TODO callback: fillPopPup,
      error: Notifier.onError
    }
  };

  return _actions;
})
