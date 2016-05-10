/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
  var OpenNebulaResource = require('opennebula/template');
  var CommonActions = require('utils/common-actions');
  var OpenNebulaAction = require('opennebula/action');

  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var CLONE_DIALOG_ID = require('./dialogs/clone/dialogId');
  var INSTANTIATE_DIALOG_ID = require('./form-panels/instantiate/formPanelId');
  var IMPORT_DIALOG_ID = require('./form-panels/import/formPanelId');
  var CONFIRM_DIALOG_ID = require('utils/dialogs/generic-confirm/dialogId');

  var XML_ROOT = "VMTEMPLATE"
  var RESOURCE = "Template"

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID, XML_ROOT);

  var _actions = {
    "Template.list" : _commonActions.list(),
    "Template.show" : _commonActions.show(),
    "Template.refresh" : _commonActions.refresh(),
    "Template.delete" : _commonActions.del(),
    
    "Template.delete_dialog":
      {
        type: "custom",
        call: function() {
          Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
            //header :
            body : Locale.tr("This will delete the Template.<br/>You can also delete any Image referenced inside this Template"),
            //question :
            buttons : [
              Locale.tr("Delete all images"),
              Locale.tr("Delete"),
            ],
            submit : [
              function(){
                Sunstone.runAction('Template.delete_recursive', Sunstone.getDataTable(TAB_ID).elements());
                return false;
              },
              function(){
                Sunstone.runAction('Template.delete', Sunstone.getDataTable(TAB_ID).elements());
                return false;
              }
            ]
          });

          Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
          Sunstone.getDialog(CONFIRM_DIALOG_ID).show();
        }
      },

    "Template.delete_recursive":
      {
        type: "multiple",
        call: OpenNebulaResource.delete_recursive,
        callback : function(request, response) {
          var elementId = request.request.data[0][0].toString();
          Sunstone.getDataTable(TAB_ID).deleteElement(elementId);
        },
        elements: function() {
          return Sunstone.getDataTable(TAB_ID).elements();
        },
        error: Notifier.onError,
        notify: true
      },

    "Template.chown": _commonActions.multipleAction('chown'),
    "Template.chgrp": _commonActions.multipleAction('chgrp'),
    "Template.chmod": _commonActions.singleAction('chmod'),
    "Template.share":
      {
        type: "multiple",
        call: function(params){
          var permissions = {
            'group_u' : 1,
            'recursive' : true
          };

          Sunstone.runAction(RESOURCE+".chmod", params.data.id, permissions);
        },
        callback : function(request, response) {
          Sunstone.runAction(RESOURCE+".show", req.request.data[0][0]);
        },
        elements: function() {
          return Sunstone.getDataTable(TAB_ID).elements();
        },
        error: Notifier.onError,
        notify: false
      },

    "Template.unshare":
      {
        type: "multiple",
        call: function(params){
          var permissions = {
            'group_u' : 0,
            'recursive' : true
          };

          Sunstone.runAction(RESOURCE+".chmod", params.data.id, permissions);
        },
        callback : function(request, response) {
          Sunstone.runAction(RESOURCE+".show", req.request.data[0][0]);
        },
        elements: function() {
          return Sunstone.getDataTable(TAB_ID).elements();
        },
        error: Notifier.onError,
        notify: false
      },

    "Template.rename": _commonActions.singleAction('rename'),
    "Template.create" : _commonActions.create(CREATE_DIALOG_ID),
    "Template.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "Template.import_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, IMPORT_DIALOG_ID, "import");
      }
    },
    "Template.append_template" : _commonActions.appendTemplate(),
    "Template.update" : _commonActions.update(),
    "Template.update_dialog" : _commonActions.checkAndShowUpdate(),
    "Template.update_template" : _commonActions.updateTemplate(),
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
      error: function(request, response){
        // without tab id param to work for both templates and vms tab
        Sunstone.hideFormPanelLoading();
        Notifier.onError(request, response);
      },
      notify: true
    },
    "Template.instantiate_quiet" : {
      type: "single",
      call: OpenNebulaResource.instantiate,
      callback: function(req) {
        Sunstone.hideFormPanel(TAB_ID);
        OpenNebulaAction.clear_cache("VM");
      },
      error: function(request, response){
        // without tab id param to work for both templates and vms tab
        Sunstone.hideFormPanelLoading();
        Notifier.onError(request, response);
      }
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
    "Template.instantiate_persistent":
    {
      type: "single",
      call: OpenNebulaResource.instantiate_persistent,
      callback: function(req) {
        Sunstone.hideFormPanel(TAB_ID);
        OpenNebulaAction.clear_cache("VM");
      },
      error: function(request, response){
        // without tab id param to work for both templates and vms tab
        Sunstone.hideFormPanelLoading();
        Notifier.onError(request, response);
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
      callback: function(request, response) {
        OpenNebulaAction.clear_cache("VMTEMPLATE");
        Notifier.notifyCustom(Locale.tr("VM Template created"), " ID: " + response.VMTEMPLATE.ID, false);
      },
      error: Notifier.onError,
      notify: true
    },
    "Template.clone_recursive":
    {
      type: "single",
      call: OpenNebulaResource.clone_recursive,
      callback : function(request, response) {
        OpenNebulaAction.clear_cache("VMTEMPLATE");
        Notifier.notifyCustom(Locale.tr("VM Template created"), " ID: " + response.VMTEMPLATE.ID, false);
      },
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
})
