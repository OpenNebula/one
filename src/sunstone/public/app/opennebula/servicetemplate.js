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
  var OpenNebulaAction = require("./action");

  var RESOURCE = "DOCUMENT";
  var PATH = "service_template";
  var CACHE_NAME = "SERVICE_TEMPLATE";

  var ServiceTemplate = {
    "resource": RESOURCE,
    "create": function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.create(params, RESOURCE, PATH);
    },

    "instantiate": function(params) {
      params.cache_name = CACHE_NAME;
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "instantiate", action_obj, PATH);
    },
    "update": function(params) {
      params.cache_name = CACHE_NAME;

      var action_obj = {};

      try {
        JSON.parse(params.data.extra_param);
        action_obj["template_json"] = params.data.extra_param;
      }
      catch(err) {
        action_obj["template_raw"] = params.data.extra_param;
      }

      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj, PATH);
    },
    "append": function(params) {
      params.cache_name = CACHE_NAME;

      var action_obj = {};

      try {
        JSON.parse(params.data.extra_param);
        action_obj["template_json"] = params.data.extra_param;
      }
      catch(err) {
        action_obj["template_raw"] = params.data.extra_param;
      }

      action_obj["append"] = true;

      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj, PATH);
    },
    "update_labels": function(params) {
      params.cache_name = CACHE_NAME;
      var action_obj = {"template_raw" : params.data.extra_param, append : true};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj, PATH);
    },
    "del": function(params) {
      params.cache_name = CACHE_NAME;
      var action_obj = params.data.extra_param;
      OpenNebulaAction.del(params, RESOURCE, PATH, action_obj);
    },
    "list" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.list(params, RESOURCE, PATH);
    },
    "show" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.show(params, RESOURCE, false, PATH);
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
    "rename" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rename", action_obj, PATH);
    },
    "clone" : function(params) {
      var name = params.data.extra_param ? params.data.extra_param.name : "";
      var mode = params.data.extra_param ? params.data.extra_param.mode : "none";
      var action_obj = {"name" : name, "recursive": mode};
      OpenNebulaAction.simple_action(params, RESOURCE, "clone", action_obj, PATH);
    },
    "getName": function(id){
      return OpenNebulaAction.getName(id, CACHE_NAME);
    }
  };

  return ServiceTemplate;
});
