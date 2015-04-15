define(function(require) {
  var OpenNebulaAction = require('./action'),
      OpenNebulaHelper = require('./helper'),
      OpenNebulaError  = require('./error');

  var RESOURCE = "USER";

  var User = {
    "create": function(params) {
      OpenNebulaAction.create(params, RESOURCE);
    },
    "del": function(params) {
      OpenNebulaAction.del(params, RESOURCE);
    },
    "list": function(params) {
      var req_path = RESOURCE.toLowerCase();
      var callback = params.success;
      var callback_error = params.error;
      var timeout = params.timeout || false;
      var request = OpenNebulaHelper.request(RESOURCE, "list");

      $.ajax({
        url: req_path,
        type: "GET",
        data: {timeout: timeout},
        dataType: "json",
        success: function(response) {
          default_user_quotas = Quotas.default_quotas(response.USER_POOL.DEFAULT_USER_QUOTAS);

          var list = OpenNebulaHelper.pool(RESOURCE, response)
          var quotas_hash = OpenNebulaHelper.pool_hash_processing(
              'USER_POOL', 'QUOTAS', response);

          return callback ?
              callback(request, list, quotas_hash) : null;
        },
        error: function(response) {
          return callback_error ?
              callback_error(request, OpenNebulaError(response)) : null;
        }
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
    }
  }

  return User;
})
