define(function(require) {
  var OpenNebulaVM = require('opennebula/vm');

  var STATE_ACTIONS = {
    0: //OpenNebulaVM.state.INIT:
        ["VM.delete", "VM.delete_recreate", "VM.resize"],

    1: //OpenNebulaVM.state.PENDING:
        ["VM.delete", "VM.delete_recreate", "VM.hold", "VM.deploy"],

    2: //OpenNebulaVM.state.HOLD:
        ["VM.delete", "VM.delete_recreate", "VM.release", "VM.deploy"],

    3: //OpenNebulaVM.state.ACTIVE:
        ["VM.delete", "VM.delete_recreate", "VM.recover"],

    4: //OpenNebulaVM.state.STOPPED:
        ["VM.delete", "VM.delete_recreate", "VM.resume", "VM.deploy"],

    5: //OpenNebulaVM.state.SUSPENDED:
        ["VM.delete", "VM.resume", "VM.saveas", "VM.disk_snapshot_cancel", "VM.stop", "VM.shutdown_hard"],
    6: //OpenNebulaVM.state.DONE:
        [],

    7: //OpenNebulaVM.state.FAILED:
        ["VM.delete", "VM.delete_recreate", "VM.resize"],

    8: //OpenNebulaVM.state.POWEROFF:
        ["VM.delete", "VM.resume", "VM.resize", "VM.attachdisk", "VM.detachdisk", "VM.attachnic", "VM.detachnic", "VM.saveas", "VM.disk_snapshot_cancel", "VM.migrate", "VM.undeploy", "VM.undeploy_hard", "VM.shutdown_hard"],

    9: //OpenNebulaVM.state.UNDEPLOYED:
        ["VM.delete", "VM.delete_recreate", "VM.resume", "VM.resize", "VM.deploy"],
  }

  var LCM_STATE_ACTIONS = {
    0: //OpenNebulaVM.lcm_state.LCM_INIT:
        [],
    1: //OpenNebulaVM.lcm_state.PROLOG:
        [],
    2: //OpenNebulaVM.lcm_state.BOOT:
        [],
    3: //OpenNebulaVM.lcm_state.RUNNING:
        ["VM.shutdown", "VM.shutdown_hard", "VM.stop", "VM.suspend", "VM.reboot", "VM.reboot_hard", "VM.resched", "VM.unresched", "VM.poweroff", "VM.poweroff_hard", "VM.undeploy", "VM.undeploy_hard", "VM.migrate", "VM.migrate_live", "VM.attachdisk", "VM.detachdisk", "VM.attachnic", "VM.detachnic", "VM.saveas", "VM.disk_snapshot_cancel"],
    4: //OpenNebulaVM.lcm_state.MIGRATE:
        [],
    5: //OpenNebulaVM.lcm_state.SAVE_STOP:
        [],
    6: //OpenNebulaVM.lcm_state.SAVE_SUSPEND:
        [],
    7: //OpenNebulaVM.lcm_state.SAVE_MIGRATE:
        [],
    8: //OpenNebulaVM.lcm_state.PROLOG_MIGRATE:
        [],
    9: //OpenNebulaVM.lcm_state.PROLOG_RESUME:
        [],
    10: //OpenNebulaVM.lcm_state.EPILOG_STOP:
        [],
    11: //OpenNebulaVM.lcm_state.EPILOG:
        [],
    12: //OpenNebulaVM.lcm_state.SHUTDOWN:
        [],
    13: //OpenNebulaVM.lcm_state.CANCEL:
        [],
    14: //OpenNebulaVM.lcm_state.FAILURE:
        [],
    15: //OpenNebulaVM.lcm_state.CLEANUP_RESUBMIT:
        [],
    16: //OpenNebulaVM.lcm_state.UNKNOWN:
        ["VM.shutdown", "VM.shutdown_hard", "VM.resched", "VM.unresched", "VM.poweroff", "VM.poweroff_hard", "VM.undeploy", "VM.undeploy_hard", "VM.migrate", "VM.migrate_live", "VM.disk_snapshot_cancel", "VM.resume"],
    17: //OpenNebulaVM.lcm_state.HOTPLUG:
        [],
    18: //OpenNebulaVM.lcm_state.SHUTDOWN_POWEROFF:
        [],
    19: //OpenNebulaVM.lcm_state.BOOT_UNKNOWN:
        [],
    20: //OpenNebulaVM.lcm_state.BOOT_POWEROFF:
        [],
    21: //OpenNebulaVM.lcm_state.BOOT_SUSPENDED:
        [],
    22: //OpenNebulaVM.lcm_state.BOOT_STOPPED:
        [],
    23: //OpenNebulaVM.lcm_state.CLEANUP_DELETE:
        [],
    24: //OpenNebulaVM.lcm_state.HOTPLUG_SNAPSHOT:
        [],
    25: //OpenNebulaVM.lcm_state.HOTPLUG_NIC:
        [],
    26: //OpenNebulaVM.lcm_state.HOTPLUG_SAVEAS:
        [],
    27: //OpenNebulaVM.lcm_state.HOTPLUG_SAVEAS_POWEROFF:
        [],
    28: //OpenNebulaVM.lcm_state.HOTPLUG_SAVEAS_SUSPENDED:
        [],
    29: //OpenNebulaVM.lcm_state.SHUTDOWN_UNDEPLOY:
        [],
    30: //OpenNebulaVM.lcm_state.EPILOG_UNDEPLOY:
        [],
    31: //OpenNebulaVM.lcm_state.PROLOG_UNDEPLOY:
        [],
    32: //OpenNebulaVM.lcm_state.BOOT_UNDEPLOY:
        [],
    33: //OpenNebulaVM.lcm_state.HOTPLUG_PROLOG_POWEROFF:
        [],
    34: //OpenNebulaVM.lcm_state.HOTPLUG_EPILOG_POWEROFF:
        [],
    35: //OpenNebulaVM.lcm_state.BOOT_MIGRATE:
        [],
    36: //OpenNebulaVM.lcm_state.BOOT_FAILURE:
        [],
    37: //OpenNebulaVM.lcm_state.BOOT_MIGRATE_FAILURE:
        [],
    38: //OpenNebulaVM.lcm_state.PROLOG_MIGRATE_FAILURE:
        [],
    39: //OpenNebulaVM.lcm_state.PROLOG_FAILURE:
        [],
    40: //OpenNebulaVM.lcm_state.EPILOG_FAILURE:
        [],
    41: //OpenNebulaVM.lcm_state.EPILOG_STOP_FAILURE:
        [],
    42: //OpenNebulaVM.lcm_state.EPILOG_UNDEPLOY_FAILURE:
        [],
    43: //OpenNebulaVM.lcm_state.PROLOG_MIGRATE_POWEROFF:
        [],
    44: //OpenNebulaVM.lcm_state.PROLOG_MIGRATE_POWEROFF_FAILURE:
        [],
    45: //OpenNebulaVM.lcm_state.PROLOG_MIGRATE_SUSPEND:
        [],
    46: //OpenNebulaVM.lcm_state.PROLOG_MIGRATE_SUSPEND_FAILURE:
        [],
    47: //OpenNebulaVM.lcm_state.BOOT_UNDEPLOY_FAILURE:
        [],
    48: //OpenNebulaVM.lcm_state.BOOT_STOPPED_FAILURE:
        [],
    49: //OpenNebulaVM.lcm_state.PROLOG_RESUME_FAILURE:
        [],
    50: //OpenNebulaVM.lcm_state.PROLOG_UNDEPLOY_FAILURE:
        []
  }

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

    if (state == OpenNebulaVM.state.ACTIVE) {
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
             (state == OpenNebulaVM.state.ACTIVE &&
                LCM_STATE_ACTIONS[lcm_state].indexOf(action) != -1));
  }
});
