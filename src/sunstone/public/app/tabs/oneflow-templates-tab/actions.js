/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
  var CommonActions = require("utils/common-actions");
  var Locale = require("utils/locale");
  var Navigation = require("utils/navigation");
  var Notifier = require("utils/notifier");
  var OpenNebulaAction = require("opennebula/action");
  var OpenNebulaResource = require("opennebula/servicetemplate");
  var Sunstone = require("sunstone");

  var CLONE_DIALOG_ID = require("./dialogs/clone/dialogId");
  var CONFIRM_DIALOG_ID = require("utils/dialogs/generic-confirm/dialogId");
  var CREATE_APP_DIALOG_ID = require("tabs/marketplaceapps-tab/form-panels/create/formPanelId");
  var CREATE_DIALOG_ID = require("./form-panels/create/formPanelId");
  var INSTANTIATE_DIALOG_ID = require("./form-panels/instantiate/formPanelId");
  var MARKETPLACEAPPS_TAB_ID = require("tabs/marketplaceapps-tab/tabId");
  var TAB_ID = require("./tabId");
  var XML_ROOT = "DOCUMENT";
  var RESOURCE = "ServiceTemplate";

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("Service Template created"));

  var _actions = {
    "ServiceTemplate.create" : _commonActions.create(CREATE_DIALOG_ID),
    "ServiceTemplate.show" : _commonActions.show(),
    "ServiceTemplate.refresh" : _commonActions.refresh(),
    "ServiceTemplate.delete" : _commonActions.delWithoutRedirect(),
    "ServiceTemplate.chown": _commonActions.multipleAction("chown"),
    "ServiceTemplate.chgrp": _commonActions.multipleAction("chgrp"),
    "ServiceTemplate.chmod": _commonActions.singleAction("chmod"),
    "ServiceTemplate.rename": _commonActions.singleAction("rename"),
    "ServiceTemplate.update" : _commonActions.update(),
    "ServiceTemplate.update_dialog" : _commonActions.checkAndShowUpdate(),
    "ServiceTemplate.delete_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
          headerTabId: TAB_ID,
          body : Locale.tr("This will delete the Service.<br/>You can also delete the template or the template and image referenced inside this Service."),
          buttons : [
            Locale.tr("Delete Images and VM Templates"),
            Locale.tr("Delete VM Templates"),
            Locale.tr("Delete"),
          ],
          submit : [
            function() {
              Sunstone.runAction(RESOURCE+".delete", Sunstone.getDataTable(TAB_ID).elements(), { "delete_type": "all" });
              return false;
            },
            function() {
              Sunstone.runAction(RESOURCE+".delete", Sunstone.getDataTable(TAB_ID).elements(), { "delete_type": "templates" });
              return false;
            },
            function() {
              Sunstone.runAction(RESOURCE+".delete", Sunstone.getDataTable(TAB_ID).elements(), { "delete_type": "none" });
              return false;
            }
          ]
        });
        Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
        Sunstone.getDialog(CONFIRM_DIALOG_ID).show();
      },
      callback : function() {
        if (Sunstone.getTab() == that.tabId) {
          Sunstone.showTab(that.tabId);
        }
      },
    },
    "ServiceTemplate.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.runAction("Network.list");
        Sunstone.runAction("VNTemplate.list");
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },
    "ServiceTemplate.show_to_update" : {
      type: "single",
      call: function(params) {
        Sunstone.runAction("Network.list");
        Sunstone.runAction("VNTemplate.list");
        OpenNebulaResource.show(params);
      },
      callback: function(_, response) {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "update",
          function(formPanelInstance, context) {
            formPanelInstance.fill(context, response[XML_ROOT]);
          }
        );
      },
      error: Notifier.onError
    },
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
      callback: function(_, response){
        Sunstone.hideFormPanel();
        OpenNebulaAction.clear_cache("SERVICE");

        Notifier.notifyCustom(Locale.tr("Service created"),
          Navigation.link(" ID: " + response.DOCUMENT.ID, "oneflow-services-tab", response.DOCUMENT.ID),
          false);
      },
      elements: function(opts) {
        return Sunstone.getDataTable(TAB_ID).elements(opts);
      },
      error: function(request, response){
        Sunstone.hideFormPanelLoading();
        Notifier.onError(request, response);
      },
      notify: false
    },
    "ServiceTemplate.instantiate_dialog" : {
      type: "custom",
      call: function() {
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        if (selected_nodes.length !== 1) {
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
    },
    "ServiceTemplate.upload_marketplace_dialog" : {
      type: "custom",
      call: function() {
        var selectedNodes = Sunstone.getDataTable(TAB_ID).elements();

        if (selectedNodes.length !== 1) {
          Notifier.notifyMessage(Locale.tr("Please select one (and just one) Service to export."));
          return false;
        }
        var resourceId = "" + selectedNodes[0];
        OpenNebulaResource.show({
          data : {
              id: resourceId
          },
          success: function(){
            Sunstone.showTab(MARKETPLACEAPPS_TAB_ID);
            Sunstone.showFormPanel(
              MARKETPLACEAPPS_TAB_ID,
              CREATE_APP_DIALOG_ID,
              "export_service",
              function(formPanelInstance, context) {
                formPanelInstance.setServiceId(resourceId);
                $("#marketplaceapps-tab-wizardForms #TYPE").val("service_template").change();
              }
            );
          },
          error: function(error){
            Notifier.onError(error);
          }
        });
      }
    }
  };
  return _actions;
});
