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

  var RESOURCE = "MARKETPLACEAPP";

  var STATES_STR = [
    Locale.tr("INIT"),
    Locale.tr("READY"),
    Locale.tr("LOCKED"),
    Locale.tr("ERROR"),
    Locale.tr("DISABLED")
  ];

  var TYPES_STR = [
    Locale.tr("UNKNOWN"),
    Locale.tr("IMAGE"),
    Locale.tr("VMTEMPLATE"),
    Locale.tr("SERVICE_TEMPLATE")
  ];

  var STATES = {
    INIT : 0,
    READY : 1,
    LOCKED : 2,
    ERROR : 3,
    DISABLED : 4
  };

  var BUTTON_DEPENDENT_STATES = [
    STATES.INIT,
    STATES.READY,
  ];

  var TYPES = {
    UNKNOWN : 0,
    IMAGE : 1,
    VMTEMPLATE : 2,
    SERVICE_TEMPLATE : 3
  };

  var MarketPlaceApp = {
    "resource": RESOURCE,
    "stateStr": function(stateId) {
      return STATES_STR[stateId];
    },
    "STATES": STATES,
    "BUTTON_DEPENDENT_STATES": BUTTON_DEPENDENT_STATES,
    "typeStr": function(typeId) {
      return TYPES_STR[typeId];
    },
    "TYPES": TYPES,
    "create" : function(params) {
      OpenNebulaAction.create(params, RESOURCE);
    },
    "del" : function(params) {
      OpenNebulaAction.del(params, RESOURCE);
    },
    "list" : function(params) {
      OpenNebulaAction.list(params, RESOURCE);
    },
    "list_in_zone" : function(params) {
      OpenNebulaAction.list_in_zone(params, RESOURCE);
    },
    "show" : function(params) {
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
    "update" : function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "append": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param, append : true};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "rename" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rename", action_obj);
    },
    "export" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "export", action_obj);
    },
    "enable": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "enable");
    },
    "disable": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "disable");
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
    "tags" : function(params) {
      OpenNebulaAction.getAppTags(params, RESOURCE)
    },
    "import_vm_template" : function(params){
      var action_obj = params.data.extra_param;
      OpenNebulaAction.importMarketApp(params, RESOURCE, "vm-template.import", action_obj);
    },
    "import_service_template" : function(params){
      var action_obj = params.data.extra_param;
      OpenNebulaAction.importMarketApp(params, RESOURCE, "service_template.import", action_obj);
    },
  }

  return MarketPlaceApp;
})
