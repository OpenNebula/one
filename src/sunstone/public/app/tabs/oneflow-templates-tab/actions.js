/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var OpenNebulaResource = require('opennebula/servicetemplate');
  var CommonActions = require('utils/common-actions');
  var OpenNebulaAction = require('opennebula/action');

  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var INSTANTIATE_DIALOG_ID = require('./form-panels/instantiate/formPanelId');
  var CLONE_DIALOG_ID = require('./dialogs/clone/dialogId');
  var XML_ROOT = "DOCUMENT";
  var RESOURCE = "ServiceTemplate";

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID, XML_ROOT);

  var _actions = {
    "ServiceTemplate.create" : _commonActions.create(CREATE_DIALOG_ID),
    "ServiceTemplate.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "ServiceTemplate.show" : _commonActions.show(),
    "ServiceTemplate.refresh" : _commonActions.refresh(),
    "ServiceTemplate.delete" : _commonActions.del(),
    "ServiceTemplate.chown": _commonActions.multipleAction('chown'),
    "ServiceTemplate.chgrp": _commonActions.multipleAction('chgrp'),
    "ServiceTemplate.chmod": _commonActions.singleAction('chmod'),
    "ServiceTemplate.rename": _commonActions.singleAction('rename'),
    "ServiceTemplate.update" : _commonActions.update(),
    "ServiceTemplate.update_dialog" : _commonActions.checkAndShowUpdate(),
    "ServiceTemplate.show_to_update" : _commonActions.showUpdate(CREATE_DIALOG_ID),

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


    "ServiceTemplate.instantiate" : {
      type: "single",
      call: OpenNebulaResource.instantiate,
      callback: function(request, response){
        Sunstone.hideFormPanel(TAB_ID);
        OpenNebulaAction.clear_cache("SERVICE");
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: function(request, response){
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      },
      notify: true
    },

    "ServiceTemplate.instantiate_dialog" : {
      type: "custom",
      call: function() {
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        if (selected_nodes.length != 1) {
          Notifier.notifyMessage("Please select one (and just one) template to instantiate.");
          return false;
        }

        var templateId = "" + selected_nodes[0];

        Sunstone.resetFormPanel(TAB_ID, INSTANTIATE_DIALOG_ID);
        Sunstone.showFormPanel(TAB_ID, INSTANTIATE_DIALOG_ID, "instantiate",
          function(formPanelInstance, context) {
            formPanelInstance.setTemplateId(context, templateId);
          });
      }
    },

    "ServiceTemplate.clone_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(CLONE_DIALOG_ID).show();
      }
    },
    
    "ServiceTemplate.clone" : {
      type: "single",
      call: OpenNebulaResource.clone,
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
});
