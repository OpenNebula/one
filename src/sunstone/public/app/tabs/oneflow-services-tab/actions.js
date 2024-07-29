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
  var CommonActions = require('utils/common-actions');
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');
  var OpenNebulaResource = require('opennebula/service');
  var OpenNebulaRole = require('opennebula/role');
  var OpenNebulaVM = require('opennebula/vm');
  var Sunstone = require('sunstone');

  var TAB_ID = require('./tabId');
  var XML_ROOT = "DOCUMENT";
  var RESOURCE = "Service";

  var ROLES_PANEL_ID = require('./panels/roles/panelId');
  var SCALE_DIALOG_ID = require('./dialogs/scale/dialogId');
  var ADD_DIALOG_ID = require('./dialogs/add/dialogId');
  var CONFIRM_DIALOG_ID = require('utils/dialogs/generic-confirm/dialogId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var UPDATE_DIALOG_ID = require('./form-panels/update/formPanelId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("Service created"));

  function roleElement() {
    var selected = {};

    var dataTable = $('table[id^=datatable_roles]', '#'+TAB_ID+' #'+ROLES_PANEL_ID);
    var nodes = $('tbody input.check_item:checked', dataTable);
    $.each(nodes, function() {
      selected["serviceId"] = $(this).data("id");
      selected["roleName"] = $(this).data("name");
    });

    return selected;
  }

  function roleElements() {
    var selected_nodes = [];

    var dataTable = $('table[id^=datatable_roles]', '#'+TAB_ID+' #'+ROLES_PANEL_ID);
    var nodes = $('tbody input.check_item:checked', dataTable);
    $.each(nodes, function() {
      selected_nodes.push($(this).val());
    });

    return selected_nodes;
  }

  function roleVMElements(opts) {
    var selected_nodes = [];

    var dataTable = $('table[id^=datatable_vms]', '#'+TAB_ID+' #'+ROLES_PANEL_ID);
    var nodes = $('tbody input.check_item:checked', dataTable);
    $.each(nodes, function() {
      selected_nodes.push($(this).val());
    });

    if (opts && opts.names){
      var pairs = [];

      $.each(selected_nodes, function(){
        pairs.push({id: this, name: OpenNebulaVM.getName(this)});
      });

      return pairs;
    }

    return selected_nodes;
  }

  function roleCallback() {
    return Sunstone.runAction('Service.refresh');
  }

  var _actions = {
    "Service.show" :  _commonActions.show(),
    "Service.refresh" : _commonActions.refresh(),
    "Service.delete" : _commonActions.del(),
    "Service.chown": _commonActions.multipleAction('chown'),
    "Service.chgrp": _commonActions.multipleAction('chgrp'),
    "Service.chmod": _commonActions.singleAction('chmod'),
    "Service.rename": _commonActions.singleAction('rename'),
    "Service.shutdown": _commonActions.multipleAction('shutdown'),
    "Service.recover":    _commonActions.multipleAction('recover'),
    "Service.recover_delete":    _commonActions.multipleAction('recover_delete'),
    "Service.update" : _commonActions.update(),
    "Service.update_dialog" : _commonActions.checkAndShowUpdate(),

    "Service.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },
    "Service.list" : {
      type: "list",
      call: OpenNebulaResource.list,
      callback: function(request, response) {
        $(".oneflow_services_error_message").hide();
        $(".oneflow_purge_button").removeClass("disabled");
        var undoneServices = OpenNebulaResource.filterDoneServices(response);
        Sunstone.getDataTable(TAB_ID).updateView(request, undoneServices);
      },
      error: function(request, error_json) {
        $(".oneflow_purge_button").addClass("disabled");
        Notifier.onError(request, error_json, $(".oneflow_services_error_message"));
      }
    },

    "Service.show_to_update" :  {
      type: "single",
      call: function(params) {
        OpenNebulaResource.show(params);
      },
      callback: function(request, response) {
        Sunstone.showFormPanel(TAB_ID, UPDATE_DIALOG_ID, "update",
          function(formPanelInstance, context) {
            formPanelInstance.fill(context, response[XML_ROOT]);
          }
        );
      },
      error: Notifier.onError
    },

    "Service.purge_done" : {
      type: 'single',
      call: function(params){
        params['data']['id'] = "purge";
        OpenNebulaResource.purgeDone(params);
      },
      callback: function(request, response) {
        Notifier.notifyCustom(Locale.tr("Purge DONE services"),
          Locale.tr("All DONE services has been purged"),
          false);
      },
      error: Notifier.onError
    },

    //--------------------------------------------------------------------------

    "Role.scale_dialog" : {
      type: "custom",
      call: function(){
        params = roleElement();

        if(!params.serviceId || !params.roleName) {
          Notifier.onError("Select one role");
          return;
        }

        Sunstone.getDialog(SCALE_DIALOG_ID).setParams(params);
        Sunstone.getDialog(SCALE_DIALOG_ID).reset();
        Sunstone.getDialog(SCALE_DIALOG_ID).show();
      }
    },
    "Role.scale" : {
      type: "single",
      call: OpenNebulaRole.scale,
      callback : function() {
        Sunstone.getDialog(SCALE_DIALOG_ID).hide();
        roleCallback();
      },
      error: function(request, response) {
        Sunstone.getDialog(SCALE_DIALOG_ID).hide();
        Notifier.onError(request, response);
      },
      notify: true
    },
    "Role.update" : {
      type: "multiple",
      call: OpenNebulaRole.update,
      callback: function() {
        Sunstone.getDialog(SCALE_DIALOG_ID).hide();
        roleCallback();
      },
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.suspend" : {
      type: "multiple",
      call: OpenNebulaRole.suspend,
      callback: roleCallback,
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.resume" : {
      type: "multiple",
      call: OpenNebulaRole.resume,
      callback: roleCallback,
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.stop" : {
      type: "multiple",
      call: OpenNebulaRole.stop,
      callback: roleCallback,
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.reboot" : {
      type: "multiple",
      call: OpenNebulaRole.reboot,
      callback: roleCallback,
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.reboot_hard" : {
      type: "multiple",
      call: OpenNebulaRole.reboot_hard,
      callback: roleCallback,
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.poweroff" : {
      type: "multiple",
      call: OpenNebulaRole.poweroff,
      callback: roleCallback,
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.poweroff_hard" : {
      type: "multiple",
      call: OpenNebulaRole.poweroff_hard,
      callback: roleCallback,
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.undeploy" : {
      type: "multiple",
      call: OpenNebulaRole.undeploy,
      callback: roleCallback,
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.undeploy_hard" : {
      type: "multiple",
      call: OpenNebulaRole.undeploy_hard,
      callback: roleCallback,
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.snapshot_create" : {
      type: "single",
      call: OpenNebulaRole.snapshot_create,
      callback: roleCallback,
      error: Notifier.onError,
      notify: true
    },

    "Role.terminate" : {
      type: "multiple",
      call: OpenNebulaRole.terminate,
      callback: roleCallback,
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.terminate_hard" : {
      type: "multiple",
      call: OpenNebulaRole.terminate_hard,
      callback: roleCallback,
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.delete" : {
      type: "multiple",
      call: OpenNebulaRole.del,
      callback: roleCallback,
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.recover" : {
      type: "multiple",
      call: OpenNebulaRole.recover,
      callback: roleCallback,
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.remove_dialog" : {
      type: "custom",
      call: function(){
        params = roleElement();

        if(!params.serviceId || !params.roleName) {
          Notifier.onError("Select one role");
          return;
        }

        var obj = {
          "action": {
            "perform":"remove_role",
            "params" : {
              "role" : params.roleName
            }
          }
        }

        Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
          header : Locale.tr("Confirm"),
          headerTabId: TAB_ID,
          body : "",
          question : Locale.tr("Are you sure you want to delete the role") + " <b>" + params.roleName + "</b>?",
          buttons : [
            Locale.tr("Confirm"),
          ],
          submit : [
            function(){
              Sunstone.getDialog(CONFIRM_DIALOG_ID).hide();
              Sunstone.runAction('Role.remove', params.serviceId, obj);
              return false;
            }
          ]
        });
        Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
        Sunstone.getDialog(CONFIRM_DIALOG_ID).show();
      }
    },

    "Role.remove" : {
      type: "single",
      call: OpenNebulaRole.remove,
      callback : function() {
        Sunstone.getDialog(CONFIRM_DIALOG_ID).hide();
        roleCallback();
      },
      error: function(request, response) {
        Sunstone.getDialog(CONFIRM_DIALOG_ID).hide();
        Notifier.onError(request, response);
      },
      notify: true
    },

    "Role.add" : {
      type: "single",
      call: OpenNebulaRole.add,
      callback : function() {
        Sunstone.getDialog(ADD_DIALOG_ID).hide();
        roleCallback();
      },
      error: function(request, response) {
        Sunstone.getDialog(ADD_DIALOG_ID).hide();
        Notifier.onError(request, response);
      },
      notify: true
    },

    "Role.add_dialog" : {
      type: "custom",
      call: function(){
        params = roleElement();
        
        Sunstone.getDialog(ADD_DIALOG_ID).reset();
        Sunstone.getDialog(ADD_DIALOG_ID).show();
      }
    },

    //--------------------------------------------------------------------------

    "RoleVM.deploy" : {
      type: "multiple",
      call: OpenNebulaVM.deploy,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.migrate" : {
      type: "multiple",
      call: OpenNebulaVM.migrate,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.migrate_live" : {
      type: "multiple",
      call: OpenNebulaVM.livemigrate,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.hold" : {
      type: "multiple",
      call: OpenNebulaVM.hold,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.release" : {
      type: "multiple",
      call: OpenNebulaVM.release,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.suspend" : {
      type: "multiple",
      call: OpenNebulaVM.suspend,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.resume" : {
      type: "multiple",
      call: OpenNebulaVM.resume,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.stop" : {
      type: "multiple",
      call: OpenNebulaVM.stop,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.reboot_hard" : {
      type: "multiple",
      call: OpenNebulaVM.reboot_hard,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.reboot" : {
      type: "multiple",
      call: OpenNebulaVM.reboot,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.poweroff" : {
      type: "multiple",
      call: OpenNebulaVM.poweroff,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.poweroff_hard" : {
      type: "multiple",
      call: OpenNebulaVM.poweroff_hard,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.undeploy" : {
      type: "multiple",
      call: OpenNebulaVM.undeploy,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.undeploy_hard" : {
      type: "multiple",
      call: OpenNebulaVM.undeploy_hard,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.terminate" : {
      type: "multiple",
      call: OpenNebulaVM.terminate,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.terminate_hard" : {
      type: "multiple",
      call: OpenNebulaVM.terminate_hard,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.recover" : {
      type: "multiple",
      call: OpenNebulaVM.recover,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.resched" : {
      type: "multiple",
      call: OpenNebulaVM.resched,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.unresched" : {
      type: "multiple",
      call: OpenNebulaVM.unresched,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },

    "RoleVM.chown" : {
      type: "multiple",
      call: OpenNebulaVM.chown,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    },
    "RoleVM.chgrp" : {
      type: "multiple",
      call: OpenNebulaVM.chgrp,
      callback: roleCallback,
      elements: roleVMElements,
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
});
