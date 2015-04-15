define(function(require) {
  var OpenNebulaAction = require('./action');
  var OpenNebulaHelper = require('./helper');
  var OpenNebulaError  = require('./error');

  var RESOURCE = "GROUP";

  var Group =  {
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
          // Get the default group quotas
          default_group_quotas = Quotas.default_quotas(response.GROUP_POOL.DEFAULT_GROUP_QUOTAS);

          var list = OpenNebulaHelper.pool(RESOURCE, response)
          var quotas_hash = OpenNebulaHelper.pool_hash_processing(
              'GROUP_POOL', 'QUOTAS', response);

          return callback ?
              callback(request, list, quotas_hash) : null;
        },
        error: function(response) {
          return callback_error ?
              callback_error(request, OpenNebulaError(response)) : null;
        }
      });
    },
    "update": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "set_quota" : function(params) {
      var action_obj = {quotas :  params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "set_quota", action_obj);
    },
    "show" : function(params) {
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
    }
  }

  return Group;
})
