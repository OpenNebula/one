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
  var OpenNebulaHelper = require('./helper');

  var RESOURCE = "BACKUPJOB";

  var Backupjobs = {
    "resource": RESOURCE,
    "start": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "backup");
    },
    "cancel": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "cancel");
    },
    "chgrp" : function(params) {
      OpenNebulaAction.chgrp(params, RESOURCE);
    },
    "chmod" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "chmod", action_obj);
    },
    "chown" : function(params) {
      OpenNebulaAction.chown(params, RESOURCE);
    },
    "create" : function(params) {
      OpenNebulaAction.create(params, RESOURCE);
    },
    "del" : function(params) {
      OpenNebulaAction.del(params, RESOURCE);
    },
    "list" : function(params) {
      if (params.options === undefined){
        params.options = { force: true };
      }
      OpenNebulaAction.list(params, RESOURCE, null, function(response) {
        var list = OpenNebulaHelper.pool(RESOURCE, response);

        return list;
      });
    },
    "lock" : function(params) {
      OpenNebulaAction.lock(params, RESOURCE);
    },
    "unlock" : function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "unlock");
    },
    "show" : function(params) {
      OpenNebulaAction.show(params, RESOURCE);
    },
    "update" : function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "rename" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rename", action_obj);
    },
    "retry" : function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "retry");
    },
    "priority" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "priority", action_obj);
    },
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
    "getName": function(id){
      return OpenNebulaAction.getName(id, RESOURCE);
    }
  }

  return Backupjobs;
})
