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
  var OpenNebulaVM = require('opennebula/vm');
  var Buttons = require('./roles-vm-buttons');

  var ALL_ACTION_BUTTONS = $.map(Buttons, function(_, action) {
    return [action]
  });

  var STATE_ACTIONS = {};

  STATE_ACTIONS[OpenNebulaVM.STATES.INIT] = ["RoleVM.terminate_hard"];

  STATE_ACTIONS[OpenNebulaVM.STATES.PENDING] = ["RoleVM.hold", "RoleVM.terminate_hard", ];

  STATE_ACTIONS[OpenNebulaVM.STATES.HOLD] = ["RoleVM.release", "RoleVM.terminate_hard", ];

  STATE_ACTIONS[OpenNebulaVM.STATES.ACTIVE] = [];

  STATE_ACTIONS[OpenNebulaVM.STATES.STOPPED] = ["RoleVM.resume", "RoleVM.terminate_hard"];

  STATE_ACTIONS[OpenNebulaVM.STATES.SUSPENDED] = ["RoleVM.resume", "RoleVM.stop", "RoleVM.terminate_hard"];

  STATE_ACTIONS[OpenNebulaVM.STATES.DONE] = [];

  STATE_ACTIONS[OpenNebulaVM.STATES.FAILED] = [];

  STATE_ACTIONS[OpenNebulaVM.STATES.POWEROFF] =
    ["RoleVM.resched", "RoleVM.resume", "RoleVM.undeploy", "RoleVM.undeploy_hard", "RoleVM.terminate_hard"];

  STATE_ACTIONS[OpenNebulaVM.STATES.UNDEPLOYED] = ["RoleVM.resume", "RoleVM.terminate_hard"];

  STATE_ACTIONS[OpenNebulaVM.STATES.CLONING] = ["RoleVM.terminate_hard"];

  STATE_ACTIONS[OpenNebulaVM.STATES.CLONING_FAILURE] = ["RoleVM.terminate_hard"];


  var LCM_STATE_ACTIONS = {};

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.LCM_INIT] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.PROLOG] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.BOOT] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.RUNNING ] =
    ["RoleVM.poweroff_hard", "RoleVM.poweroff", "RoleVM.reboot_hard", "RoleVM.reboot", "RoleVM.resched", "RoleVM.stop", "RoleVM.suspend", "RoleVM.terminate_hard", "RoleVM.terminate", "RoleVM.undeploy_hard", "RoleVM.undeploy", "RoleVM.unresched"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.MIGRATE] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.SAVE_STOP] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.SAVE_SUSPEND] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.SAVE_MIGRATE] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.PROLOG_RESUME] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.EPILOG_STOP] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.EPILOG] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.SHUTDOWN] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.CANCEL] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.CLEANUP_RESUBMIT] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.UNKNOWN ] =
    ["RoleVM.poweroff_hard", "RoleVM.poweroff", "RoleVM.resched", "RoleVM.resume", "RoleVM.terminate_hard", "RoleVM.terminate", "RoleVM.undeploy_hard", "RoleVM.undeploy", "RoleVM.unresched"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.HOTPLUG] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.SHUTDOWN_POWEROFF] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.BOOT_UNKNOWN] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.BOOT_POWEROFF] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.BOOT_SUSPENDED] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.BOOT_STOPPED] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.CLEANUP_DELETE] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.HOTPLUG_SNAPSHOT] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.HOTPLUG_NIC] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.HOTPLUG_NIC_POWEROFF] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_POWEROFF] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_SUSPENDED] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.SHUTDOWN_UNDEPLOY] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.EPILOG_UNDEPLOY] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.PROLOG_UNDEPLOY] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.BOOT_UNDEPLOY] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.HOTPLUG_PROLOG_POWEROFF] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.HOTPLUG_EPILOG_POWEROFF] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.BOOT_MIGRATE] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.BOOT_FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.BOOT_MIGRATE_FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.PROLOG_FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.EPILOG_FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.EPILOG_STOP_FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.EPILOG_UNDEPLOY_FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_POWEROFF] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_POWEROFF_FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_SUSPEND] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_SUSPEND_FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.BOOT_UNDEPLOY_FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.BOOT_STOPPED_FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.PROLOG_RESUME_FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.PROLOG_UNDEPLOY_FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_POWEROFF] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_REVERT_POWEROFF] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_DELETE_POWEROFF] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_SUSPENDED] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_REVERT_SUSPENDED] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_DELETE_SUSPENDED] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_REVERT] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_DELETE] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_UNKNOWN] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_UNKNOWN_FAILURE] = ["RoleVM.terminate"];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.DISK_RESIZE] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.DISK_RESIZE_POWEROFF] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.DISK_RESIZE_UNDEPLOYED] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.HOTPLUG_RESIZE] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_UNDEPLOYED] = [];

  LCM_STATE_ACTIONS[OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_STOPPED] = [];


  return {
    'disableAllStateActions': disableAllStateActions,
    'disableStateButton': disableStateButton,
    'enableStateButton': enableStateButton,
    'enableStateActions': enableStateActions
  };

  function disableStateButton(action) {
    $(".state-dependent[href='" + action + "']", $('#role_vms_actions'))
      .prop("disabled", true)
      .removeClass("action-enabled")
      .addClass("action-disabled")
      .on("click.stateaction", function() { return false; });
  }

  function enableStateButton(action) {
    $(".state-dependent[href='" + action + "']", $('#role_vms_actions'))
      .removeAttr("disabled")
      .addClass("action-enabled")
      .removeClass("action-disabled")
      .off("click.stateaction")
  }

  function enableStateActions(state, lcm_state) {
    state = parseInt(state);
    lcm_state = parseInt(lcm_state);

    var isActiveState = state === OpenNebulaVM.STATES.ACTIVE

    var actionsAvailable = isActiveState
      ? LCM_STATE_ACTIONS[lcm_state]
      : STATE_ACTIONS[state];

    if (actionsAvailable === undefined) return;
 
    $.each(actionsAvailable, function(_, action) {
      enableStateButton(action);
    });
  }

  function disableAllStateActions() {
    $.each(ALL_ACTION_BUTTONS, function(_, action) {
      disableStateButton(action);
    });
  }
});
