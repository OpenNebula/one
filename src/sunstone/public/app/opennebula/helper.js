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
  var Helper = {
    "action": function(action, params) {
      obj = {
        "action": {
          "perform": action
        }
      }
      if (params) {
        obj.action.params = params;
      }
      return obj;
    },

    "request": function(resource, method, data) {
      var r = {
        "request": {
          "resource"  : resource,
          "method"    : method
        }
      }
      if (data) {
        if (!(data instanceof Array)) {
          data = [data];
        }
        r.request.data = data;
      }
      return r;
    },

    "pool": function(resource, response) {
      var pool_name = resource + "_POOL";
      var type = resource;
      var pool;

      if (typeof(pool_name) == "undefined") {
        return Error('Incorrect Pool');
      }

      var p_pool = [];

      if (response[pool_name]) {
        pool = response[pool_name][type];
      } else {
        pool = null;
      }

      if (pool == null) {
        return p_pool;
      } else if (pool.length) {
        for (i = 0; i < pool.length; i++) {
          p_pool[i] = {};
          p_pool[i][type] = pool[i];
        }
        return (p_pool);
      } else {
        p_pool[0] = {};
        p_pool[0][type] = pool;
        return (p_pool);
      }
    },

    "pool_hash_processing": function(pool_name, resource_name, response) {
      var pool;

      if (typeof(pool_name) == "undefined") {
        return Error('Incorrect Pool');
      }

      var p_pool = {};

      if (response[pool_name]) {
        pool = response[pool_name][resource_name];
      } else {
        pool = null;
      }

      if (pool == null) {
        return p_pool;
      } else if (pool.length) {
        for (i = 0; i < pool.length; i++) {
          var res = {};
          res[resource_name] = pool[i];

          p_pool[res[resource_name]['ID']] = res;
        }
        return (p_pool);
      } else {
        var res = {};
        res[resource_name] = pool;

        p_pool[res[resource_name]['ID']] = res;

        return (p_pool);
      }
    },

    "pool_name_processing": function(pool_name, resource_name, response) {
      var pool;

      if (typeof(pool_name) == "undefined") {
        return Error('Incorrect Pool');
      }

      var p_pool = {};

      if (response[pool_name]) {
        pool = response[pool_name][resource_name];
      } else {
        pool = null;
      }

      if (pool == null) {
        return p_pool;
      } else if (pool.length) {
        for (i = 0; i < pool.length; i++) {
          var res = pool[i];

          p_pool[res['ID']] = res['NAME'];
        }
        return (p_pool);
      } else {
        var res = pool;

        p_pool[res['ID']] = res['NAME'];

        return (p_pool);
      }
    }
  };

  return Helper;
});
