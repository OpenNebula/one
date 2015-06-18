define(function(require) {

  var QuotaDefaults = require('utils/quotas/quota-defaults');

  var OpenNebulaAction = require('./action'),
      OpenNebulaHelper = require('./helper'),
      OpenNebulaError  = require('./error');

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
      OpenNebulaAction.show(params, RESOURCE);
    },
    "passwd": function(params) {
      var action_obj = {"password": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "passwd", action_obj);
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
    "fetch_template" : function(params) {
      OpenNebulaAction.show(params, RESOURCE, "template");
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