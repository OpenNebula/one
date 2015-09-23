/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

  var RESOURCE = "DOCUMENT";
  var PATH = 'service';
  var CACHE_NAME = 'SERVICE'

  var STATES_STR = [
    Locale.tr("PENDING"),
    Locale.tr("DEPLOYING"),
    Locale.tr("RUNNING"),
    Locale.tr("UNDEPLOYING"),
    Locale.tr("WARNING"),
    Locale.tr("DONE"),
    Locale.tr("FAILED_UNDEPLOYING"),
    Locale.tr("FAILED_DEPLOYING"),
    Locale.tr("SCALING"),
    Locale.tr("FAILED_SCALING"),
    Locale.tr("COOLDOWN")
  ];

  var STATES = {
    PENDING             : 0,
    DEPLOYING           : 1,
    RUNNING             : 2,
    UNDEPLOYING         : 3,
    WARNING             : 4,
    DONE                : 5,
    FAILED_UNDEPLOYING  : 6,
    FAILED_DEPLOYING    : 7,
    SCALING             : 8,
    FAILED_SCALING      : 9,
    COOLDOWN            : 10
  };

  var Service = {
    "resource": RESOURCE,
    "del": function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.del(params, RESOURCE, PATH);
    },
    "list" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.list(params, RESOURCE, PATH)
    },
    "show" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.show(params, RESOURCE, false, PATH)
    },
    "chown" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.chown(params, RESOURCE, PATH);
    },
    "chgrp" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.chgrp(params, RESOURCE, PATH);
    },
    "chmod" : function(params) {
      params.cache_name = CACHE_NAME;
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "chmod", action_obj, PATH);
    },
    "shutdown" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.simple_action(params, RESOURCE, "shutdown", null, PATH);
    },
    "recover" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.simple_action(params, RESOURCE, "recover", null, PATH);
    },
    "stateStr" : function(stateId) {
      return STATES_STR[stateId];
    },
    "STATES": STATES,
    "getName": function(id){
      return OpenNebulaAction.getName(id, CACHE_NAME);
    }
  }

  return Service;
})

