define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var OpenNebulaResource = require('opennebula/servicetemplate');
  var CommonActions = require('utils/common-actions');

  var TAB_ID = require('./tabId');
  //var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  //var INSTANTIATE_DIALOG_ID = require('./dialogs/instantiate/dialogId');
  var XML_ROOT = "DOCUMENT";
  var RESOURCE = "ServiceTemplate";

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID);

  var _actions = {
    "ServiceTemplate.show" : _commonActions.show(),
    "ServiceTemplate.refresh" : _commonActions.refresh(),
    "ServiceTemplate.delete" : _commonActions.delete(),
    "ServiceTemplate.chown": _commonActions.multipleAction('chown'),
    "ServiceTemplate.chgrp": _commonActions.multipleAction('chgrp'),
    "ServiceTemplate.chmod": _commonActions.singleAction('chmod'),

    "ServiceTemplate.list" : {
      type: "list",
      call: OpenNebulaResource.list,
      callback: function(request, response) {
        $(".oneflow_templates_error_message").hide();
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: function(request, error_json) {
        Notifier.onError(request, error_json, $(".oneflow_templates_error_message"));
      }
    },

    "ServiceTemplate.create" : {
      type: "create",
      call: OpenNebulaResource.create,
      callback: function(request, response){
        Sunstone.resetFormPanel(TAB_ID, CREATE_DIALOG_ID);
        Sunstone.hideFormPanel(TAB_ID);
        Sunstone.getDataTable(TAB_ID).addElement(request, response);
      },
      error: function(request, response){
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      }
    },

    "ServiceTemplate.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },

    "ServiceTemplate.update_dialog" : {
      type: "custom",
      call: function() {
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        if (selected_nodes.length != 1) {
          Notifier.notifyMessage("Please select one (and just one) template to update.");
          return false;
        }

        var resource_id = "" + selected_nodes[0];
        Sunstone.runAction(RESOURCE+".show_to_update", resource_id);
      }
    },

    "ServiceTemplate.show_to_update" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function(request, response) {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "update",
          function(formPanelInstance, context) {
            formPanelInstance.fill(context, response[XML_ROOT]);
          });
      },
      error: Notifier.onError
    },

    "ServiceTemplate.update" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(request, response){
        Sunstone.hideFormPanel(TAB_ID);
        Notifier.notifyMessage(Locale.tr("ServiceTemplate updated correctly"));
      },
      error: function(request, response) {
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      }
    },

    /* TODO

    "ServiceTemplate.instantiate" : {
        type: "multiple",
        call: OpenNebula.ServiceTemplate.instantiate,
        callback: function(req){
            OpenNebula.Helper.clear_cache("SERVICE");
        },
        elements: serviceTemplateElements,
        error: onError,
        notify: true
    },

    "ServiceTemplate.instantiate_dialog" : {
        type: "custom",
        call: function(){
            popUpInstantiateServiceTemplateDialog();
        }
    },
    */
  };

  return _actions;
});