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
  var QuotaDefaults = require('utils/quotas/quota-defaults');

  var RESOURCE = "USER";

  var User = {
    "resource": RESOURCE,
    "create": function(params) {
      OpenNebulaAction.create(params, RESOURCE);
    },
    "del": function(params) {
      OpenNebulaAction.del(params, RESOURCE);
    },
    "list": function(params) {
      OpenNebulaAction.list(params, RESOURCE, null, function(response) {
        var list = OpenNebulaHelper.pool(RESOURCE, response);

        QuotaDefaults.setDefaultUserQuotas(
          QuotaDefaults.default_quotas(response.USER_POOL.DEFAULT_USER_QUOTAS)
        );

        // Inject the VM user quota. This info is returned separately in the
        // pool info call, but the userElementArray expects it inside the USER,
        // as it is returned by the individual info call
        var quotas_hash = OpenNebulaHelper.pool_hash_processing(
                                            'USER_POOL', 'QUOTAS', response);

        $.each(list,function(){
          var q = quotas_hash[this[RESOURCE].ID];

          if (q != undefined) {
              this[RESOURCE].VM_QUOTA = q.QUOTAS.VM_QUOTA;
          }
        });

        return list;
      });
    },
    "show" : function(params) {
      var callback = params.success;

      // Before calling the true callback, we update the default quotas
      // included in the .show response
      params.success = function(request, response) {
        QuotaDefaults.setDefaultUserQuotas(
          QuotaDefaults.default_quotas(response.USER.DEFAULT_USER_QUOTAS)
        );

        return callback ? callback(request, response) : null;
      };

      OpenNebulaAction.show(params, RESOURCE);
    },
    "passwd": function(params) {
      var action_obj = {"password": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "passwd", action_obj);
    },
    "login": function(params) {
      var action_obj = {"username": params.data.username,
                        "token": params.data.token,
                        "expire": params.data.expire,
                        "egid": params.data.egid};

      OpenNebulaAction.simple_action(params, RESOURCE, "login", action_obj);
    },
    "chgrp" : function(params) {
      var action_obj = {"group_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "chgrp", action_obj);
    },
    "chauth" : function(params) {
      var action_obj = {"auth_driver" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "chauth", action_obj);
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
    "append": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param, append : true};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "enable_sunstone_two_factor_auth": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "enable_two_factor_auth", action_obj);
    },
    "disable_sunstone_two_factor_auth": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "disable_two_factor_auth", action_obj);
    },
    "enable_sunstone_security_key": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "enable_security_key", action_obj);
    },
    "disable_sunstone_security_key": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "disable_security_key", action_obj);
    },
    "accounting" : function(params) {
      OpenNebulaAction.monitor(params, RESOURCE, false);
    },
    "set_quota" : function(params) {
      var action_obj = {quotas :  params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "set_quota", action_obj);
    },
    "addgroup" : function(params) {
      var action_obj = {"group_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "addgroup", action_obj);
    },
    "delgroup" : function(params) {
      var action_obj = {"group_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "delgroup", action_obj);
    },
    "getName": function(id){
      return OpenNebulaAction.getName(id, RESOURCE);
    }
  };

  return User;
});
