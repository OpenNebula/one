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
  var OpenNebulaAction = require("./action"),
    OpenNebulaHelper = require("./helper"),
    OpenNebulaError  = require("./error");
    OpenNebulaCluster = require("./cluster"),
    OpenNebulaDS = require("./datastore"),
    Locale = require("utils/locale"),
    Config = require("sunstone-config"),
    Navigation = require("utils/navigation"),
    OpenNebulaHost = require("opennebula/host");


  var RESOURCE = "VM";
  var VM_MONITORING_CACHE_NAME = "VM.MONITORING";

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
    "HOTPLUG_RESIZE",
    "HOTPLUG_SAVEAS_UNDEPLOYED",
    "HOTPLUG_SAVEAS_STOPPED",
    "BACKUP",
    "BACKUP_POWEROFF",
    "RESTORE"
  ];

  var LCM_STATES_CLASSES = [
    "info",    // LCM_INIT
    "info",    // PROLOG
    "info",    // BOOT
    "success", // RUNNING
    "info",    // MIGRATE
    "info",    // SAVE_STOP
    "info",    // SAVE_SUSPEND
    "info",    // SAVE_MIGRATE
    "info",    // PROLOG_MIGRATE
    "info",    // PROLOG_RESUME
    "info",    // EPILOG_STOP
    "info",    // EPILOG
    "info",    // SHUTDOWN
    "info",    // CANCEL
    "alert",   // FAILURE
    "info",    // CLEANUP_RESUBMIT
    "info",    // UNKNOWN
    "info",    // HOTPLUG
    "info",    // SHUTDOWN_POWEROFF
    "info",    // BOOT_UNKNOWN
    "info",    // BOOT_POWEROFF
    "info",    // BOOT_SUSPENDED
    "info",    // BOOT_STOPPED
    "info",    // CLEANUP_DELETE
    "info",    // HOTPLUG_SNAPSHOT
    "info",    // HOTPLUG_NIC
    "info",    // HOTPLUG_SAVEAS
    "info",    // HOTPLUG_SAVEAS_POWEROFF
    "info",    // HOTPLUG_SAVEAS_SUSPENDED
    "info",    // SHUTDOWN_UNDEPLOY
    "info",    // EPILOG_UNDEPLOY
    "info",    // PROLOG_UNDEPLOY
    "info",    // BOOT_UNDEPLOY
    "info",    // HOTPLUG_PROLOG_POWEROFF
    "info",    // HOTPLUG_EPILOG_POWEROFF
    "info",    // BOOT_MIGRATE
    "alert",   // BOOT_FAILURE
    "alert",   // BOOT_MIGRATE_FAILURE
    "alert",   // PROLOG_MIGRATE_FAILURE
    "alert",   // PROLOG_FAILURE
    "alert",   // EPILOG_FAILURE
    "alert",   // EPILOG_STOP_FAILURE
    "alert",   // EPILOG_UNDEPLOY_FAILURE
    "info",    // PROLOG_MIGRATE_POWEROFF
    "alert",   // PROLOG_MIGRATE_POWEROFF_FAILURE
    "info",    // PROLOG_MIGRATE_SUSPEND
    "alert",   // PROLOG_MIGRATE_SUSPEND_FAILURE
    "alert",   // BOOT_UNDEPLOY_FAILURE
    "alert",   // BOOT_STOPPED_FAILURE
    "alert",   // PROLOG_RESUME_FAILURE
    "alert",   // PROLOG_UNDEPLOY_FAILURE
    "info",    // DISK_SNAPSHOT_POWEROFF
    "info",    // DISK_SNAPSHOT_REVERT_POWEROFF
    "info",    // DISK_SNAPSHOT_DELETE_POWEROFF
    "info",    // DISK_SNAPSHOT_SUSPENDED
    "info",    // DISK_SNAPSHOT_REVERT_SUSPENDED
    "info",    // DISK_SNAPSHOT_DELETE_SUSPENDED
    "info",    // DISK_SNAPSHOT
    "info",    // DISK_SNAPSHOT_REVERT (deprecated)
    "info",    // DISK_SNAPSHOT_DELETE
    "info",    // PROLOG_MIGRATE_UNKNOWN
    "alert",   // PROLOG_MIGRATE_UNKNOWN_FAILURE
    "info",    // DISK_RESIZE
    "info",    // DISK_RESIZE_POWEROFF
    "info",    // DISK_RESIZE_UNDEPLOYED
    "info",    // HOTPLUG_NIC_POWEROFF
    "info",    // HOTPLUG_RESIZE
    "info",    // HOTPLUG_SAVEAS_UNDEPLOYED
    "info",    // HOTPLUG_SAVEAS_STOPPED
    "info",    // BACKUP
    "info",    // BACKUP_POWEROFF
    "info",    // RESTORE
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
    HOTPLUG_RESIZE                  : 66,
    HOTPLUG_SAVEAS_UNDEPLOYED       : 67,
    HOTPLUG_SAVEAS_STOPPED          : 68,
    BACKUP                          : 69,
    BACKUP_POWEROFF                 : 70,
    RESTORE                         : 71,
  };

  var SHORT_LCM_STATES_STR = [
    Locale.tr("LCM_INIT"),        // LCM_INIT
    Locale.tr("PROLOG"),          // PROLOG
    Locale.tr("BOOT"),            // BOOT
    Locale.tr("RUNNING"),         // RUNNING
    Locale.tr("MIGRATE"),         // MIGRATE
    Locale.tr("SAVE"),            // SAVE_STOP
    Locale.tr("SAVE"),            // SAVE_SUSPEND
    Locale.tr("SAVE"),            // SAVE_MIGRATE
    Locale.tr("MIGRATE"),         // PROLOG_MIGRATE
    Locale.tr("PROLOG"),          // PROLOG_RESUME
    Locale.tr("EPILOG"),          // EPILOG_STOP
    Locale.tr("EPILOG"),          // EPILOG
    Locale.tr("SHUTDOWN"),        // SHUTDOWN
    Locale.tr("SHUTDOWN"),        // CANCEL
    Locale.tr("FAILURE"),         // FAILURE
    Locale.tr("CLEANUP"),         // CLEANUP_RESUBMIT
    Locale.tr("UNKNOWN"),         // UNKNOWN
    Locale.tr("HOTPLUG"),         // HOTPLUG
    Locale.tr("SHUTDOWN"),        // SHUTDOWN_POWEROFF
    Locale.tr("BOOT"),            // BOOT_UNKNOWN
    Locale.tr("BOOT"),            // BOOT_POWEROFF
    Locale.tr("BOOT"),            // BOOT_SUSPENDED
    Locale.tr("BOOT"),            // BOOT_STOPPED
    Locale.tr("CLEANUP"),         // CLEANUP_DELETE
    Locale.tr("SNAPSHOT"),        // HOTPLUG_SNAPSHOT
    Locale.tr("HOTPLUG"),         // HOTPLUG_NIC
    Locale.tr("HOTPLUG"),         // HOTPLUG_SAVEAS
    Locale.tr("HOTPLUG"),         // HOTPLUG_SAVEAS_POWEROFF
    Locale.tr("HOTPLUG"),         // HOTPLUG_SAVEAS_SUSPENDED
    Locale.tr("SHUTDOWN"),        // SHUTDOWN_UNDEPLOY
    Locale.tr("EPILOG"),          // EPILOG_UNDEPLOY
    Locale.tr("PROLOG"),          // PROLOG_UNDEPLOY
    Locale.tr("BOOT"),            // BOOT_UNDEPLOY
    Locale.tr("HOTPLUG"),         // HOTPLUG_PROLOG_POWEROFF
    Locale.tr("HOTPLUG"),         // HOTPLUG_EPILOG_POWEROFF
    Locale.tr("BOOT"),            // BOOT_MIGRATE
    Locale.tr("FAILURE"),         // BOOT_FAILURE
    Locale.tr("FAILURE"),         // BOOT_MIGRATE_FAILURE
    Locale.tr("FAILURE"),         // PROLOG_MIGRATE_FAILURE
    Locale.tr("FAILURE"),         // PROLOG_FAILURE
    Locale.tr("FAILURE"),         // EPILOG_FAILURE
    Locale.tr("FAILURE"),         // EPILOG_STOP_FAILURE
    Locale.tr("FAILURE"),         // EPILOG_UNDEPLOY_FAILURE
    Locale.tr("MIGRATE"),         // PROLOG_MIGRATE_POWEROFF
    Locale.tr("FAILURE"),         // PROLOG_MIGRATE_POWEROFF_FAILURE
    Locale.tr("MIGRATE"),         // PROLOG_MIGRATE_SUSPEND
    Locale.tr("FAILURE"),         // PROLOG_MIGRATE_SUSPEND_FAILURE
    Locale.tr("FAILURE"),         // BOOT_UNDEPLOY_FAILURE
    Locale.tr("FAILURE"),         // BOOT_STOPPED_FAILURE
    Locale.tr("FAILURE"),         // PROLOG_RESUME_FAILURE
    Locale.tr("FAILURE"),         // PROLOG_UNDEPLOY_FAILURE
    Locale.tr("SNAPSHOT"),        // DISK_SNAPSHOT_POWEROFF
    Locale.tr("SNAPSHOT"),        // DISK_SNAPSHOT_REVERT_POWEROFF
    Locale.tr("SNAPSHOT"),        // DISK_SNAPSHOT_DELETE_POWEROFF
    Locale.tr("SNAPSHOT"),        // DISK_SNAPSHOT_SUSPENDED
    Locale.tr("SNAPSHOT"),        // DISK_SNAPSHOT_REVERT_SUSPENDED
    Locale.tr("SNAPSHOT"),        // DISK_SNAPSHOT_DELETE_SUSPENDED
    Locale.tr("SNAPSHOT"),        // DISK_SNAPSHOT
    Locale.tr("SNAPSHOT"),        // DISK_SNAPSHOT_REVERT
    Locale.tr("SNAPSHOT"),        // DISK_SNAPSHOT_DELETE
    Locale.tr("MIGRATE"),         // PROLOG_MIGRATE_UNKNOWN
    Locale.tr("FAILURE"),         // PROLOG_MIGRATE_UNKNOWN_FAILURE
    Locale.tr("DISK_RSZ"),        // DISK_RESIZE
    Locale.tr("DISK_RSZ"),        // DISK_RESIZE_POWEROFF
    Locale.tr("DISK_RSZ"),        // DISK_RESIZE_UNDEPLOYED
    Locale.tr("HOTPLUG"),         // HOTPLUG_NIC_POWEROFF
    Locale.tr("HOTPLUG"),         // HOTPLUG_RESIZE
    Locale.tr("HOTPLUG"),         // HOTPLUG_SAVEAS_UNDEPLOYED
    Locale.tr("HOTPLUG"),         // HOTPLUG_SAVEAS_STOPPED
    Locale.tr("BACKUP"),          // BACKUP
    Locale.tr("BACKUP"),          // BACKUP_POWEROFF
    Locale.tr("RESTORE"),         // RESTORE
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
    LCM_STATES.DISK_RESIZE,
    LCM_STATES.BACKUP
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
    "VROUTER_IP6_ULA",
  ];

  var EXTERNAL_NETWORK_ATTRS = EXTERNAL_IP_ATTRS.concat([
    "AWS_DNS_NAME",
    "AWS_PUBLIC_DNS_NAME",
    "AWS_PRIVATE_DNS_NAME",
    "AWS_SECURITY_GROUPS"
  ]);

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
      var vm_id = params.data.id;
      var resource = RESOURCE;

      var request = OpenNebulaHelper.request(resource, null, params.data);
      $.ajax({
        url: "vm/" + vm_id + "/startvmrc",
        type: "POST",
        dataType: "JSON",
        success: function(vminfo) {
          var fireege_route = Config.publicFireedgeEndpoint.endsWith('/fireedge') ? '' : '/fireedge'
          $.ajax({
            url: Config.publicFireedgeEndpoint + fireege_route + "/api/vcenter/token/" + vm_id,
            type: "GET",
            headers: {"Authorization": fireedge_token},
            success: function(token) {
              token.info = vminfo.info;
              return callback ? callback(request, token) : null;
            },
            error: function(response) {
              return callback_error ?
                  callback_error(request, OpenNebulaError(response)) : null;
            }
          });

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
      if (!Config.isExtendedVmMonitoring) return;

      let process = function(response) {
        let monitoringPool = response && response["MONITORING_DATA"] && response["MONITORING_DATA"]["MONITORING"];

        return Array.isArray(monitoringPool)
          ? monitoringPool.reduce(function(result, monitoringVM) {
            return $.extend(result, { [monitoringVM.ID]: monitoringVM });
          }, {})
          : monitoringPool;
      };

      OpenNebulaAction.list(params, VM_MONITORING_CACHE_NAME, "vm/monitor", process, undefined, false);
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
    "updatenic" : function(params) {
      var action_obj = params.data.extra_param
      OpenNebulaAction.simple_action(params, RESOURCE, "updatenic", action_obj);
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
      return hostnameStr(element);
    },
    "hostnameStrLink": function(element) {
      return hostnameStr(element, true);
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
    "datastoreStr": function(element) {
      var state = element.STATE;
      var datastore = "--";
      if (state == STATES.ACTIVE || state == STATES.SUSPENDED || state == STATES.POWEROFF) {
        var history = retrieveLastHistoryRecord(element);
        if (history) {
          datastore = history.DS_ID;
        };
      };

      return OpenNebulaDS.getName(datastore);
    },
    "migrateActionStr": function(stateId) {
      return MIGRATE_ACTION_STR[stateId];
    },
    "groupByIpsStr": groupByIpsStr,
    "hasConnection": hasConnection,
    "ipsDropdown": ipsDropdown,
    "ipsStr": ipsStr,
    "getSshWithPortForwarding": getSshWithPortForwarding,
    "isConnectionSupported": isConnectionSupported,
    "isDiskGraphsSupported": isDiskGraphsSupported,
    "isNICAttachSupported": isNICAttachSupported,
    "isNICGraphsSupported": isNICGraphsSupported,
    "isSPICESupported": isSPICESupported,
    "isVMRCSupported": isVMRCSupported,
    "isVNCSupported": isVNCSupported,
    "isWFileSupported": isWFileSupported,
    "promiseGetVm" : _promiseGetVm,
    "retrieveExternalIPs": retrieveExternalIPs,
    "retrieveExternalNetworkAttrs": retrieveExternalNetworkAttrs,
    "getName": function(id){
      return OpenNebulaAction.getName(id, RESOURCE);
    },
    "isvCenterVM": isVCenterVM,
    "sched_action_add" : function(params) {
      var action_obj = {"sched_template": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "sched_action_add", action_obj);
    },
    "sched_action_update" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "sched_action_update", action_obj);
    },
    "sched_action_delete" : function(params) {
      var action_obj = { "sched_id" : params.data.extra_param };
      OpenNebulaAction.simple_action(params, RESOURCE, "sched_action_delete", action_obj);
    },
    "attachsg" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "sg_attach", action_obj);
    },
    "detachsg" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "sg_detach", action_obj);
    },
    "getHypervisor": getHypervisor,
    "backup": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "backup", action_obj)
    }
  };

  function hostnameStr(element, navigationLink = false) {
    var state = element.STATE;
    var hostname = "--";
    if (state == STATES.ACTIVE || state == STATES.SUSPENDED || state == STATES.POWEROFF) {
      var history = retrieveLastHistoryRecord(element);
      if (history) {
        hostname = navigationLink
          ? Navigation.link(history.HOSTNAME, "hosts-tab", history.HID)
          : history.HOSTNAME;
      };
    };

    return hostname;
  }

  function getSshWithPortForwarding(vm = {}, navigationLink = false) {
    var nics = vm.TEMPLATE && vm.TEMPLATE.NIC || [];

    var nic = $.grep(nics, function (v) {
      return v.EXTERNAL_PORT_RANGE !== undefined;
    })[0];

    if (nic) {
      var ip = "<b>" + hostnameStr(vm, navigationLink) + "</b>";
      var externalPortRange = "<b>" + nic.EXTERNAL_PORT_RANGE + "</b>";
      var internalPortRange = "<b>" + nic.INTERNAL_PORT_RANGE.split("/")[0].replace("-", ":") + "</b>";

      return ip + " ports " + externalPortRange + " forwarded to VM ports " + internalPortRange;
    }
  }

  function _promiseGetVm(options = {}) {
    options = $.extend({
      id: "",
      async: true
    }, options);

    return $.ajax({
      url: "vm/" + options.id,
      type: "GET",
      success: function(response) {
        if (typeof options.success === "function") {
          var vm =  response ? response[RESOURCE] : undefined;
          options.success(vm);
        }
      },
      async: options.async
    });
  }

  function _getMonitoringPool() {
    var monitoring = undefined;
    var cache = OpenNebulaAction.cache(VM_MONITORING_CACHE_NAME);

    if (cache && cache.data) {
      monitoring = cache.data;
    }

    if ($.isEmptyObject(monitoring)) {
      VM.pool_monitor({
        success: function(response) {
          monitoring = response;
        }
      });
    }

    return monitoring || {};
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
    return retrieveExternalAttr(element, EXTERNAL_IP_ATTRS);
  }

  function retrieveExternalNetworkAttrs(element) {
    return retrieveExternalAttr(element, EXTERNAL_NETWORK_ATTRS);
  }

  function retrieveExternalAttr(element, attr_array) {
    var ips = {};
    var externalAttr;
    var monitoring = element.MONITORING;

    if (monitoring) {
      $.each(attr_array, function(_, attr) {
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
    if (!Array.isArray(nics)) {
      nics = [nics];
    }
    if (pci != undefined || pci != false) {
      if (!Array.isArray(pci)) {
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

  function getNicsFromMonitoring(element = {}) {
    let monitoringPool = _getMonitoringPool();
    let monitoringVM = monitoringPool[element.ID] || monitoringPool;

    if (!monitoringPool || $.isEmptyObject(monitoringPool) || !monitoringVM) return [];

    return EXTERNAL_IP_ATTRS.reduce(function(externalNics, attr) {
      let monitoringValues = monitoringVM[attr];

      if (monitoringValues) {
        $.each(monitoringValues.split(","), function(_, ip) {
          let exists = externalNics.some(function(nic) { return nic.IP === ip; });

          if (!exists) {
            externalNics.push({ NIC_ID: "_", IP: ip });
          }
        });
      }

      return externalNics;
    }, []);
  }

  // Return the IP or several IPs of a VM
  function ipsStr(element, options) {
    options = $.extend({
      defaultValue: "--",
      divider: "<br>",
      groupStrFunction: groupByIpsStr,
      forceGroup: false
    }, options);

    var nics = getNICs(element);
    var nicsFromMonitoring = getNicsFromMonitoring(element);
    var nicExternal = retrieveExternalIPs(element);

    nics = nics.concat(nicsFromMonitoring, nicExternal);

    // infoextended: alias will be group by nic
    if (Config.isExtendedVmInfo || options.forceGroup) {
      return options.groupStrFunction(element, nics);
    }

    return $.map(nics, function(nic) {
      return $.map(NIC_ALIAS_IP_ATTRS, function(attribute) {
        return nic[attribute];
      });
    }).join(options.divider) || options.defaultValue;
  };

  // Return dropdown with all the IPs
  function ipsDropdown(element, divider) {
    var ipsHtml = this.ipsStr(element, { divider, groupStrFunction: groupByIpsDropdown, forceGroup: true });
    var ips = [];

    $.each($.parseHTML(ipsHtml), function(index, element) {
      if (!ips.includes($( this ).text()) && $( this ).text() !== "")
        ips.push($( this ).text());
    });

    if (ips.length === 0)
      return "<p style=\"white-space:nowrap;margin-bottom:0;\">--</p>";
    else if (ips.length === 1)
      return "<p style=\"white-space:nowrap;margin-bottom:0;\">"+ips[0]+"</p>";

    var sshWithPortForwarding = getSshWithPortForwarding(element) || "";
    var firstIP = ipsHtml.split("<end_first_ip>")[0];
    ipsHtml = ipsHtml.split("<end_first_ip>")[1];
    ipsHtml =
      "<ul class='dropdown-menu-css'>" +
        "<li>" +
          "<div>"+
            firstIP +
          "</div>" +
        "</li>" +
        "<li class='menu-hide upper'>" +
          "<ul>" +
            ipsHtml +
          "</ul>" +
          "<span style='white-space: nowrap;font-style: italic;'>" +
            sshWithPortForwarding +
          "</span>" +
        "</li>" +
      "</ul>";
    return ipsHtml;
  };

  function orderNICs(nics){
    // The external IPs must be first
    var external_nics = [];
    var non_external_nics = [];

    nics.forEach(function(nic, index){
     if (nic.EXTERNAL_IP || nic.IP || nic.IP6 || nic.IP6_GLOBAL || nic.IP6_ULA || nic.MAC){
        var copy_nic = Object.assign({}, nic);
        if (nic.EXTERNAL_IP){
          external_nics.push(nic);
          delete copy_nic.EXTERNAL_IP;
        }

        non_external_nics.push(copy_nic);
      }
    });

    return external_nics.concat(non_external_nics);
  }

  function groupByIpsDropdown(element = {}, nics = []) {
    var all_nics = orderNICs(nics);

    // Show the first IP two times for the dropdown.
    var copy_nics = Object.assign([], all_nics);

    var first_nic = Object.assign({}, all_nics[0]);
    delete first_nic["ALIAS_IDS"];
    copy_nics.unshift(first_nic);
    var first = true;
    var identation = "&nbsp;&nbsp;&nbsp;&nbsp;";

    return copy_nics.reduce(function(column, nic) {
      if (first){
        if (nic.EXTERNAL_IP || nic.IP || nic.IP6 || nic.IP6_GLOBAL || nic.IP6_ULA || nic.MAC) {
          var ip;
          if (nic.EXTERNAL_IP) {
	          ip = nic.EXTERNAL_IP
          }
          else {
	          var ips = [];

	          if (nic.IP)
		          ips.push(nic.IP)

	          if (nic.IP6)
	          	  ips.push(nic.IP6)
	          else if (nic.IP6_ULA && nic.IP6_GLOBAL)
	          	  ips.push(nic.IP6_ULA + "&#10;&#13;" + identation + nic.IP6_GLOBAL)
	          else if (nic.IP6_GLOBAL)
	          	  ips.push(nic.IP6_GLOBAL)

	          if (ips.length == 0 && nic.MAC)
	          	  ips.push(nic.MAC)

              // show only first one
	          ip = ips[0]
	          if (ips.length > 1)
	            // this ensure showing dropdown on the vms list datatable
	          	ip += "&#10;&#13;"
          }


          nic_and_ip = nic.NIC_ID + ": " + ip;
          if (nic.EXTERNAL_IP)
            nic_and_ip = "<span style='color: gray; font-weight: bold;'>" + nic_and_ip + "</span>";
          column.append(nic_and_ip + "<end_first_ip>");
          first=false;
        }
      }
      else{
        if (nic.EXTERNAL_IP || nic.IP || nic.IP6 || nic.IP6_GLOBAL || nic.IP6_ULA || nic.MAC) {
          var ip;
          var nicSection = $("<a/>").css("color", "gray");

          if (nic.EXTERNAL_IP) {
            ip = nic.EXTERNAL_IP;
            nicSection.css("font-weight", "bold");
          }
          else{
            var ips = [];

	        if (nic.IP)
		        ips.push(nic.IP)

	        if (nic.IP6)
	        	ips.push(nic.IP6)
	        else if (nic.IP6_ULA && nic.IP6_GLOBAL)
	        	ips.push(nic.IP6_ULA + "&#10;&#13;" + identation + nic.IP6_GLOBAL)
	        else if (nic.IP6_GLOBAL)
	        	ips.push(nic.IP6_GLOBAL)

	        if (ips.length == 0 && nic.MAC)
	        	ips.push(nic.MAC)

	        ip = ips.join(", ")
          }

          nicSection.html(nic.NIC_ID + ": " + ip);

          column.append($("<li/>").append(nicSection));

          if (nic.ALIAS_IDS) {
            nic.ALIAS_IDS.split(",").forEach(function(aliasId) {
              var templateAlias = Array.isArray(element.TEMPLATE.NIC_ALIAS)
                ? element.TEMPLATE.NIC_ALIAS
                : [element.TEMPLATE.NIC_ALIAS];

              var alias = templateAlias.find(function(alias) {
                return alias.NIC_ID === aliasId;
              });

              if (alias) {
				var alias_ip;
                var alias_ips = [];

                if (alias.IP)
                    alias_ips.push(alias.IP)

                if (alias.IP6)
                    alias_ips.push(alias.IP6)
                else if (alias.IP6_ULA && alias.IP6_GLOBAL)
                    alias_ips.push(alias.IP6_ULA + "&#10;&#13;" + identation + "> " + alias.IP6_GLOBAL)
                else if (alias.IP6_GLOBAL)
                    alias_ips.push(alias.IP6_GLOBAL)

				alias_ip = alias_ips.join(", ")

                if (alias_ip){
                  column.append($("<li/>").append($("<a/>").css({
                    "color": "gray",
                    "font-style": "italic",
                  }).html(identation + "> " + alias_ip)));
                }

              }
            });
          }
        }
      }

      return column;
    }, $("<div/>")).html();
  };

  function groupByIpsStr(element = {}, nics = []) {

    var all_nics = orderNICs(nics);

    var identation = "&nbsp;&nbsp;&nbsp;&nbsp;";

    return all_nics.reduce(function(column, nic) {
      if (nic.EXTERNAL_IP || nic.IP || nic.IP6 || nic.MAC || nic.IP6_GLOBAL || nic.IP6_ULA) {
        var ip;

        var nicSection = $("<p/>")
          .css("color", "#0a0a0a")
          .css("margin-bottom", 0);

        if (nic.EXTERNAL_IP){
          ip = nic.EXTERNAL_IP;
          nicSection.css("font-weight","bold");
        }
        else {
          var ips = [];

          if (nic.IP)
	          ips.push(nic.IP)

          if (nic.IP6)
          	  ips.push(nic.IP6)
          else if (nic.IP6_ULA && nic.IP6_GLOBAL)
          	  ips.push(nic.IP6_ULA + "<br>" + identation + nic.IP6_GLOBAL)
          else if (nic.IP6_GLOBAL)
          	  ips.push(nic.IP6_GLOBAL)

          if (ips.length == 0 && nic.MAC)
          	  ips.push(nic.MAC)

          ip = ips.join(", ")
        }

        nicSection.html(nic.NIC_ID + ": " + ip);

        column.append(nicSection);

        if (nic.ALIAS_IDS) {
          nic.ALIAS_IDS.split(",").forEach(function(aliasId) {
            var templateAlias = Array.isArray(element.TEMPLATE.NIC_ALIAS)
              ? element.TEMPLATE.NIC_ALIAS
              : [element.TEMPLATE.NIC_ALIAS];

            var alias = templateAlias.find(function(alias) { return alias.NIC_ID === aliasId; });

              if (alias) {
	            var alias_ip;
                var alias_ips = [];

                if (alias.IP)
                    alias_ips.push(alias.IP)

                if (alias.IP6)
                    alias_ips.push(alias.IP6)
                else if (alias.IP6_ULA && alias.IP6_GLOBAL)
                    alias_ips.push(alias.IP6_ULA + "<br>" + identation + "> " + alias.IP6_GLOBAL)
                else if (alias.IP6_GLOBAL)
                    alias_ips.push(alias.IP6_GLOBAL)

				alias_ip = identation + "> " + alias_ips.join(", ")

                if (alias_ip){
                  column.append($("<p/>").css({
                    "margin-bottom": 0,
                    "font-style": "italic"
                  }).html(alias_ip));
                }
            }
          });
        }
      }

      return column;
    }, $("<div/>")).html();
  };

  function isVNCSupported(element = {}) {
    var actionEnabled = Config.isTabActionEnabled("vms-tab", "VM.vnc");
    var vncSupported = graphicSupported(element, "vnc");

    return actionEnabled && vncSupported;
  }

  function isVCenterVM(element = {}){
    return Boolean(element.USER_TEMPLATE &&
      String(element.USER_TEMPLATE.HYPERVISOR).toLowerCase() === "vcenter");
  }

  function isKvmVm(history){
    return history && history.VM_MAD && String(history.VM_MAD).toLowerCase() === "kvm";
  }

  function isVMRCSupported(element = {}) {
    var actionEnabled = Config.isTabActionEnabled("vms-tab", "VM.startvmrc");
    var vmrcSupported = graphicSupported(element, "vnc");

    return actionEnabled && vmrcSupported && isVCenterVM(element);
  }

  function isSPICESupported(element = {}) {
    var actionEnabled = Config.isTabActionEnabled("vms-tab", "VM.startspice");
    var spiceSupported = graphicSupported(element, "spice");

    return actionEnabled && spiceSupported;
  }

  function isWFileSupported(element = {}) {
    var history = retrieveLastHistoryRecord(element);
    var actionEnabled = Config.isTabActionEnabled("vms-tab", "VM.save_virt_viewer");
    var vncSupported = graphicSupported(element, "vnc");
    var spiceSupported = graphicSupported(element, "spice");
    var isKVM = isKvmVm(history);

    return (actionEnabled && history && (vncSupported || spiceSupported) && isKVM)
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
      $.inArray(String(typeConnection).toLowerCase(), ["rdp", "ssh"]) > -1 &&
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
        activated = nic.EXTERNAL_IP || nic.IP;
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
        graphics.TYPE.toLowerCase() === type &&
        $.inArray(state, VNC_STATES) !== -1;
    }
    return rtn;
  }

  /**
   * This functions gets the VM hypervisor based on the VM history.
   *
   * @param {Object} template: VM template
   * @returns {String} VM hypervisor based on HISTORY.
   */
  function getHypervisor(template) {
    var history = template.HISTORY_RECORDS && template.HISTORY_RECORDS.HISTORY;

    if (!Array.isArray(history)){
      history = [history];
    }

    currentHistory = history.reduce(function(prev, current) {
      return (prev.SEQ > current.SEQ) ? prev : current;
    });

    return currentHistory.VM_MAD;
  }

  return VM;
});
