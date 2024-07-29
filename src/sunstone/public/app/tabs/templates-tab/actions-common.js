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
  var OpenNebulaResource = require("opennebula/template");
  var Sunstone = require("sunstone");

  var CREATE_APP_DIALOG_ID = require("tabs/marketplaceapps-tab/form-panels/create/formPanelId");
  var MARKETPLACEAPPS_TAB_ID = require("tabs/marketplaceapps-tab/tabId");
  var XML_ROOT = "VMTEMPLATE";

  function Actions(_, resource, ids) {
    var RESOURCE = resource;
    var TAB_ID  = ids.TAB_ID;
    var CREATE_DIALOG_ID  = ids.CREATE_DIALOG_ID;
    var CLONE_DIALOG_ID   = ids.CLONE_DIALOG_ID;
    var INSTANTIATE_DIALOG_ID   = ids.INSTANTIATE_DIALOG_ID;
    var IMPORT_DIALOG_ID  = ids.IMPORT_DIALOG_ID;
    var CONFIRM_DIALOG_ID   = ids.CONFIRM_DIALOG_ID;

    var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
      XML_ROOT, Locale.tr("VM Template created"));

    var _actions = {};

    _actions[resource+".list"] = _commonActions.list();
    _actions[resource+".show"] = _commonActions.show();
    _actions[resource+".refresh"] = _commonActions.refresh();
    _actions[resource+".delete"] = _commonActions.del();

    _actions[resource+".delete_dialog"] = {
      type: "custom",
      call: function() {
        Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
          //header :
          headerTabId: TAB_ID,
          body : Locale.tr("This will delete the Template.<br/>You can also delete any Image referenced inside this Template"),
          //question :
          buttons : [
            Locale.tr("Delete all images"),
            Locale.tr("Delete"),
          ],
          submit : [
            function(){
              Sunstone.runAction(RESOURCE+".delete_recursive", Sunstone.getDataTable(TAB_ID).elements());
              return false;
            },
            function(){
              Sunstone.runAction(RESOURCE+".delete", Sunstone.getDataTable(TAB_ID).elements());
              return false;
            }
          ]
        });
        Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
        Sunstone.getDialog(CONFIRM_DIALOG_ID).show();
      }
    };

    _actions[resource+".delete_recursive"] = {
      type: "multiple",
      call: OpenNebulaResource.delete_recursive,
      callback : function() {
        if (Sunstone.getTab() == TAB_ID) {
          Sunstone.showTab(TAB_ID);
        }
      },
      elements: function(opts) {
        return Sunstone.getDataTable(TAB_ID).elements(opts);
      },
      error: Notifier.onError,
      notify: true
    };

    _actions[resource+".chown"] = _commonActions.multipleAction("chown");
    _actions[resource+".chgrp"] = _commonActions.multipleAction("chgrp");
    _actions[resource+".chmod"] = _commonActions.singleAction("chmod");

    _actions[resource+".share"] = {
      type: "multiple",
      call: function(params){
        var permissions = {
          "group_u" : 1,
          "recursive" : true
        };
        Sunstone.runAction(RESOURCE+".chmod", params.data.id, permissions);
      },
      callback : function() {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function(opts) {
        return Sunstone.getDataTable(TAB_ID).elements(opts);
      },
      error: Notifier.onError,
      notify: false
    };

    _actions[resource+".unshare"] = {
      type: "multiple",
      call: function(params){
        var permissions = {
          "group_u" : 0,
          "recursive" : true
        };
        Sunstone.runAction(RESOURCE+".chmod", params.data.id, permissions);
      },
      callback : function() {
        Sunstone.runAction(RESOURCE+".show", req.request.data[0]);
      },
      elements: function(opts) {
        return Sunstone.getDataTable(TAB_ID).elements(opts);
      },
      error: Notifier.onError,
      notify: false
    };

    _actions[resource+".rename"] = _commonActions.singleAction("rename");
    _actions[resource+".create"] = _commonActions.create(CREATE_DIALOG_ID);
    _actions[resource+".create_dialog"] = _commonActions.showCreate(CREATE_DIALOG_ID);
    _actions[resource+".import_dialog"] = {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, IMPORT_DIALOG_ID, "import");
      }
    };

    _actions[resource+".append_template"] = _commonActions.appendTemplate();
    _actions[resource+".update"] =  _commonActions.update();
    _actions[resource+".update_dialog"] = _commonActions.checkAndShowUpdate();
    _actions[resource+".update_template"] = _commonActions.updateTemplate();
    _actions[resource+".show_to_update"] = _commonActions.showUpdate(CREATE_DIALOG_ID);

    _actions[resource+".instantiate"] = {
      type: "multiple",
      call: OpenNebulaResource.instantiate,
      callback: function(_, response) {
        Sunstone.hideFormPanel();
        OpenNebulaAction.clear_cache("VM");
        Notifier.notifyCustom(
          Locale.tr("VM created"),
          Navigation.link(" ID: " + response, "vms-tab", response),
          false
        );
      },
      elements: function(opts) {
        return Sunstone.getDataTable(TAB_ID).elements(opts);
      },
      error: function(request, response){
        // without tab id param to work for both templates and vms tab
        Sunstone.hideFormPanelLoading();
        Notifier.onError(request, response);
      },
      notify: false
    };

    _actions[resource+".instantiate_quiet"] = {
      type: "single",
      call: OpenNebulaResource.instantiate,
      callback: function() {
        Sunstone.hideFormPanel();
        OpenNebulaAction.clear_cache("VM");
      },
      error: function(request, response){
        // without tab id param to work for both templates and vms tab
        Sunstone.hideFormPanelLoading();
        Notifier.onError(request, response);
      }
    };

    _actions[resource+".instantiate_vms"] = {
      type: "custom",
      call: function(){
        //Sunstone.resetFormPanel(TAB_ID, INSTANTIATE_DIALOG_ID);
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        Sunstone.showFormPanel(TAB_ID, INSTANTIATE_DIALOG_ID, "instantiate",
          function(formPanelInstance, context) {
            formPanelInstance.setTemplateIds(context, selected_nodes);
          });
      }
    };

    _actions[resource+".instantiate_persistent"] = {
      type: "single",
      call: OpenNebulaResource.instantiate_persistent,
      callback: function(_, response) {
        Sunstone.hideFormPanel();
        OpenNebulaAction.clear_cache("VM");
        Notifier.notifyCustom(Locale.tr("VM created"),
          Navigation.link(" ID: " + response, "vms-tab", response),
          false);
      },
      error: function(request, response){
        // without tab id param to work for both templates and vms tab
        Sunstone.hideFormPanelLoading();
        Notifier.onError(request, response);
      }
    };

    _actions[resource+".clone_dialog"] = {
      type: "custom",
      call: function(){
        Sunstone.getDialog(CLONE_DIALOG_ID).setParams(
          { tabId : TAB_ID,
            resource : resource
          });
        Sunstone.getDialog(CLONE_DIALOG_ID).reset();
        Sunstone.getDialog(CLONE_DIALOG_ID).show();
      }
    };

    _actions[resource+".clone"] =  {
      type: "single",
      call: OpenNebulaResource.clone,
      callback: function(_, response) {
        OpenNebulaAction.clear_cache("VMTEMPLATE");
        Notifier.notifyCustom(Locale.tr("VM Template created"),
          Navigation.link(" ID: " + response.VMTEMPLATE.ID, "templates-tab", response.VMTEMPLATE.ID),
          false);
      },
      error: Notifier.onError,
      notify: true
    };

    _actions[resource+".clone_recursive"] = {
      type: "single",
      call: OpenNebulaResource.clone_recursive,
      callback : function(_, response) {
        OpenNebulaAction.clear_cache("VMTEMPLATE");
        Notifier.notifyCustom(Locale.tr("VM Template created"),
          Navigation.link(" ID: " + response.VMTEMPLATE.ID, "templates-tab", response.VMTEMPLATE.ID),
          false);
      },
      error: Notifier.onError,
      notify: true
    };

    _actions[resource+".lockA"] = _commonActions.multipleAction("lock");
    _actions[resource+".lockM"] = _commonActions.multipleAction("lock");
    _actions[resource+".lockU"] = _commonActions.multipleAction("lock");
    _actions[resource+".unlock"] = _commonActions.multipleAction("unlock");

    _actions[resource+".upload_marketplace_dialog"] = {
      type: "custom",
      call: function() {
        var selectedNodes = Sunstone.getDataTable(TAB_ID).elements();
        if (selectedNodes.length !== 1) {
          Notifier.notifyMessage(Locale.tr("Please select one (and just one) Image to export."));
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
              "export_template",
              function(formPanelInstance, context) {
                formPanelInstance.setTemplateId(resourceId);
                $("#marketplaceapps-tab-wizardForms #TYPE").val("vmtemplate").change();
              }
            );
          },
          error: function(error){
            Notifier.onError(error);
          }
        });
      }
    };

    return _actions;
  }
  return Actions;
});
