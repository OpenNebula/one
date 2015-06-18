define(function(require) {
  var OpenNebulaAction = require('./action');

  var RESOURCE = "HOST";

  var STATES = [
    "INIT",
   "MONITORING_MONITORED",
   "MONITORED",
   "ERROR",
   "DISABLED",
   "MONITORING_ERROR",
   "MONITORING_INIT",
   "MONITORING_DISABLED"
  ]

  var SIMPLE_STATES = [
    "INIT",
    "UPDATE",
    "ON",
    "ERROR",
    "OFF",
    "RETRY",
    "INIT",
    "OFF"
  ]

  var Host = {
    "resource": RESOURCE,
    "stateStr": function(stateId) {
      return STATES[stateId];
    },
    "simpleStateStr": function(stateId) {
      return SIMPLE_STATES[stateId];
    },
    "create": function(params) {
      OpenNebulaAction.create(params, RESOURCE);
    },
    "del": function(params) {
      OpenNebulaAction.del(params, RESOURCE);
    },
    "list": function(params) {
      OpenNebulaAction.list(params, RESOURCE);
    },
    "list_in_zone" : function(params) {
      OpenNebulaAction.list_in_zone(params, RESOURCE);
    },
    "show": function(params) {
      OpenNebulaAction.show(params, RESOURCE);
    },
    "update": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "fetch_template" : function(params) {
      OpenNebulaAction.show(params, RESOURCE, "template");
    },
    "enable": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "enable");
    },
    "disable": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "disable");
    },
    "monitor" : function(params) {
      OpenNebulaAction.monitor(params, RESOURCE, false);
    },
    "pool_monitor" : function(params) {
      OpenNebulaAction.monitor(params, RESOURCE, true);
    },
    "rename" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rename", action_obj);
    },
    "getName": function(id){
      return OpenNebulaAction.getName(id, RESOURCE);
    }
  }

  return Host;
})
