define(function(require) {
  var Helper = {
    "resource_state": function(type, value) {
      var state;
      switch (type)
      {
        case "HOST":
        case "host":
          state = tr(["INIT",
                     "MONITORING_MONITORED",
                     "MONITORED",
                     "ERROR",
                     "DISABLED",
                     "MONITORING_ERROR",
                     "MONITORING_INIT",
                     "MONITORING_DISABLED"][value]);
          break;
        case "HOST_SIMPLE":
        case "host_simple":
          state = tr(["INIT",
                     "UPDATE",
                     "ON",
                     "ERROR",
                     "OFF",
                     "RETRY",
                     "INIT",
                     "OFF"][value]);
          break;
        case "VM":
        case "vm":
          state = tr(["INIT",
                     "PENDING",
                     "HOLD",
                     "ACTIVE",
                     "STOPPED",
                     "SUSPENDED",
                     "DONE",
                     "FAILED",
                     "POWEROFF",
                     "UNDEPLOYED"][value]);
          break;
        case "SHORT_VM_LCM":
        case "short_vm_lcm":
          state = tr(["LCM_INIT", // LCM_INIT
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
                     "FAILURE"    // BOOT_STOPPED_FAILURE
                  ][value]);
          break;
        case "VM_LCM":
        case "vm_lcm":
          state = tr(["LCM_INIT",
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
                      "BOOT_STOPPED_FAILURE"
                  ][value]);
          break;
        case "IMAGE":
        case "image":
          state = tr(["INIT",
                     "READY",
                     "USED",
                     "DISABLED",
                     "LOCKED",
                     "ERROR",
                     "CLONE",
                     "DELETE",
                     "USED_PERS"][value]);
          break;
        case "DATASTORE":
        case "datastore":
          state = tr(["ON",
                     "OFF"][value]);
          break;
        case "VM_MIGRATE_REASON":
        case "vm_migrate_reason":
          state = tr(["NONE",
                     "ERROR",
                     "USER"][value]);
          break;
        case "VM_MIGRATE_ACTION":
        case "vm_migrate_action":
          state = tr(["none",
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
                      "nic-detach"][value]);
          break;
        default:
          return value;
      }
      if (!state) state = value
      return state;
    },

    "image_type": function(value) {
      return ["OS", "CDROM", "DATABLOCK", "KERNEL", "RAMDISK", "CONTEXT"][value];
    },

    "action": function(action, params) {
      obj = {
        "action": {
          "perform": action
        }
      }
      if (params) {
        obj.action.params = params;
      }
      return obj;
    },

    "request": function(resource, method, data) {
      var r = {
        "request": {
          "resource"  : resource,
          "method"    : method
        }
      }
      if (data) {
        if (typeof(data) != "array") {
          data = [data];
        }
        r.request.data = data;
      }
      return r;
    },

    "pool": function(resource, response) {
      var pool_name = resource + "_POOL";
      var type = resource;
      var pool;

      if (typeof(pool_name) == "undefined") {
        return Error('Incorrect Pool');
      }

      var p_pool = [];

      if (response[pool_name]) {
        pool = response[pool_name][type];
      } else {
        pool = null;
      }

      if (pool == null) {
        return p_pool;
      } else if (pool.length) {
        for (i = 0; i < pool.length; i++) {
          p_pool[i] = {};
          p_pool[i][type] = pool[i];
        }
        return (p_pool);
      } else {
        p_pool[0] = {};
        p_pool[0][type] = pool;
        return (p_pool);
      }
    },

    "pool_hash_processing": function(pool_name, resource_name, response) {
      var pool;

      if (typeof(pool_name) == "undefined") {
        return Error('Incorrect Pool');
      }

      var p_pool = {};

      if (response[pool_name]) {
        pool = response[pool_name][resource_name];
      } else {
        pool = null;
      }

      if (pool == null) {
        return p_pool;
      } else if (pool.length) {
        for (i = 0; i < pool.length; i++) {
          var res = {};
          res[resource_name] = pool[i];

          p_pool[res[resource_name]['ID']] = res;
        }
        return (p_pool);
      } else {
        var res = {};
        res[resource_name] = pool;

        p_pool[res[resource_name]['ID']] = res;

        return (p_pool);
      }
    },

    /* TODO remove if not necessary
    "clear_cache" : function(cache_name) {
      list_cache[cache_name] = null;
      //console.log(cache_name+" cache cleaned");
    }
    */
  }

  return Helper;
});
