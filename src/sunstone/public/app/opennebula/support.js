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

  var RESOURCE = "REQUEST";
  var PATH = 'support/request';
  var CACHE_NAME = "REQUEST";

  var Support = {
    "resource": RESOURCE,
    "create": function(params) {
      OpenNebulaAction.create(params, RESOURCE, PATH);
    },
    "update": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "update", params.data.extra_param, PATH);
    },
    "list" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.clear_cache(params.cache_name);
      OpenNebulaAction.list(params, RESOURCE, PATH)
    },
    "show" : function(params) {
      OpenNebulaAction.show(params, RESOURCE, false, PATH)
    }
  }

  return Support;
})
