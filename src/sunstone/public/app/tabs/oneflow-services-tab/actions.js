define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var OpenNebulaResource = require('opennebula/service');
  var CommonActions = require('utils/common-actions');

  var TAB_ID = require('./tabId');
  var XML_ROOT = "DOCUMENT";
  var RESOURCE = "Service";

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID);

  var _actions = {
    "Service.show" : _commonActions.show(),
    "Service.refresh" : _commonActions.refresh(),
    "Service.delete" : _commonActions.delete(),
    "Service.chown": _commonActions.multipleAction('chown'),
    "Service.chgrp": _commonActions.multipleAction('chgrp'),
    "Service.chmod": _commonActions.singleAction('chmod'),

    "Service.list" : {
      type: "list",
      call: OpenNebulaResource.list,
      callback: function(request, response) {
        $(".oneflow_services_error_message").hide();
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: function(request, error_json) {
        Notifier.onError(request, error_json, $(".oneflow_services_error_message"));
      }
    },

    /* TODO

    "Service.shutdown" : {
        type: "multiple",
        call: OpenNebula.Service.shutdown,
        elements: serviceElements,
        error: onError,
        notify: true
    },

    "Service.recover" : {
        type: "multiple",
        call: OpenNebula.Service.recover,
        elements: serviceElements,
        error: onError,
        notify: true
    }

    */
  };

  return _actions;
});