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

  var STATE_ACTIONS = {};

  STATE_ACTIONS[OpenNebulaVM.STATES.INIT] =
    ["VM.resize", "VM.terminate_hard", "VM.recover"];

  STATE_ACTIONS[OpenNebulaVM.STATES.PENDING] =
    ["VM.hold", "VM.deploy", "VM.updateconf", "VM.terminate_hard", "VM.recover", "VM.resize", "VM.updatenic"];

  STATE_ACTIONS[OpenNebulaVM.STATES.HOLD] =
    ["VM.release", "VM.deploy", "VM.updateconf", "VM.terminate_hard", "VM.recover", "VM.resize", "VM.updatenic"];

  STATE_ACTIONS[OpenNebulaVM.STATES.ACTIVE] =
    ["VM.recover","VM.updateconf","VM.resize"];

  STATE_ACTIONS[OpenNebulaVM.STATES.STOPPED] =
    ["VM.resume", "VM.deploy", "VM.terminate_hard", "VM.recover", "VM.updatenic"];

  STATE_ACTIONS[OpenNebulaVM.STATES.SUSPENDED] =
    ["VM.resume", "VM.disk_saveas", "VM.disk_snapshot_create", "VM.disk_snapshot_revert", "VM.disk_snapshot_delete", "VM.stop", "VM.terminate_hard", "VM.recover", "VM.migrate"];

  STATE_ACTIONS[OpenNebulaVM.STATES.DONE] =
    [];

  STATE_ACTIONS[OpenNebulaVM.STATES.FAILED] =
    [];

  STATE_ACTIONS[OpenNebulaVM.STATES.POWEROFF] =
    ["VM.resched", "VM.resume", "VM.resize", "VM.attachdisk", "VM.detachdisk", "VM.attachnic", "VM.detachnic", "VM.updatenic", "VM.disk_saveas", "VM.disk_snapshot_create", "VM.disk_snapshot_revert", "VM.disk_snapshot_delete", "VM.migrate", "VM.undeploy", "VM.undeploy_hard", "VM.save_as_template", "VM.updateconf", "VM.terminate_hard", "VM.recover", "VM.disk_resize", "VM.snapshot_delete", "VM.upload_marketplace_dialog", "VM.attachsg", "VM.detachsg", "VM.backup_dialog"];

  STATE_ACTIONS[OpenNebulaVM.STATES.UNDEPLOYED] =
    ["VM.resume", "VM.resize", "VM.deploy", "VM.updateconf", "VM.terminate_hard", "VM.recover", "VM.updatenic"];

  STATE_ACTIONS[OpenNebulaVM.STATES.CLONING] =
    ["VM.updateconf", "VM.terminate_hard", "VM.recover", "VM.resize"];

  STATE_ACTIONS[OpenNebulaVM.STATES.CLONING_FAILURE] =
    ["VM.updateconf", "VM.terminate_hard", "VM.recover", "VM.resize"];

  var LCM_STATE_ACTIONS = {};
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.LCM_INIT ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.RUNNING ] =
    ["VM.stop", "VM.suspend", "VM.reboot", "VM.reboot_hard", "VM.resched", "VM.unresched", "VM.poweroff", "VM.poweroff_hard", "VM.undeploy", "VM.undeploy_hard", "VM.migrate", "VM.migrate_live", "VM.migrate_poff", "VM.migrate_poff_hard", "VM.attachdisk", "VM.detachdisk", "VM.attachnic", "VM.detachnic", "VM.updatenic", "VM.disk_saveas", "VM.disk_snapshot_create", "VM.disk_snapshot_delete", "VM.terminate", "VM.terminate_hard", "VM.disk_resize", "VM.attachsg", "VM.detachsg", "VM.backup_dialog"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.MIGRATE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.SAVE_STOP ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.SAVE_SUSPEND ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.SAVE_MIGRATE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_RESUME ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.EPILOG_STOP ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.EPILOG ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.SHUTDOWN ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.CANCEL ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.FAILURE ] = ["VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.CLEANUP_RESUBMIT ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.UNKNOWN ] =
    ["VM.resched", "VM.unresched", "VM.poweroff", "VM.poweroff_hard", "VM.undeploy", "VM.undeploy_hard", "VM.migrate", "VM.migrate_live", "VM.migrate_poff", "VM.migrate_poff_hard", "VM.resume", "VM.terminate", "VM.terminate_hard"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.SHUTDOWN_POWEROFF ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_UNKNOWN ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_POWEROFF ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_SUSPENDED ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_STOPPED ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.CLEANUP_DELETE ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_SNAPSHOT ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_NIC ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_NIC_POWEROFF ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_POWEROFF ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_SUSPENDED ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.SHUTDOWN_UNDEPLOY ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.EPILOG_UNDEPLOY ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_UNDEPLOY ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_UNDEPLOY ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_PROLOG_POWEROFF ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_EPILOG_POWEROFF ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_MIGRATE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_FAILURE ] = ["VM.updateconf", "VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_MIGRATE_FAILURE ] = ["VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_FAILURE ] = ["VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_FAILURE ] = ["VM.updateconf", "VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.EPILOG_FAILURE ] = ["VM.updateconf", "VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.EPILOG_STOP_FAILURE ] = ["VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.EPILOG_UNDEPLOY_FAILURE ] = ["VM.updateconf", "VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_POWEROFF ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_POWEROFF_FAILURE ] = ["VM.updateconf", "VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_SUSPEND ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_SUSPEND_FAILURE ] = ["VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_UNDEPLOY_FAILURE ] = ["VM.updateconf", "VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_STOPPED_FAILURE ] = ["VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_RESUME_FAILURE ] = ["VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_UNDEPLOY_FAILURE ] = ["VM.updateconf", "VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_POWEROFF ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_REVERT_POWEROFF ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_DELETE_POWEROFF ] = ["VM.updateconf"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_SUSPENDED ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_REVERT_SUSPENDED ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_DELETE_SUSPENDED ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_REVERT ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_DELETE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_UNKNOWN ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_UNKNOWN_FAILURE ] = ["VM.terminate"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.DISK_RESIZE            ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.DISK_RESIZE_POWEROFF   ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.DISK_RESIZE_UNDEPLOYED ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_RESIZE         ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_UNDEPLOYED ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_STOPPED    ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BACKUP          ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BACKUP_POWEROFF ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.RESTORE         ] = [];

  return {
    'disableAllStateActions': disableAllStateActions,
    'resetStateButtons': resetStateButtons,
    'enableStateButton': enableStateButton,
    'enableStateActions': enableStateActions,
    'enabledStateAction': enabledStateAction
  };

  function disableAllStateActions() {
    $(".state-dependent").prop("disabled", true).
        removeClass("action-enabled").
        addClass("action-disabled").
        on("click.stateaction", function(e) { return false; });
  }

  function resetStateButtons() {
    $(".state-dependent").
        addClass("action-enabled").
        removeClass("action-disabled").
        off("click.stateaction");
  }

  function enableStateButton(button_action) {
    $(".state-dependent[href='" + button_action + "']").removeAttr("disabled").
        addClass("action-enabled").
        removeClass("action-disabled").
        off("click.stateaction");
  }

  // state and lcm_state are numeric
  function enableStateActions(state, lcm_state) {
    var state = parseInt(state);
    var lcm_state = parseInt(lcm_state);

    $.each(STATE_ACTIONS[state], function(i, action) {
      enableStateButton(action);
    });

    if (state == OpenNebulaVM.STATES.ACTIVE) {
      $.each(LCM_STATE_ACTIONS[lcm_state], function(i, action) {
        enableStateButton(action);
      });
    }
  }

  // Returns true if the action is enabled for the given state
  // action is "VM.action", state and lcm_state are numeric
  function enabledStateAction(action, state, lcm_state) {
    var state = parseInt(state);
    var lcm_state = parseInt(lcm_state);
    return (STATE_ACTIONS[state].indexOf(action) != -1 ||
             (state == OpenNebulaVM.STATES.ACTIVE &&
                LCM_STATE_ACTIONS[lcm_state].indexOf(action) != -1));
  }
});
