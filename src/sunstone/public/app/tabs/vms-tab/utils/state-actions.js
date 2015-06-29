define(function(require) {
  var OpenNebulaVM = require('opennebula/vm');

  var STATE_ACTIONS = {};

  STATE_ACTIONS[OpenNebulaVM.STATES.INIT] =
    ["VM.delete", "VM.delete_recreate", "VM.resize"];

  STATE_ACTIONS[OpenNebulaVM.STATES.PENDING] =
    ["VM.delete", "VM.delete_recreate", "VM.hold", "VM.deploy"];

  STATE_ACTIONS[OpenNebulaVM.STATES.HOLD] =
    ["VM.delete", "VM.delete_recreate", "VM.release", "VM.deploy"];

  STATE_ACTIONS[OpenNebulaVM.STATES.ACTIVE] =
    ["VM.delete", "VM.delete_recreate", "VM.recover"];

  STATE_ACTIONS[OpenNebulaVM.STATES.STOPPED] =
    ["VM.delete", "VM.delete_recreate", "VM.resume", "VM.deploy"];

  STATE_ACTIONS[OpenNebulaVM.STATES.SUSPENDED] =
    ["VM.delete", "VM.resume", "VM.disk_saveas", "VM.stop", "VM.shutdown_hard"];

  STATE_ACTIONS[OpenNebulaVM.STATES.DONE] =
    [];

  STATE_ACTIONS[OpenNebulaVM.STATES.FAILED] =
    ["VM.delete", "VM.delete_recreate", "VM.resize"];

  STATE_ACTIONS[OpenNebulaVM.STATES.POWEROFF] =
    ["VM.delete", "VM.resume", "VM.resize", "VM.attachdisk", "VM.detachdisk", "VM.attachnic", "VM.detachnic", "VM.disk_saveas", "VM.migrate", "VM.undeploy", "VM.undeploy_hard", "VM.shutdown_hard"];

  STATE_ACTIONS[OpenNebulaVM.STATES.UNDEPLOYED] =
    ["VM.delete", "VM.delete_recreate", "VM.resume", "VM.resize", "VM.deploy"];


  var LCM_STATE_ACTIONS = {};
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.LCM_INIT ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.RUNNING ] =
    ["VM.shutdown", "VM.shutdown_hard", "VM.stop", "VM.suspend", "VM.reboot", "VM.reboot_hard", "VM.resched", "VM.unresched", "VM.poweroff", "VM.poweroff_hard", "VM.undeploy", "VM.undeploy_hard", "VM.migrate", "VM.migrate_live", "VM.attachdisk", "VM.detachdisk", "VM.attachnic", "VM.detachnic", "VM.disk_saveas"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.MIGRATE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.SAVE_STOP ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.SAVE_SUSPEND ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.SAVE_MIGRATE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_RESUME ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.EPILOG_STOP ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.EPILOG ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.SHUTDOWN ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.CANCEL ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.FAILURE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.CLEANUP_RESUBMIT ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.UNKNOWN ] =
    ["VM.shutdown", "VM.shutdown_hard", "VM.resched", "VM.unresched", "VM.poweroff", "VM.poweroff_hard", "VM.undeploy", "VM.undeploy_hard", "VM.migrate", "VM.migrate_live", "VM.resume"];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.SHUTDOWN_POWEROFF ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_UNKNOWN ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_POWEROFF ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_SUSPENDED ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_STOPPED ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.CLEANUP_DELETE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_SNAPSHOT ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_NIC ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_POWEROFF ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_SUSPENDED ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.SHUTDOWN_UNDEPLOY ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.EPILOG_UNDEPLOY ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_UNDEPLOY ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_UNDEPLOY ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_PROLOG_POWEROFF ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.HOTPLUG_EPILOG_POWEROFF ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_MIGRATE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_FAILURE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_MIGRATE_FAILURE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_FAILURE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_FAILURE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.EPILOG_FAILURE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.EPILOG_STOP_FAILURE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.EPILOG_UNDEPLOY_FAILURE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_POWEROFF ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_POWEROFF_FAILURE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_SUSPEND ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_SUSPEND_FAILURE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_UNDEPLOY_FAILURE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.BOOT_STOPPED_FAILURE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_RESUME_FAILURE ] = [];
  LCM_STATE_ACTIONS[ OpenNebulaVM.LCM_STATES.PROLOG_UNDEPLOY_FAILURE ] = [];
  // TODO DISK_SNAPSHOT_POWEROFF
  // TODO DISK_SNAPSHOT_REVERT_POWEROFF
  // TODO DISK_SNAPSHOT_DELETE_POWEROFF
  // TODO DISK_SNAPSHOT_SUSPENDED
  // TODO DISK_SNAPSHOT_REVERT_SUSPENDED
  // TODO DISK_SNAPSHOT_DELETE_SUSPENDED

  return {
    'disableAllStateActions': disableAllStateActions,
    'resetStateButtons': resetStateButtons,
    'enableStateButton': enableStateButton,
    'enableStateActions': enableStateActions,
    'enabledStateAction': enabledStateAction
  };

  function disableAllStateActions() {
    $(".state-dependent").prop("disabled", true).
        removeClass("vm-action-enabled").
        addClass("vm-action-disabled").
        on("click.stateaction", function(e) { return false; });
  }

  function resetStateButtons() {
    $(".state-dependent").
        addClass("vm-action-enabled").
        removeClass("vm-action-disabled").
        off("click.stateaction");
  }

  function enableStateButton(button_action) {
    $(".state-dependent[href='" + button_action + "']").removeAttr("disabled").
        addClass("vm-action-enabled").
        removeClass("vm-action-disabled").
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
