/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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
  var OpenNebulaAction = require("./action"),
    OpenNebulaHelper = require("./helper"),
    OpenNebulaError  = require("./error");
    OpenNebulaCluster = require("./cluster"),
    Locale = require("utils/locale"),
    Config = require("sunstone-config"),
    Navigation = require("utils/navigation");

  var RESOURCE = "VM";

  var STATES_STR = [
    "INIT",
    "PENDING",
    "HOLD",
    "ACTIVE",
    "STOPPED",
    "SUSPENDED",
    "DONE",
    "FAILED",
    "POWEROFF",
    "UNDEPLOYED",
    "CLONING",
    "CLONING_FAILURE"
  ];

  var STATES_CLASSES = [
    "info", // INIT
    "info", // PENDING
    "info", // HOLD
    "", // ACTIVE
    "info", // STOPPED
    "info", // SUSPENDED
    "info", // DONE
    "info", // FAILED
    "info", // POWEROFF
    "info", // UNDEPLOYED
    "info", // CLONING
    "info" // CLONING_FAILURE
  ];

  var STATES = {
    INIT            : 0,
    PENDING         : 1,
    HOLD            : 2,
    ACTIVE          : 3,
    STOPPED         : 4,
    SUSPENDED       : 5,
    DONE            : 6,
    //FAILED        : 7,
    POWEROFF        : 8,
    UNDEPLOYED      : 9,
    CLONING         : 10,
    CLONING_FAILURE : 11
  };

  var LCM_STATES_STR = [
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
    "PROLOG_UNDEPLOY_FAILURE",
    "DISK_SNAPSHOT_POWEROFF",
    "DISK_SNAPSHOT_REVERT_POWEROFF",
    "DISK_SNAPSHOT_DELETE_POWEROFF",
    "DISK_SNAPSHOT_SUSPENDED",
    "DISK_SNAPSHOT_REVERT_SUSPENDED",
    "DISK_SNAPSHOT_DELETE_SUSPENDED",
    "DISK_SNAPSHOT",
    "DISK_SNAPSHOT_REVERT", // deprecated
    "DISK_SNAPSHOT_DELETE",
    "PROLOG_MIGRATE_UNKNOWN",
    "PROLOG_MIGRATE_UNKNOWN_FAILURE",
    "DISK_RESIZE",
    "DISK_RESIZE_POWEROFF",
    "DISK_RESIZE_UNDEPLOYED",
    "HOTPLUG_NIC_POWEROFF",
    "HOTPLUG_RESIZE"
  ];

  var LCM_STATES_CLASSES = [
    "info", // LCM_INIT
    "info", // PROLOG
    "info", // BOOT
    "success",  // RUNNING
    "info",  // MIGRATE
    "info",  // SAVE_STOP
    "info", // SAVE_SUSPEND
    "info", // SAVE_MIGRATE
    "info", // PROLOG_MIGRATE
    "info",  // PROLOG_RESUME
    "info",  // EPILOG_STOP
    "info", // EPILOG
    "info", // SHUTDOWN
    "info", // CANCEL
    "alert",  // FAILURE
    "info", // CLEANUP_RESUBMIT
    "info",  // UNKNOWN
    "info",  // HOTPLUG
    "info",  // SHUTDOWN_POWEROFF
    "info", // BOOT_UNKNOWN
    "info",  // BOOT_POWEROFF
    "info", // BOOT_SUSPENDED
    "info", // BOOT_STOPPED
    "info", // CLEANUP_DELETE
    "info", // HOTPLUG_SNAPSHOT
    "info",  // HOTPLUG_NIC
    "info", // HOTPLUG_SAVEAS
    "info",  // HOTPLUG_SAVEAS_POWEROFF
    "info", // HOTPLUG_SAVEAS_SUSPENDED
    "info",  // SHUTDOWN_UNDEPLOY
    "info",  // EPILOG_UNDEPLOY
    "info",  // PROLOG_UNDEPLOY
    "info",  // BOOT_UNDEPLOY
    "info",  // HOTPLUG_PROLOG_POWEROFF
    "info",  // HOTPLUG_EPILOG_POWEROFF
    "info", // BOOT_MIGRATE
    "alert", // BOOT_FAILURE
    "alert", // BOOT_MIGRATE_FAILURE
    "alert", // PROLOG_MIGRATE_FAILURE
    "alert", // PROLOG_FAILURE
    "alert", // EPILOG_FAILURE
    "alert",  // EPILOG_STOP_FAILURE
    "alert",  // EPILOG_UNDEPLOY_FAILURE
    "info",  // PROLOG_MIGRATE_POWEROFF
    "alert",  // PROLOG_MIGRATE_POWEROFF_FAILURE
    "info", // PROLOG_MIGRATE_SUSPEND
    "alert", // PROLOG_MIGRATE_SUSPEND_FAILURE
    "alert",  // BOOT_UNDEPLOY_FAILURE
    "alert", // BOOT_STOPPED_FAILURE
    "alert",  // PROLOG_RESUME_FAILURE
    "alert",  // PROLOG_UNDEPLOY_FAILURE
    "info", // DISK_SNAPSHOT_POWEROFF
    "info",  // DISK_SNAPSHOT_REVERT_POWEROFF
    "info",  // DISK_SNAPSHOT_DELETE_POWEROFF
    "info",  // DISK_SNAPSHOT_SUSPENDED
    "info", // DISK_SNAPSHOT_REVERT_SUSPENDED
    "info", // DISK_SNAPSHOT_DELETE_SUSPENDED
    "info",  // DISK_SNAPSHOT
    "info", // DISK_SNAPSHOT_REVERT (deprecated)
    "info", // DISK_SNAPSHOT_DELETE
    "info", // PROLOG_MIGRATE_UNKNOWN
    "alert", // PROLOG_MIGRATE_UNKNOWN_FAILURE
    "info",  // DISK_RESIZE
    "info", // DISK_RESIZE_POWEROFF
    "info", // DISK_RESIZE_UNDEPLOYED
    "info"  // HOTPLUG_NIC_POWEROFF
  ];

  var LCM_STATES = {
    LCM_INIT                        : 0,
    PROLOG                          : 1,
    BOOT                            : 2,
    RUNNING                         : 3,
    MIGRATE                         : 4,
    SAVE_STOP                       : 5,
    SAVE_SUSPEND                    : 6,
    SAVE_MIGRATE                    : 7,
    PROLOG_MIGRATE                  : 8,
    PROLOG_RESUME                   : 9,
    EPILOG_STOP                     : 10,
    EPILOG                          : 11,
    SHUTDOWN                        : 12,
    //CANCEL                        : 13,
    //FAILURE                       : 14,
    CLEANUP_RESUBMIT                : 15,
    UNKNOWN                         : 16,
    HOTPLUG                         : 17,
    SHUTDOWN_POWEROFF               : 18,
    BOOT_UNKNOWN                    : 19,
    BOOT_POWEROFF                   : 20,
    BOOT_SUSPENDED                  : 21,
    BOOT_STOPPED                    : 22,
    CLEANUP_DELETE                  : 23,
    HOTPLUG_SNAPSHOT                : 24,
    HOTPLUG_NIC                     : 25,
    HOTPLUG_SAVEAS                  : 26,
    HOTPLUG_SAVEAS_POWEROFF         : 27,
    HOTPLUG_SAVEAS_SUSPENDED        : 28,
    SHUTDOWN_UNDEPLOY               : 29,
    EPILOG_UNDEPLOY                 : 30,
    PROLOG_UNDEPLOY                 : 31,
    BOOT_UNDEPLOY                   : 32,
    HOTPLUG_PROLOG_POWEROFF         : 33,
    HOTPLUG_EPILOG_POWEROFF         : 34,
    BOOT_MIGRATE                    : 35,
    BOOT_FAILURE                    : 36,
    BOOT_MIGRATE_FAILURE            : 37,
    PROLOG_MIGRATE_FAILURE          : 38,
    PROLOG_FAILURE                  : 39,
    EPILOG_FAILURE                  : 40,
    EPILOG_STOP_FAILURE             : 41,
    EPILOG_UNDEPLOY_FAILURE         : 42,
    PROLOG_MIGRATE_POWEROFF         : 43,
    PROLOG_MIGRATE_POWEROFF_FAILURE : 44,
    PROLOG_MIGRATE_SUSPEND          : 45,
    PROLOG_MIGRATE_SUSPEND_FAILURE  : 46,
    BOOT_UNDEPLOY_FAILURE           : 47,
    BOOT_STOPPED_FAILURE            : 48,
    PROLOG_RESUME_FAILURE           : 49,
    PROLOG_UNDEPLOY_FAILURE         : 50,
    DISK_SNAPSHOT_POWEROFF          : 51,
    DISK_SNAPSHOT_REVERT_POWEROFF   : 52,
    DISK_SNAPSHOT_DELETE_POWEROFF   : 53,
    DISK_SNAPSHOT_SUSPENDED         : 54,
    DISK_SNAPSHOT_REVERT_SUSPENDED  : 55,
    DISK_SNAPSHOT_DELETE_SUSPENDED  : 56,
    DISK_SNAPSHOT                   : 57,
    //DISK_SNAPSHOT_REVERT          : 58,
    DISK_SNAPSHOT_DELETE            : 59,
    PROLOG_MIGRATE_UNKNOWN          : 60,
    PROLOG_MIGRATE_UNKNOWN_FAILURE  : 61,
    DISK_RESIZE                     : 62,
    DISK_RESIZE_POWEROFF            : 63,
    DISK_RESIZE_UNDEPLOYED          : 64,
    HOTPLUG_NIC_POWEROFF            : 65,
    HOTPLUG_RESIZE                  : 66
  };

  var SHORT_LCM_STATES_STR = [
    Locale.tr("LCM_INIT"),  // LCM_INIT
    Locale.tr("PROLOG"),    // PROLOG
    Locale.tr("BOOT"),      // BOOT
    Locale.tr("RUNNING"),   // RUNNING
    Locale.tr("MIGRATE"),   // MIGRATE
    Locale.tr("SAVE"),      // SAVE_STOP
    Locale.tr("SAVE"),      // SAVE_SUSPEND
    Locale.tr("SAVE"),      // SAVE_MIGRATE
    Locale.tr("MIGRATE"),   // PROLOG_MIGRATE
    Locale.tr("PROLOG"),    // PROLOG_RESUME
    Locale.tr("EPILOG"),    // EPILOG_STOP
    Locale.tr("EPILOG"),    // EPILOG
    Locale.tr("SHUTDOWN"),  // SHUTDOWN
    Locale.tr("SHUTDOWN"),  // CANCEL
    Locale.tr("FAILURE"),   // FAILURE
    Locale.tr("CLEANUP"),   // CLEANUP_RESUBMIT
    Locale.tr("UNKNOWN"),   // UNKNOWN
    Locale.tr("HOTPLUG"),   // HOTPLUG
    Locale.tr("SHUTDOWN"),  // SHUTDOWN_POWEROFF
    Locale.tr("BOOT"),      // BOOT_UNKNOWN
    Locale.tr("BOOT"),      // BOOT_POWEROFF
    Locale.tr("BOOT"),      // BOOT_SUSPENDED
    Locale.tr("BOOT"),      // BOOT_STOPPED
    Locale.tr("CLEANUP"),   // CLEANUP_DELETE
    Locale.tr("SNAPSHOT"),  // HOTPLUG_SNAPSHOT
    Locale.tr("HOTPLUG"),   // HOTPLUG_NIC
    Locale.tr("HOTPLUG"),   // HOTPLUG_SAVEAS
    Locale.tr("HOTPLUG"),   // HOTPLUG_SAVEAS_POWEROFF
    Locale.tr("HOTPLUG"),   // HOTPLUG_SAVEAS_SUSPENDED
    Locale.tr("SHUTDOWN"),  // SHUTDOWN_UNDEPLOY
    Locale.tr("EPILOG"),    // EPILOG_UNDEPLOY
    Locale.tr("PROLOG"),    // PROLOG_UNDEPLOY
    Locale.tr("BOOT"),      // BOOT_UNDEPLOY
    Locale.tr("HOTPLUG"),   // HOTPLUG_PROLOG_POWEROFF
    Locale.tr("HOTPLUG"),   // HOTPLUG_EPILOG_POWEROFF
    Locale.tr("BOOT"),      // BOOT_MIGRATE
    Locale.tr("FAILURE"),   // BOOT_FAILURE
    Locale.tr("FAILURE"),   // BOOT_MIGRATE_FAILURE
    Locale.tr("FAILURE"),   // PROLOG_MIGRATE_FAILURE
    Locale.tr("FAILURE"),   // PROLOG_FAILURE
    Locale.tr("FAILURE"),   // EPILOG_FAILURE
    Locale.tr("FAILURE"),   // EPILOG_STOP_FAILURE
    Locale.tr("FAILURE"),   // EPILOG_UNDEPLOY_FAILURE
    Locale.tr("MIGRATE"),   // PROLOG_MIGRATE_POWEROFF
    Locale.tr("FAILURE"),   // PROLOG_MIGRATE_POWEROFF_FAILURE
    Locale.tr("MIGRATE"),   // PROLOG_MIGRATE_SUSPEND
    Locale.tr("FAILURE"),   // PROLOG_MIGRATE_SUSPEND_FAILURE
    Locale.tr("FAILURE"),   // BOOT_UNDEPLOY_FAILURE
    Locale.tr("FAILURE"),   // BOOT_STOPPED_FAILURE
    Locale.tr("FAILURE"),   // PROLOG_RESUME_FAILURE
    Locale.tr("FAILURE"),   // PROLOG_UNDEPLOY_FAILURE
    Locale.tr("SNAPSHOT"),  // DISK_SNAPSHOT_POWEROFF
    Locale.tr("SNAPSHOT"),  // DISK_SNAPSHOT_REVERT_POWEROFF
    Locale.tr("SNAPSHOT"),  // DISK_SNAPSHOT_DELETE_POWEROFF
    Locale.tr("SNAPSHOT"),  // DISK_SNAPSHOT_SUSPENDED
    Locale.tr("SNAPSHOT"),  // DISK_SNAPSHOT_REVERT_SUSPENDED
    Locale.tr("SNAPSHOT"),  // DISK_SNAPSHOT_DELETE_SUSPENDED
    Locale.tr("SNAPSHOT"),  // DISK_SNAPSHOT
    Locale.tr("SNAPSHOT"),  // DISK_SNAPSHOT_REVERT
    Locale.tr("SNAPSHOT"),  // DISK_SNAPSHOT_DELETE
    Locale.tr("MIGRATE"),   // PROLOG_MIGRATE_UNKNOWN
    Locale.tr("FAILURE"),   // PROLOG_MIGRATE_UNKNOWN_FAILURE
    Locale.tr("DISK_RSZ"),  // DISK_RESIZE
    Locale.tr("DISK_RSZ"),  // DISK_RESIZE_POWEROFF
    Locale.tr("DISK_RSZ"),  // DISK_RESIZE_UNDEPLOYED
    Locale.tr("HOTPLUG"),   // HOTPLUG_NIC_POWEROFF
    Locale.tr("HOTPLUG")    // HOTPLUG_RESIZE
  ];

  var VNC_STATES = [
    LCM_STATES.RUNNING,
    LCM_STATES.MIGRATE,
    LCM_STATES.SHUTDOWN,
    LCM_STATES.CANCEL,
    LCM_STATES.UNKNOWN,
    LCM_STATES.HOTPLUG,
    LCM_STATES.SHUTDOWN_POWEROFF,
    LCM_STATES.HOTPLUG_SNAPSHOT,
    LCM_STATES.HOTPLUG_NIC,
    LCM_STATES.HOTPLUG_SAVEAS,
    LCM_STATES.HOTPLUG_SAVEAS_POWEROFF,
    LCM_STATES.HOTPLUG_SAVEAS_SUSPENDED,
    LCM_STATES.SHUTDOWN_UNDEPLOY,
    LCM_STATES.DISK_SNAPSHOT,
    LCM_STATES.DISK_SNAPSHOT_REVERT,
    LCM_STATES.DISK_RESIZE
  ];

  var RDP_STATES = [
    LCM_STATES.RUNNING
  ];

  var EXTERNAL_IP_ATTRS = [
    "GUEST_IP",
    "GUEST_IP_ADDRESSES",
    "AWS_IP_ADDRESS",
    "AWS_PUBLIC_IP_ADDRESS",
    "AWS_PRIVATE_IP_ADDRESS",
    "AZ_IPADDRESS",
    "SL_PRIMARYIPADDRESS"
  ];

  var NIC_ALIAS_IP_ATTRS = [
    "IP",
    "IP6",
    "IP6_GLOBAL",
    "IP6_ULA",
    "VROUTER_IP",
    "VROUTER_IP6_GLOBAL",
    "VROUTER_IP6_ULA"
  ];

  var EXTERNAL_NETWORK_ATTRIBUTES = [
    "GUEST_IP",
    "GUEST_IP_ADDRESSES",
    "AWS_IP_ADDRESS",
    "AWS_DNS_NAME",
    "AWS_PUBLIC_IP_ADDRESS",
    "AWS_PUBLIC_DNS_NAME",
    "AWS_PRIVATE_IP_ADDRESS",
    "AWS_PRIVATE_DNS_NAME",
    "AWS_SECURITY_GROUPS",
    "AZ_IPADDRESS",
    "SL_PRIMARYIPADDRESS"
  ];

  var MIGRATE_ACTION_STR = [
    "none",                // NONE_ACTION            = 0
    "migrate",             // MIGRATE_ACTION         = 1
    "live-migrate",        // LIVE_MIGRATE_ACTION    = 2
    "shutdown",            // //SHUTDOWN_ACTION        = 3
    "shutdown-hard",       // //SHUTDOWN_HARD_ACTION   = 4
    "undeploy",            // UNDEPLOY_ACTION        = 5
    "undeploy-hard",       // UNDEPLOY_HARD_ACTION   = 6
    "hold",                // HOLD_ACTION            = 7
    "release",             // RELEASE_ACTION         = 8
    "stop",                // STOP_ACTION            = 9
    "suspend",             // SUSPEND_ACTION         = 10
    "resume",              // RESUME_ACTION          = 11
    "boot",                // //BOOT_ACTION            = 12
    "delete",              // DELETE_ACTION          = 13
    "delete-recreate",     // DELETE_RECREATE_ACTION = 14
    "reboot",              // REBOOT_ACTION          = 15
    "reboot-hard",         // REBOOT_HARD_ACTION     = 16
    "resched",             // RESCHED_ACTION         = 17
    "unresched",           // UNRESCHED_ACTION       = 18
    "poweroff",            // POWEROFF_ACTION        = 19
    "poweroff-hard",       // POWEROFF_HARD_ACTION   = 20
    "disk-attach",         // DISK_ATTACH_ACTION     = 21
    "disk-detach",         // DISK_DETACH_ACTION     = 22
    "nic-attach",          // NIC_ATTACH_ACTION      = 23
    "nic-detach",          // NIC_DETACH_ACTION      = 24
    "snap-create",         // DISK_SNAPSHOT_CREATE_ACTION = 25
    "snap-delete",         // DISK_SNAPSHOT_DELETE_ACTION = 26
    "terminate",           // TERMINATE_ACTION       = 27
    "terminate-hard",      // TERMINATE_HARD_ACTION  = 28
    "disk-resize",         // DISK_RESIZE_ACTION     = 29
    "deploy",              // DEPLOY_ACTION          = 30
    "chown",               // CHOWN_ACTION           = 31
    "chmod",               // CHMOD_ACTION           = 32
    "updateconf",          // UPDATECONF_ACTION      = 33
    "rename",              // RENAME_ACTION          = 34
    "resize",              // RESIZE_ACTION          = 35
    "update",              // UPDATE_ACTION          = 36
    "snapshot-create",     // SNAPSHOT_CREATE_ACTION = 37
    "snapshot-delete",     // SNAPSHOT_DELETE_ACTION = 38
    "snapshot-revert",     // SNAPSHOT_REVERT_ACTION = 39
    "disk-saveas",         // DISK_SAVEAS_ACTION     = 40
    "disk-snapshot-revert",// DISK_SNAPSHOT_REVERT_ACTION = 41
    "recover",             // RECOVER_ACTION         = 42
    "retry",               // RETRY_ACTION           = 43
    "monitor",             // MONITOR_ACTION         = 44
  ];

  var VM = {
    "resource": RESOURCE,
    "create": function(params) {
      OpenNebulaAction.create(params, RESOURCE);
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
    "terminate": function(params) {
      var action_obj = {"hard": false};
      OpenNebulaAction.simple_action(params, RESOURCE, "terminate", action_obj);
    },
    "terminate_hard" : function(params) {
      var action_obj = {"hard": true};
      OpenNebulaAction.simple_action(params, RESOURCE, "terminate", action_obj);
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
    "suspend": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "suspend");
    },
    "resume": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "resume");
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
    "reboot": function(params) {
      var action_obj = {"hard": false};
      OpenNebulaAction.simple_action(params, RESOURCE, "reboot", action_obj);
    },
    "reboot_hard" : function(params) {
      var action_obj = {"hard": true};
      OpenNebulaAction.simple_action(params, RESOURCE, "reboot", action_obj);
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
    "migrate_poff": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "migrate_poff", action_obj);
    },
    "migrate_poff_hard": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "migrate_poff_hard", action_obj);
    },
    "disk_saveas": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "disk_saveas", action_obj);
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
    "disk_snapshot_create": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "disk_snapshot_create", action_obj);
    },
    "disk_snapshot_revert": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "disk_snapshot_revert", action_obj);
    },
    "disk_snapshot_rename": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "disk_snapshot_rename", action_obj);
    },
    "disk_snapshot_delete": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "disk_snapshot_delete", action_obj);
    },
    "vnc" : function(params, startstop) {
      var callback = params.success;
      var callback_error = params.error;
      var id = params.data.id;
      var resource = RESOURCE;

      var method = startstop;
      var request = OpenNebulaHelper.request(resource, method, params.data);
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
    "guac" : function(params) {
      var callback = params.success;
      var callback_error = params.error;
      var id = params.data.id;
      var typeConnection = params.data.extra_param;
      var resource = RESOURCE;

      var request = OpenNebulaHelper.request(resource, null, params.data);
      $.ajax({
        url: "vm/" + id + "/guac/" + typeConnection,
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
    "vmrc" : function(params) {
      var callback = params.success;
      var callback_error = params.error;
      var id = params.data.id;
      var resource = RESOURCE;

      var request = OpenNebulaHelper.request(resource, null, params.data);
      $.ajax({
        url: "vm/" + id + "/startvmrc",
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
    "append": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param, append : true};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "update": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "updateconf": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "updateconf", action_obj);
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
    "disk_resize" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "disk_resize", action_obj);
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
      OpenNebulaAction.simple_action(params, RESOURCE, "save_as_template", action_obj);
    },
    "lock" : function(params) {
      OpenNebulaAction.lock(params, RESOURCE);
    },
    "unlock" : function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "unlock");
    },
    "stateStr": function(stateId) {
      return STATES_STR[stateId];
    },
    "stateClass": function(stateId) {
      return STATES_CLASSES[stateId];
    },
    "STATES": STATES,
    "lcmStateStr": function(stateId) {
      return LCM_STATES_STR[stateId];
    },
    "lcmStateClass": function(stateId) {
      return LCM_STATES_CLASSES[stateId];
    },
    "LCM_STATES": LCM_STATES,
    "shortLcmStateStr": function(stateId) {
      return SHORT_LCM_STATES_STR[stateId];
    },
    "isFailureState": function(lcmStateId) {
      switch(parseInt(lcmStateId)){
        case LCM_STATES.BOOT_FAILURE:
        case LCM_STATES.BOOT_MIGRATE_FAILURE:
        case LCM_STATES.PROLOG_MIGRATE_FAILURE:
        case LCM_STATES.PROLOG_FAILURE:
        case LCM_STATES.EPILOG_FAILURE:
        case LCM_STATES.EPILOG_STOP_FAILURE:
        case LCM_STATES.EPILOG_UNDEPLOY_FAILURE:
        case LCM_STATES.PROLOG_MIGRATE_POWEROFF_FAILURE:
        case LCM_STATES.PROLOG_MIGRATE_SUSPEND_FAILURE:
        case LCM_STATES.BOOT_UNDEPLOY_FAILURE:
        case LCM_STATES.BOOT_STOPPED_FAILURE:
        case LCM_STATES.PROLOG_RESUME_FAILURE:
        case LCM_STATES.PROLOG_UNDEPLOY_FAILURE:
        case LCM_STATES.PROLOG_MIGRATE_UNKNOWN_FAILURE:
          return true;

        default:
          return false;
      }
    },
    "hostnameStr": function(element) {
      var state = element.STATE;
      var hostname = "--";
      if (state == STATES.ACTIVE || state == STATES.SUSPENDED || state == STATES.POWEROFF) {
        var history = retrieveLastHistoryRecord(element);
        if (history) {
          hostname = history.HOSTNAME;
        };
      };

      return hostname;
    },
    "hostnameStrLink": function(element) {
      var state = element.STATE;
      var hostname = "--";
      if (state == STATES.ACTIVE || state == STATES.SUSPENDED || state == STATES.POWEROFF) {
        var history = retrieveLastHistoryRecord(element);
        if (history) {
          hostname = Navigation.link(history.HOSTNAME, "hosts-tab", history.HID);
        };
      };

      return hostname;
    },
    "clusterStr": function(element) {
      var state = element.STATE;
      var cluster = "--";
      if (state == STATES.ACTIVE || state == STATES.SUSPENDED || state == STATES.POWEROFF) {
        var history = retrieveLastHistoryRecord(element);
        if (history) {
          cluster = history.CID;
        };
      };

      return OpenNebulaCluster.getName(cluster);
    },
    "migrateActionStr": function(stateId) {
      return MIGRATE_ACTION_STR[stateId];
    },
    "ipsStr": ipsStr,
    "ipsDropdown": ipsDropdown,
    "groupByIpsStr": groupByIpsStr,
    "aliasStr": aliasStr,
    "retrieveExternalIPs": retrieveExternalIPs,
    "retrieveExternalNetworkAttrs": retrieveExternalNetworkAttrs,
    "isNICGraphsSupported": isNICGraphsSupported,
    "isDiskGraphsSupported": isDiskGraphsSupported,
    "isNICAttachSupported": isNICAttachSupported,
    "isVNCSupported": isVNCSupported,
    "isConnectionSupported": isConnectionSupported,
    "isVMRCSupported": isVMRCSupported,
    "isSPICESupported": isSPICESupported,
    "isWFileSupported": isWFileSupported,
    "hasConnection": hasConnection,
    "buttonVnc": buttonVnc,
    "buttonSpice": buttonSpice,
    "buttonWFile": buttonWFile,
    "dropdownRDP": dropdownRDP,
    "buttonSSH": buttonSSH,
    "getName": function(id){
      return OpenNebulaAction.getName(id, RESOURCE);
    }
  };

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
    var history = retrieveLastHistoryRecord(element);
    if (history) {
      return $.inArray(history.VM_MAD, ["az"]) == -1;
    } else {
      return false;
    }
  }

   function isDiskGraphsSupported(element) {
    var history = retrieveLastHistoryRecord(element);
    if (history) {
      return $.inArray(history.VM_MAD, ["ec2","az"]) == -1;
    } else {
      return false;
    }
  }

  function isNICAttachSupported(element) {
    var history = retrieveLastHistoryRecord(element);
    if (history) {
      return $.inArray(history.VM_MAD, ["ec2", "az"]) == -1;
    } else {
      return false;
    }
  }

  function retrieveExternalIPs(element) {
    var monitoring = element.MONITORING;
    var ips = {};
    var externalIP;

    $.each(EXTERNAL_IP_ATTRS, function(index, IPAttr) {
      externalIP = monitoring[IPAttr];
      if (externalIP) {
        ips[IPAttr] = externalIP;
      }
    });

    return ips;
  }

  function retrieveExternalNetworkAttrs(element) {
    var ips = {};
    var externalAttr;

    var monitoring = element.MONITORING;
    if (monitoring) {
      $.each(EXTERNAL_NETWORK_ATTRIBUTES, function(index, attr) {
        externalAttr = monitoring[attr];
        if (externalAttr) {
          ips[attr] = externalAttr;
        }
      });
    }

    return ips;
  }

  // Return ALL NICs of a VM
  function getNICs(element){
    var nics = element && element.TEMPLATE && element.TEMPLATE.NIC;
    var pci = element && element.TEMPLATE && element.TEMPLATE.PCI;
    if (nics == undefined || nics == false){
      nics = [];
    }
    if (!$.isArray(nics)) {
      nics = [nics];
    }
    if (pci != undefined || pci != false) {
      if (!$.isArray(pci)) {
        pci = [pci];
      }
      $.each(pci, function(){
        if (this["TYPE"] == "NIC"){
          nics.push(this);
        }
      });
    }
    return nics;
  }

  // Return the IP or several IPs of a VM
  function ipsStr(element, divider, groupStrFunction = groupByIpsStr) {
    var divider = divider || "<br>";
    var nics = getNICs(element);
    var ips = [];
    var monitoring = element && element.MONITORING;
    if (monitoring) {
      var externalIP;
      $.each(EXTERNAL_IP_ATTRS, function(index, IPAttr) {
        externalIP = monitoring[IPAttr];
        if (externalIP) {
          var splitArr = externalIP.split(",");
          $.each(splitArr, function(i,ip){
            if (ip && ($.inArray(ip, ips) == -1)) {
              ips.push(ip);
            }
          });
        }
      });
    }
    
    // infoextended: alias will be group by nic
    return Config.isExtendedVmInfo
      ? groupStrFunction(element, nics)
      : (ips.length == 0 && nics.length > 0)
        ? $.map(nics, function(nic) {
          if (nic["IP"]) {
            return nic["IP"];
          }
          else{
            var ipv6 = "" 
            if (nic["IP6_ULA"]){ 
              ipv6 += nic["IP6_ULA"];
            }
            if (nic["IP6_GLOBAL"]){
              ipv6 = (ipv6 == "") ? "" : ipv6 + "<br>";
              ipv6 += nic["IP6_GLOBAL"];
            }
            return ipv6;
          }
        }).join(divider)
        : "--";
  };

  // Return a dropdown with all the 
  function ipsDropdown(element, divider) {
    var ipsStr = this.ipsStr(element,divider,groupByIpsDropdown);
    var ips = ipsStr.split('<br>');
    var html = "";

    // If its generated by groupByIpsDropdown
    if (~ipsStr.indexOf("li")){
      ips = [] 
      $.each($.parseHTML(ipsStr), function( index ) {
        ips.push($( this ).text());
      });
      ipsStr = "<ul style='list-style-type:none;'>" + ipsStr + "</ul>";
    }
    
    // If it has less than "numIPs" IPs
    var numIPs = 2;
    if ((ips.length < numIPs)) return ipsStr;

    // Take the first x 
    var insideHtml = "";
    for (let i = 0; i < numIPs-1; i++) {
      insideHtml += ips.shift();
      if (i != numIPs-2){insideHtml+="<br>";}
    }

    // Format the other IPs inside a dropdown
    if (ips.length){
      html += '<ul class="dropdown menu ips-dropdown" style=" text-align:left;" data-dropdown-menu><li><a style="padding-top:0em;padding-bottom:0em;padding-left:0em;color:gray">'+insideHtml+'</a><ul class="menu" style="max-height: 50em; overflow: scroll; width:250px;">';
      $.each(ips, function(index, value){
        html+='<li><a style="color:gray">' + value + '</a></li>';
      });
      html+='</ul></li></ul>';
    }

    return  html;
  };

  function groupByIpsDropdown(element = {}, nics = []) {

    // Show the first IP two times for the dropdown.
    var copy_nics = Object.assign([], nics)
    var first_nic = Object.assign({}, nics[0]);
    delete first_nic["ALIAS_IDS"];
    copy_nics.unshift(first_nic);

    return copy_nics.reduce(function(column, nic) {
      identation = '&nbsp;&nbsp;&nbsp;&nbsp;';
      var ip = (nic.IP) ? nic.IP : nic.IP6_ULA + '&#10;&#13;' + identation + nic.IP6_GLOBAL;
      var nicSection = $("<li/>").append($("<a/>").css("color", "gray").html(nic.NIC_ID + ": " + ip));

      if (nic.ALIAS_IDS) {
        nic.ALIAS_IDS.split(",").forEach(function(aliasId) {
          var templateAlias = Array.isArray(element.TEMPLATE.NIC_ALIAS)
            ? element.TEMPLATE.NIC_ALIAS : [element.TEMPLATE.NIC_ALIAS];
          var alias = templateAlias.find(function(alias) { return alias.NIC_ID === aliasId });

          if (alias) {
            var alias_ip = alias.IP ? alias.IP : alias.IP6_ULA + '&#10;&#13;' + identation + '> ' + alias.IP6_GLOBAL;
            nicSection.append($("<li/>").append($("<a/>").css({
              "color": "gray",
              "font-style": "italic",
            }).html(identation + '> ' + alias_ip))) }
        });
      }

      return column.append(nicSection);
    }, $("<div/>")).html()
  };

  function groupByIpsStr(element = {}, nics = []) {
    identation = '&nbsp;&nbsp;&nbsp;&nbsp;';
    return nics.reduce(function(column, nic) {
      var ip = (nic.IP) ? nic.IP : nic.IP6_ULA + '<br>' + identation + nic.IP6_GLOBAL;
      var nicSection = $("<p>").css("margin-bottom", 0).html(nic.NIC_ID + ": " + ip);

      if (nic.ALIAS_IDS) {

        nic.ALIAS_IDS.split(",").forEach(function(aliasId) {
          var templateAlias = Array.isArray(element.TEMPLATE.NIC_ALIAS)
            ? element.TEMPLATE.NIC_ALIAS : [element.TEMPLATE.NIC_ALIAS];
          var alias = templateAlias.find(function(alias) { return alias.NIC_ID === aliasId });

          if (alias) {
            var alias_ip = alias.IP ? alias.IP : alias.IP6_ULA + '<br>' + identation + '> ' + alias.IP6_GLOBAL;
            nicSection.append($("<p/>").css({
              "margin-bottom": 0,
              "font-style": "italic",
            }).html(identation + '> ' + alias_ip)) }
        });
      }

      return column.append(nicSection);
    }, $("<div/>")).html()
  };

  // Return the Alias or several Aliases of a VM
  function aliasStr(element, divider) {
    var divider = divider || "<br>";
    var nic_alias = element.TEMPLATE.NIC_ALIAS;
    var ips = [];

    if (nic_alias == undefined){
      nic_alias = [];
    }

    if (!$.isArray(nic_alias)) {
      nic_alias = [nic_alias];
    }

    if(ips.length==0) {
      $.each(nic_alias, function(index, value) {
        $.each(NIC_ALIAS_IP_ATTRS, function(j, attr){
          if (value[attr]) {
            ips.push(value[attr]);
          }
        });
      });
    }

    if (ips.length > 0) {
      return ips.join(divider);
    } else {
      return "--";
    }
  };

  // returns true if the vnc button should be enabled
  function isVNCSupported(element) {
    return (Config.isTabActionEnabled("vms-tab", "VM.vnc") && graphicSupported(element, "vnc"))
      ? true : false;
  }

  // returns true if the vmrc button should be enabled
  function isVMRCSupported(element) {
    var action_enabled = Config.isTabActionEnabled("vms-tab", "VM.startvmrc");
    var graphics = graphicSupported(element, "vmrc");
    return (action_enabled && graphics)
      ? true : false;
  }

  function isSPICESupported(element) {
    return (Config.isTabActionEnabled("vms-tab", "VM.startspice") && graphicSupported(element, "spice"))
      ? true : false;
  }

  function isWFileSupported(element) {
    var history = retrieveLastHistoryRecord(element);
    return (
      Config.isTabActionEnabled("vms-tab", "VM.save_virt_viewer") && history &&
      (graphicSupported(element, "vnc") || graphicSupported(element, "spice"))
    )
      ? {
        hostname: history.HOSTNAME,
        type: element.TEMPLATE.GRAPHICS.TYPE.toLowerCase(),
        port: element.TEMPLATE.GRAPHICS.PORT || "5901"
      }
      : false;
  }

  /**
   * returns NIC object if the SSH/RDP should be enabled
   * @param {Object} element 
   * @param {String} typeConnection 
   */
  function isConnectionSupported(element, typeConnection) {
    var isEnabled = false;
    if (
      $.inArray(String(typeConnection).toLowerCase(), ['rdp', 'ssh']) > -1 &&
      Config.isTabActionEnabled("vms-tab", "VM."+ String(typeConnection).toLowerCase()) &&
      element && element.TEMPLATE && element.TEMPLATE.GRAPHICS && element.LCM_STATE
    ) {
      var template = element.TEMPLATE;
      var state = parseInt(element.LCM_STATE);

      if ($.inArray(state, RDP_STATES) > -1 && template.NIC) {
        isEnabled = hasConnection(template.NIC, typeConnection);

        if (!isEnabled && template.NIC_ALIAS) {
          isEnabled = hasConnection(template.NIC_ALIAS, typeConnection);
        }
      }
    }

    return isEnabled;
  }

  function hasConnection(nics, typeConnection) {
    typeConnection = String(typeConnection).toUpperCase();
    var activated = false;
    nics = Array.isArray(nics) ? nics : [nics];

    $.each(nics, function(_, nic) {
      if (
        nic[typeConnection] &&
        String(nic[typeConnection]).toLowerCase() === "yes"
      ) {
        activated = nic;
      }
    });

    return activated;
  }

  function graphicSupported(element, type) {
    var rtn = false;
    if (element && element.TEMPLATE && element.TEMPLATE.GRAPHICS && element.LCM_STATE) {
      var graphics = element.TEMPLATE.GRAPHICS;
      var state = parseInt(element.LCM_STATE);
      rtn = graphics &&
        graphics.TYPE &&
        graphics.TYPE.toLowerCase() == type &&
        $.inArray(state, VNC_STATES) != -1;
    }
    return rtn;
  }

  function buttonVnc(id = "") {
    return '<button class="vnc remote-vm" data-id="' + id + '">\
      <i class="fas fa-desktop"></i></button>';
  }

  function buttonSSH(id = "") {
    return '<button class="ssh remote-vm" data-id="' + id + '">\
      <i class="fas fa-terminal"></i></button>';
  }

  function buttonSpice(id = "") {
    return '<button class="spice remote-vm" data-id="' + id + '">\
      <i class="fas fa-desktop"></i></button>';
  }

  function buttonWFile(id = "", data = {}) {
    return '<button class="w-file remote-vm" data-id="' + id + '"\
    data-type="' + data.type + '" data-port="' + data.port + '" data-hostname="' + data.hostname + '">\
      <i class="fas fa-external-link-square-alt"></i></button>';
  }

  function dropdownRDP(id = "", ip = "", vm = {}) {
    return '<ul class="dropdown menu" id="rdp-buttons" data-dropdown-menu> \
      <li>\
        <button type="button" class="remote-vm"> \
          <i class="fab fa-windows"></i> \
        </button>\
        <ul class="menu">\
          <li>' + buttonRDP(id) + '</li> \
          <li>' + buttonSaveRDP(ip, vm) + '</li> \
        </ul>\
      </li>\
   </ul>';
  }

  function buttonRDP(id = "") {
    var styleIcon = 'style="width: 2em;text-align: center;"';
    return '<a class="rdp" data-id="' + id + '"> \
      <i class="fas fa-desktop" ' + styleIcon + '></i><span>' + Locale.tr("HTML") + '</span></a>';
  }

  function buttonSaveRDP(ip = "", vm = {}) {
    var username, password, styleIcon = 'style="width: 2em;text-align: center;"';

    if (vm && vm.TEMPLATE && vm.TEMPLATE.CONTEXT) {
      var context = vm.TEMPLATE.CONTEXT;
      for (var prop in context) {
        var propUpperCase = String(prop).toUpperCase();
        (propUpperCase === "USERNAME") && (username = context[prop]);
        (propUpperCase === "PASSWORD") && (password = context[prop]);
      }
    }
    var button = '<a class="save-rdp" data-name="' + vm.NAME + '" data-ip="' + ip + '"';
    username && (button += ' data-username="' + username + '"');
    password && (button += ' data-password="' + password + '"');
    button += '><i class="fas fa-file" ' + styleIcon + '></i><span>' + Locale.tr("RDP Client") + '</span></a>';

    return button;
  }


  return VM;
});
