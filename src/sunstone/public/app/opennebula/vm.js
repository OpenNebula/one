define(function(require) {
  var OpenNebulaAction = require('./action'),
      OpenNebulaHelper = require('./helper'),
      OpenNebulaError  = require('./error');

  var RESOURCE = "VM";

  var STATES = [
    "INIT",
    "PENDING",
    "HOLD",
    "ACTIVE",
    "STOPPED",
    "SUSPENDED",
    "DONE",
    "FAILED",
    "POWEROFF",
    "UNDEPLOYED"
  ]

  var LCM_STATES = [
    "LCM_INIT",
    "PROLOG",
    "BOOT",
    "RUNNING",
    "MIGRATE",
    "SAVE_STOP",
    "SAVE_SUSPEND",
    "SAVE_MIGRATE",
    "PROLOG_MIGRATE",
    "PROLOG_RESUME",
    "EPILOG_STOP",
    "EPILOG",
    "SHUTDOWN",
    "CANCEL",
    "FAILURE",
    "CLEANUP_RESUBMIT",
    "UNKNOWN",
    "HOTPLUG",
    "SHUTDOWN_POWEROFF",
    "BOOT_UNKNOWN",
    "BOOT_POWEROFF",
    "BOOT_SUSPENDED",
    "BOOT_STOPPED",
    "CLEANUP_DELETE",
    "HOTPLUG_SNAPSHOT",
    "HOTPLUG_NIC",
    "HOTPLUG_SAVEAS",
    "HOTPLUG_SAVEAS_POWEROFF",
    "HOTPLUG_SAVEAS_SUSPENDED",
    "SHUTDOWN_UNDEPLOY",
    "EPILOG_UNDEPLOY",
    "PROLOG_UNDEPLOY",
    "BOOT_UNDEPLOY",
    "HOTPLUG_PROLOG_POWEROFF",
    "HOTPLUG_EPILOG_POWEROFF",
    "BOOT_MIGRATE",
    "BOOT_FAILURE",
    "BOOT_MIGRATE_FAILURE",
    "PROLOG_MIGRATE_FAILURE",
    "PROLOG_FAILURE",
    "EPILOG_FAILURE",
    "EPILOG_STOP_FAILURE",
    "EPILOG_UNDEPLOY_FAILURE",
    "PROLOG_MIGRATE_POWEROFF",
    "PROLOG_MIGRATE_POWEROFF_FAILURE",
    "PROLOG_MIGRATE_SUSPEND",
    "PROLOG_MIGRATE_SUSPEND_FAILURE",
    "BOOT_UNDEPLOY_FAILURE",
    "BOOT_STOPPED_FAILURE",
    "PROLOG_RESUME_FAILURE",
    "PROLOG_UNDEPLOY_FAILURE"
  ]

  var SHORT_LCM_STATES = [
    "LCM_INIT", // LCM_INIT
    "PROLOG",    // PROLOG
    "BOOT",      // BOOT
    "RUNNING",   // RUNNING
    "MIGRATE",   // MIGRATE
    "SAVE",      // SAVE_STOP
    "SAVE",      // SAVE_SUSPEND
    "SAVE",      // SAVE_MIGRATE
    "MIGRATE",   // PROLOG_MIGRATE
    "PROLOG",    // PROLOG_RESUME
    "EPILOG",    // EPILOG_STOP
    "EPILOG",    // EPILOG
    "SHUTDOWN",  // SHUTDOWN
    "SHUTDOWN",  // CANCEL
    "FAILURE",   // FAILURE
    "CLEANUP",   // CLEANUP_RESUBMIT
    "UNKNOWN",   // UNKNOWN
    "HOTPLUG",   // HOTPLUG
    "SHUTDOWN",  // SHUTDOWN_POWEROFF
    "BOOT",      // BOOT_UNKNOWN
    "BOOT",      // BOOT_POWEROFF
    "BOOT",      // BOOT_SUSPENDED
    "BOOT",      // BOOT_STOPPED
    "CLEANUP",   // CLEANUP_DELETE
    "SNAPSHOT",  // HOTPLUG_SNAPSHOT
    "HOTPLUG",   // HOTPLUG_NIC
    "HOTPLUG",   // HOTPLUG_SAVEAS
    "HOTPLUG",   // HOTPLUG_SAVEAS_POWEROFF
    "HOTPLUG",   // HOTPLUG_SAVEAS_SUSPENDED
    "SHUTDOWN",  // SHUTDOWN_UNDEPLOY
    "EPILOG",    // EPILOG_UNDEPLOY
    "PROLOG",    // PROLOG_UNDEPLOY
    "BOOT",      // BOOT_UNDEPLOY
    "HOTPLUG",   // HOTPLUG_PROLOG_POWEROFF
    "HOTPLUG",   // HOTPLUG_EPILOG_POWEROFF
    "BOOT",      // BOOT_MIGRATE
    "FAILURE",   // BOOT_FAILURE
    "FAILURE",   // BOOT_MIGRATE_FAILURE
    "FAILURE",   // PROLOG_MIGRATE_FAILURE
    "FAILURE",   // PROLOG_FAILURE
    "FAILURE",   // EPILOG_FAILURE
    "FAILURE",   // EPILOG_STOP_FAILURE
    "FAILURE",   // EPILOG_UNDEPLOY_FAILURE
    "MIGRATE",   // PROLOG_MIGRATE_POWEROFF
    "FAILURE",   // PROLOG_MIGRATE_POWEROFF_FAILURE
    "MIGRATE",   // PROLOG_MIGRATE_SUSPEND
    "FAILURE",   // PROLOG_MIGRATE_SUSPEND_FAILURE
    "FAILURE",   // BOOT_UNDEPLOY_FAILURE
    "FAILURE",   // BOOT_STOPPED_FAILURE
    "FAILURE",   // PROLOG_RESUME_FAILURE
    "FAILURE"    // PROLOG_UNDEPLOY_FAILURE
  ]

  var VM = {
    "resource": RESOURCE,
    "state": {
      "INIT"      : 0,
      "PENDING"   : 1,
      "HOLD"      : 2,
      "ACTIVE"    : 3,
      "STOPPED"   : 4,
      "SUSPENDED" : 5,
      "DONE"      : 6,
      "FAILED"    : 7,
      "POWEROFF"  : 8,
      "UNDEPLOYED": 9
    },

    "lcm_state": {
      "LCM_INIT"            : 0,
      "PROLOG"              : 1,
      "BOOT"                : 2,
      "RUNNING"             : 3,
      "MIGRATE"             : 4,
      "SAVE_STOP"           : 5,
      "SAVE_SUSPEND"        : 6,
      "SAVE_MIGRATE"        : 7,
      "PROLOG_MIGRATE"      : 8,
      "PROLOG_RESUME"       : 9,
      "EPILOG_STOP"         : 10,
      "EPILOG"              : 11,
      "SHUTDOWN"            : 12,
      "CANCEL"              : 13,
      "FAILURE"             : 14,
      "CLEANUP_RESUBMIT"    : 15,
      "UNKNOWN"             : 16,
      "HOTPLUG"             : 17,
      "SHUTDOWN_POWEROFF"   : 18,
      "BOOT_UNKNOWN"        : 19,
      "BOOT_POWEROFF"       : 20,
      "BOOT_SUSPENDED"      : 21,
      "BOOT_STOPPED"        : 22,
      "CLEANUP_DELETE"      : 23,
      "HOTPLUG_SNAPSHOT"    : 24,
      "HOTPLUG_NIC"         : 25,
      "HOTPLUG_SAVEAS"           : 26,
      "HOTPLUG_SAVEAS_POWEROFF"  : 27,
      "HOTPLUG_SAVEAS_SUSPENDED" : 28,
      "SHUTDOWN_UNDEPLOY"   : 29,
      "EPILOG_UNDEPLOY"     : 30,
      "PROLOG_UNDEPLOY"     : 31,
      "BOOT_UNDEPLOY"       : 32,
      "HOTPLUG_PROLOG_POWEROFF"   : 33,
      "HOTPLUG_EPILOG_POWEROFF"   : 34,
      "BOOT_MIGRATE"              : 35,
      "BOOT_FAILURE"              : 36,
      "BOOT_MIGRATE_FAILURE"      : 37,
      "PROLOG_MIGRATE_FAILURE"    : 38,
      "PROLOG_FAILURE"            : 39,
      "EPILOG_FAILURE"            : 40,
      "EPILOG_STOP_FAILURE"       : 41,
      "EPILOG_UNDEPLOY_FAILURE"   : 42,
      "PROLOG_MIGRATE_POWEROFF"   : 43,
      "PROLOG_MIGRATE_POWEROFF_FAILURE"   : 44,
      "PROLOG_MIGRATE_SUSPEND"            : 45,
      "PROLOG_MIGRATE_SUSPEND_FAILURE"    : 46,
      "BOOT_UNDEPLOY_FAILURE"     : 47,
      "BOOT_STOPPED_FAILURE"      : 48,
      "PROLOG_RESUME_FAILURE"     : 49,
      "PROLOG_UNDEPLOY_FAILURE"   : 50
    },

    "stateStr": function(stateId) {
      return STATES[stateId];
    },
    "lcmStateStr": function(stateId) {
      return LCM_STATES[stateId];
    },
    "shortLcmStateStr": function(stateId) {
      return SHORT_LCM_STATES[stateId];
    },
    "hostnameStr": function(element) {
      var state = STATES[element.STATE];
      var hostname = "--";
      if (state == "ACTIVE" || state == "SUSPENDED" || state == "POWEROFF") {
        if (element.HISTORY_RECORDS.HISTORY.constructor == Array) {
          hostname = element.HISTORY_RECORDS.HISTORY[element.HISTORY_RECORDS.HISTORY.length - 1].HOSTNAME;
        } else {
          hostname = element.HISTORY_RECORDS.HISTORY.HOSTNAME;
        };
      };

      return hostname;
    },
    "create": function(params) {
      OpenNebulaAction.create(params, RESOURCE);
    },
    "del": function(params) {
      OpenNebulaAction.del(params, RESOURCE);
    },
    "list": function(params) {
      OpenNebulaAction.list(params, RESOURCE);
    },
    "show": function(params) {
      OpenNebulaAction.show(params, RESOURCE);
    },
    "chown" : function(params) {
      OpenNebulaAction.chown(params, RESOURCE);
    },
    "chgrp" : function(params) {
      OpenNebulaAction.chgrp(params, RESOURCE);
    },
    "chmod" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "chmod", action_obj);
    },
    "shutdown": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "shutdown");
    },
    "hold": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "hold");
    },
    "release": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "release");
    },
    "stop": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "stop");
    },
    "cancel": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "cancel");
    },
    "suspend": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "suspend");
    },
    "resume": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "resume");
    },
    "resubmit": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "resubmit");
    },
    "poweroff" : function(params) {
      var action_obj = {"hard": false};
      OpenNebulaAction.simple_action(params, RESOURCE, "poweroff", action_obj);
    },
    "poweroff_hard" : function(params) {
      var action_obj = {"hard": true};
      OpenNebulaAction.simple_action(params, RESOURCE, "poweroff", action_obj);
    },
    "undeploy" : function(params) {
      var action_obj = {"hard": false};
      OpenNebulaAction.simple_action(params, RESOURCE, "undeploy", action_obj);
    },
    "undeploy_hard" : function(params) {
      var action_obj = {"hard": true};
      OpenNebulaAction.simple_action(params, RESOURCE, "undeploy", action_obj);
    },
    "reboot" : function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "reboot");
    },
    "reset" : function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "reset");
    },

    "log": function(params) {
      OpenNebulaAction.show(params, RESOURCE, "log");
    },
    "deploy": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "deploy", action_obj);
    },
    "livemigrate": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "livemigrate", action_obj);
    },
    "migrate": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "migrate", action_obj);
    },
    "saveas": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "saveas", action_obj);
    },
    "disk_snapshot_cancel": function(params) {
      var action_obj = {"disk_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "disk_snapshot_cancel", action_obj);
    },
    "snapshot_create": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "snapshot_create", action_obj);
    },
    "snapshot_revert": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "snapshot_revert", action_obj);
    },
    "snapshot_delete": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "snapshot_delete", action_obj);
    },
    "vnc" : function(params, startstop) {
      var callback = params.success;
      var callback_error = params.error;
      var id = params.data.id;
      var resource = RESOURCE;

      var method = startstop;
      var action = OpenNebulaHelper.action(method);
      var request = OpenNebulaHelper.request(resource, method, id);
      $.ajax({
        url: "vm/" + id + "/" + method,
        type: "POST",
        dataType: "json",
        success: function(response) {
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callback_error ?
              callback_error(request, OpenNebulaError(response)) : null;
        }
      });
    },
    "startvnc" : function(params) {
      OpenNebula.VM.vnc(params, "startvnc");
    },
    "update": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "monitor" : function(params) {
      OpenNebulaAction.monitor(params, RESOURCE, false);
    },
    "pool_monitor" : function(params) {
      OpenNebulaAction.monitor(params, RESOURCE, true);
    },
    "resize" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "resize", action_obj);
    },
    "attachdisk" : function(params) {
      var action_obj = {"disk_template": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "attachdisk", action_obj);
    },
    "detachdisk" : function(params) {
      var action_obj = {"disk_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "detachdisk", action_obj);
    },
    "attachnic" : function(params) {
      var action_obj = {"nic_template": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "attachnic", action_obj);
    },
    "detachnic" : function(params) {
      var action_obj = {"nic_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "detachnic", action_obj);
    },
    "rename" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rename", action_obj);
    },
    "resched" : function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "resched");
    },
    "unresched" : function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "unresched");
    },
    "recover" : function(params) {
      var action_obj = {"result": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "recover", action_obj);
    },
    "accounting": function(params) {
      OpenNebulaAction.accounting(params, RESOURCE);
    },
    "showback": function(params) {
      OpenNebulaAction.showback(params, RESOURCE);
    },
    "save_as_template": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebula.Action.simple_action(params, RESOURCE, "save_as_template", action_obj);
    }
  }

  return VM;
})
