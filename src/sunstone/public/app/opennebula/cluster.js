/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

  var RESOURCE = "CLUSTER";

  var Cluster = {
    "resource": RESOURCE,
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
    "addhost" : function(params) {
      var action_obj = {"host_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "addhost", action_obj);
    },
    "delhost" : function(params) {
      var action_obj = {"host_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "delhost", action_obj);
    },
    "adddatastore" : function(params) {
      var action_obj = {"ds_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "adddatastore", action_obj);
    },
    "deldatastore" : function(params) {
      var action_obj = {"ds_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "deldatastore", action_obj);
    },
    "addvnet" : function(params) {
      var action_obj = {"vnet_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "addvnet", action_obj);
    },
    "delvnet" : function(params) {
      var action_obj = {"vnet_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "delvnet", action_obj);
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
    "getName": function(id){
      return OpenNebulaAction.getName(id, RESOURCE);
    }
  }

  return Cluster;
})
