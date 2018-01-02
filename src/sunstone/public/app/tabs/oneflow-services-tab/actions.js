/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
  var OpenNebulaResource = require('opennebula/service');
  var OpenNebulaRole = require('opennebula/role');
  var OpenNebulaVM = require('opennebula/vm');
  var CommonActions = require('utils/common-actions');

  var TAB_ID = require('./tabId');
  var XML_ROOT = "DOCUMENT";
  var RESOURCE = "Service";

  var ROLES_PANEL_ID = require('./panels/roles/panelId');
  var SCALE_DIALOG_ID = require('./dialogs/scale/dialogId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("Service created"));

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
    "Service.show" : _commonActions.show(),
    "Service.refresh" : _commonActions.refresh(),
    "Service.delete" : _commonActions.del(),
    "Service.chown": _commonActions.multipleAction('chown'),
    "Service.chgrp": _commonActions.multipleAction('chgrp'),
    "Service.chmod": _commonActions.singleAction('chmod'),
    "Service.rename": _commonActions.singleAction('rename'),
    "Service.shutdown": _commonActions.multipleAction('shutdown'),
    "Service.recover":    _commonActions.multipleAction('recover'),
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
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: function(request, error_json) {
        Notifier.onError(request, error_json, $(".oneflow_services_error_message"));
      }
    },

    //--------------------------------------------------------------------------

    "Role.scale_dialog" : {
      type: "custom",
      call: function(){
        selected = roleElements();

        if(selected.length == 0){
          return;
        }

        Sunstone.getDialog(SCALE_DIALOG_ID).setParams({roleIds: selected});
        Sunstone.getDialog(SCALE_DIALOG_ID).reset();
        Sunstone.getDialog(SCALE_DIALOG_ID).show();
      }
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

    "Role.hold" : {
      type: "multiple",
      call: OpenNebulaRole.hold,
      callback: roleCallback,
      elements: roleElements,
      error: Notifier.onError,
      notify: true
    },

    "Role.release" : {
      type: "multiple",
      call: OpenNebulaRole.release,
      callback: roleCallback,
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
