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

  var QuotaDefaults = require('utils/quotas/quota-defaults');
  var OpenNebulaAction = require('./action');
  var OpenNebulaHelper = require('./helper');
  var OpenNebulaError  = require('./error');

  var RESOURCE = "VM_GROUP";

  var VMGroup =  {
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
    "chmod" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "chmod", action_obj);
    },
    "update": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "del": function(params) {
      OpenNebulaAction.del(params, RESOURCE);
    },
    "getName": function(id){
      return OpenNebulaAction.getName(id, RESOURCE);
    },
    "lock" : function(params) {
      OpenNebulaAction.lock(params, RESOURCE);
    },
    "unlock" : function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "unlock");
    }
  };

  return VMGroup;
});
