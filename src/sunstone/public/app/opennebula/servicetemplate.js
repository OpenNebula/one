define(function(require) {
  var OpenNebulaAction = require('./action');

  var RESOURCE = "DOCUMENT";
  var PATH = 'service_template';
  var CACHE_NAME = CACHE_NAME;

  var ServiceTemplate = {
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
      var action_obj = {"template_json" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj, PATH);
    },
    "del": function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.del(params, RESOURCE, PATH);
    },
    "list" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.list(params, RESOURCE, PATH)
    },
    "show" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.show(params, RESOURCE, false, PATH)
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
    }
  }

  return ServiceTemplate;
})
