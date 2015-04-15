define(function(require) {
  var OpenNebulaAction = require('./action');

  var RESOURCE = "REQUEST";
  var PATH = 'support/request';
  var CACHE_NAME = "REQUEST";

  var Support = {
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
