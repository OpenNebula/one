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
  var OpenNebulaAction = require('./action');
  var Locale = require('utils/locale');

  var RESOURCE = "IMAGE";
  var STATES_STR = [
    Locale.tr("INIT"),
    Locale.tr("READY"),
    Locale.tr("USED"),
    Locale.tr("DISABLED"),
    Locale.tr("LOCKED"),
    Locale.tr("ERROR"),
    Locale.tr("CLONE"),
    Locale.tr("DELETE"),
    Locale.tr("USED_PERS"),
    Locale.tr("LOCKED_USED"),
    Locale.tr("LOCKED_USED_PERS")
  ];

  var TYPES_STR = [
    Locale.tr("OS"),
    Locale.tr("CDROM"),
    Locale.tr("DATABLOCK"),
    Locale.tr("KERNEL"),
    Locale.tr("RAMDISK"),
    Locale.tr("CONTEXT"),
    Locale.tr("BACKUP")
  ];

  var STATES_COLOR = [
    'off',        // INIT
    'running',    // READY
    'running',    // USED
    'error',      // DISABLED
    'deploying',  // LOCKED
    'error',      // ERROR
    'error',      // CLONE
    'error',      // DELETE
    'error',      // USED_PERS
    'deploying',  // LOCKED_USED
    'error'       // LOCKED_USED_PERS
  ];

  var STATES = {
    INIT      : 0,
    READY     : 1,
    USED      : 2,
    DISABLED  : 3,
    LOCKED    : 4,
    ERROR     : 5,
    CLONE     : 6,
    DELETE    : 7,
    USED_PERS : 8,
    LOCKED_USED : 9,
    LOCKED_USED_PERS : 10
  };

  var TYPES = {
    OS        : 0,
    CDROM     : 1,
    DATABLOCK : 2,
    KERNEL    : 3,
    RAMDISK   : 4,
    CONTEXT   : 5,
    BACKUP    : 6
  };

  var Image = {
    "resource": RESOURCE,
    "stateStr": function(stateId) {
      return STATES_STR[stateId];
    },
    /**
     * @return {String} css class for this state. Use:
     *                  color + '-color' font color class
     */
    "stateColor": function(stateId) {
      return STATES_COLOR[stateId];
    },
    "STATES": STATES,
    "typeStr": function(typeId) {
      return TYPES_STR[typeId];
    },
    "TYPES": TYPES,
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
    "append": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param, append : true};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "update": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "enable": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "enable");
    },
    "disable": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "disable");
    },
    "persistent": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "persistent");
    },
    "nonpersistent": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "nonpersistent");
    },
    "chtype": function(params) {
      var action_obj = {"type" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "chtype", action_obj);
    },
    "clone" : function(params) {
      var action_obj = params.data.extra_param ? params.data.extra_param : {};
      OpenNebulaAction.simple_action(params, RESOURCE, "clone", action_obj);
    },
    "rename" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rename", action_obj);
    },
    "snapshot_flatten": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "snapshot_flatten", action_obj);
    },
    "snapshot_revert": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "snapshot_revert", action_obj);
    },
    "snapshot_delete": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "snapshot_delete", action_obj);
    },
    "getName": function(id){
      return OpenNebulaAction.getName(id, RESOURCE);
    },
    "lock" : function(params) {
      OpenNebulaAction.lock(params, RESOURCE);
    },
    "unlock" : function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "unlock");
    },
    "restore" : function(params) {
      var action_obj = params.data.extra_param ? params.data.extra_param : {};
      OpenNebulaAction.simple_action(params, RESOURCE, "restore", action_obj)
    }
  }

  return Image;
})
