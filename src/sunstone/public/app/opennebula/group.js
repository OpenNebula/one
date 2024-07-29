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

  var RESOURCE = "GROUP";

  var Group =  {
    "resource": RESOURCE,
    "create": function(params) {
      OpenNebulaAction.create(params, RESOURCE);
    },
    "del": function(params) {
      OpenNebulaAction.del(params, RESOURCE);
    },
    "list": function(params) {
      if (params.options === undefined){
        params.options = { force: true };
      }
      OpenNebulaAction.list(params, RESOURCE, null, function(response) {
        var list = OpenNebulaHelper.pool(RESOURCE, response);

        QuotaDefaults.setDefaultGroupQuotas(
          QuotaDefaults.default_quotas(response.GROUP_POOL.DEFAULT_GROUP_QUOTAS)
        );

        // Inject the VM quota. This info is returned separately in the
        // pool info call, but the elementArray expects it inside the GROUP,
        // as it is returned by the individual info call
        var quotas_hash = OpenNebulaHelper.pool_hash_processing(
                                            'GROUP_POOL', 'QUOTAS', response);

        $.each(list,function(){
          var q = quotas_hash[this[RESOURCE].ID];

          if (q != undefined) {
              this[RESOURCE].VM_QUOTA = q.QUOTAS.VM_QUOTA;
          }
        });

        return list;
      });
    },
    "update": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "append": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param, append : true};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "set_quota" : function(params) {
      var action_obj = {quotas :  params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "set_quota", action_obj);
    },
    "show" : function(params) {
      var callback = params.success;

      // Before calling the true callback, we update the default quotas
      // included in the .show response
      params.success = function(request, response) {
        QuotaDefaults.setDefaultGroupQuotas(
          QuotaDefaults.default_quotas(response.GROUP.DEFAULT_GROUP_QUOTAS)
        );

        return callback ? callback(request, response) : null;
      };

      OpenNebulaAction.show(params, RESOURCE);
    },
    "accounting" : function(params) {
      OpenNebulaAction.monitor(params, RESOURCE, false);
    },
    "add_admin" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "add_admin", action_obj);
    },
    "del_admin" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "del_admin", action_obj);
    },
    "getName": function(id){
      return OpenNebulaAction.getName(id, RESOURCE);
    }
  };

  return Group;
});
