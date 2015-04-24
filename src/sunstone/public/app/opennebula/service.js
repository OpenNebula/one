define(function(require) {
  var OpenNebulaAction = require('./action');

  var RESOURCE = "DOCUMENT";
  var PATH = 'service';
  var CACHE_NAME = 'SERVICE'

  var Service = {
    "resource": RESOURCE,
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
    },
    "shutdown" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.simple_action(params, RESOURCE, "shutdown", null, PATH);
    },
    "recover" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.simple_action(params, RESOURCE, "recover", null, PATH);
    },
    "state" : function(state_int) {
      var state = [
          tr("PENDING"),
          tr("DEPLOYING"),
          tr("RUNNING"),
          tr("UNDEPLOYING"),
          tr("WARNING"),
          tr("DONE"),
          tr("FAILED_UNDEPLOYING"),
          tr("FAILED_DEPLOYING"),
          tr("SCALING"),
          tr("FAILED_SCALING"),
          tr("COOLDOWN")
      ][state_int]
      return state ? state : state_int;
    }
  }

  return Service;
})

