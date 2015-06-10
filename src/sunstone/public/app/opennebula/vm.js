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
  ];

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
  ];

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
  ];

  var VNC_STATES = [
    3,  // VM.lcm_state.RUNNING,
    4,  // VM.lcm_state.MIGRATE,
    12, // VM.lcm_state.SHUTDOWN,
    13, // VM.lcm_state.CANCEL,
    16, // VM.lcm_state.UNKNOWN,
    17, // VM.lcm_state.HOTPLUG,
    18, // VM.lcm_state.SHUTDOWN_POWEROFF,
    24, // VM.lcm_state.HOTPLUG_SNAPSHOT,
    25, // VM.lcm_state.HOTPLUG_NIC,
    26, // VM.lcm_state.HOTPLUG_SAVEAS,
    27, // VM.lcm_state.HOTPLUG_SAVEAS_POWEROFF,
    28, // VM.lcm_state.HOTPLUG_SAVEAS_SUSPENDED,
    29, // VM.lcm_state.SHUTDOWN_UNDEPLOY
  ];

  var EXTERNAL_IP_ATTRS = [
    'GUEST_IP',
    'AWS_IP_ADDRESS',
    'AZ_IPADDRESS',
    'SL_PRIMARYIPADDRESS'
  ];

  var EXTERNAL_NETWORK_ATTRIBUTES = [
    'GUEST_IP',
    'AWS_IP_ADDRESS',
    'AWS_DNS_NAME',
    'AWS_PRIVATE_IP_ADDRESS',
    'AWS_PRIVATE_DNS_NAME',
    'AWS_SECURITY_GROUPS',
    'AZ_IPADDRESS',
    'SL_PRIMARYIPADDRESS'
  ];

  var MIGRATE_REASON = [
    "NONE",
    "ERROR",
    "USER"
  ];

  var MIGRATE_ACTION = [
    "none",
    "migrate",
    "live-migrate",
    "shutdown",
    "shutdown-hard",
    "undeploy",
    "undeploy-hard",
    "hold",
    "release",
    "stop",
    "suspend",
    "resume",
    "boot",
    "delete",
    "delete-recreate",
    "reboot",
    "reboot-hard",
    "resched",
    "unresched",
    "poweroff",
    "poweroff-hard",
    "disk-attach",
    "disk-detach",
    "nic-attach",
    "nic-detach"
  ];

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
        url: "vm/" + id + "/startvnc",
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
        var history = retrieveLastHistoryRecord(element)
        if (history) {
          hostname = history.HOSTNAME;
        };
      };

      return hostname;
    },
    "migrateActionStr": function(stateId) {
      return MIGRATE_ACTION[stateId];
    },
    "migrateReasonStr": function(stateId) {
      return MIGRATE_REASON[stateId];
    },
    "ipsStr": ipsStr,
    "retrieveExternalIPs": retrieveExternalIPs,
    "retrieveExternalNetworkAttrs": retrieveExternalNetworkAttrs,
    "isNICGraphsSupported": isNICGraphsSupported,
    "isNICAttachSupported": isNICAttachSupported,
    "isVNCSupported": isVNCSupported,
    "isSPICESupported": isSPICESupported,
  }

  function retrieveLastHistoryRecord(element) {
    if (element.HISTORY_RECORDS && element.HISTORY_RECORDS.HISTORY) {
      var history = element.HISTORY_RECORDS.HISTORY;
      if (history.constructor == Array) {
        return history[history.length - 1];
      } else {
        return history;
      };
    } else {
      return null;
    }
  }

  // Return true if the VM has a hybrid section
  function isNICGraphsSupported(element) {
    var history = retrieveLastHistoryRecord(element)
    if (history) {
      return $.inArray(history.VMMMAD, ['vcenter', 'ec2', 'az', 'sl']) == -1;
    } else {
      return false;
    }
  }

  function isNICAttachSupported(element) {
    var history = retrieveLastHistoryRecord(element)
    if (history) {
      return $.inArray(history.VMMMAD, ['ec2', 'az', 'sl']) == -1;
    } else {
      return false;
    }
  }

  function retrieveExternalIPs(element) {
    var template = element.TEMPLATE;
    var ips = {};
    var externalIP;

    $.each(EXTERNAL_IP_ATTRS, function(index, IPAttr) {
      externalIP = template[IPAttr];
      if (externalIP) {
        ips[IPAttr] = externalIP;
      }
    });

    return ips;
  }

  function retrieveExternalNetworkAttrs(element) {
    var template = element.TEMPLATE;
    var ips = {};
    var externalAttr;

    $.each(EXTERNAL_NETWORK_ATTRIBUTES, function(index, attr) {
      externalAttr = template[attr];
      if (externalAttr) {
        ips[attr] = externalAttr;
      }
    });

    return ips;
  }

  // Return the IP or several IPs of a VM
  function ipsStr(element, divider) {
    var divider = divider || "<br>"
    var nic = element.TEMPLATE.NIC;
    var ips = [];

    if (nic != undefined) {
      if (!$.isArray(nic)) {
        nic = [nic];
      }

      $.each(nic, function(index, value) {
        if (value.IP) {
          ips.push(value.IP);
        }

        if (value.IP6_GLOBAL) {
          ips.push(value.IP6_GLOBAL);
        }

        if (value.IP6_ULA) {
          ips.push(value.IP6_ULA);
        }
      });
    }

    var template = element.TEMPLATE;
    var externalIP;
    $.each(EXTERNAL_IP_ATTRS, function(index, IPAttr) {
      externalIP = template[IPAttr];
      if (externalIP && ($.inArray(externalIP, ips) == -1)) {
        ips.push(externalIP);
      }
    })

    if (ips.length > 0) {
      return ips.join(divider);
    } else {
      return '--';
    }
  };

  // returns true if the vnc button should be enabled
  function isVNCSupported(element) {
    var graphics = element.TEMPLATE.GRAPHICS;
    var state = parseInt(element.LCM_STATE);

    return (graphics &&
        graphics.TYPE &&
        graphics.TYPE.toLowerCase() == "vnc"  &&
        $.inArray(state, VNC_STATES) != -1);
  }

  function isSPICESupported(element) {
    var graphics = element.TEMPLATE.GRAPHICS;
    var state = parseInt(element.LCM_STATE);

    return (graphics &&
        graphics.TYPE &&
        graphics.TYPE.toLowerCase() == "spice" &&
        $.inArray(state, VNC_STATES) != -1);
  }
  
  return VM;
})
