define(function(require) {
  var OpenNebulaAction = require('./action');
  var Locale = require('utils/locale');

  var RESOURCE = "HOST";

  var STATES_STR = [
    Locale.tr("INIT"),
    Locale.tr("MONITORING_MONITORED"),
    Locale.tr("MONITORED"),
    Locale.tr("ERROR"),
    Locale.tr("DISABLED"),
    Locale.tr("MONITORING_ERROR"),
    Locale.tr("MONITORING_INIT"),
    Locale.tr("MONITORING_DISABLED")
  ];

  var SIMPLE_STATES_STR = [
    Locale.tr("INIT"),
    Locale.tr("UPDATE"),
    Locale.tr("ON"),
    Locale.tr("ERROR"),
    Locale.tr("OFF"),
    Locale.tr("RETRY"),
    Locale.tr("INIT"),
    Locale.tr("OFF")
  ];

  var STATES = {
    INIT                 : 0,
    MONITORING_MONITORED : 1,
    MONITORED            : 2,
    ERROR                : 3,
    DISABLED             : 4,
    MONITORING_ERROR     : 5,
    MONITORING_INIT      : 6,
    MONITORING_DISABLED  : 7
  };

  var Host = {
    "resource": RESOURCE,
    "stateStr": function(stateId) {
      return STATES_STR[stateId];
    },
    "simpleStateStr": function(stateId) {
      return SIMPLE_STATES_STR[stateId];
    },
    "STATES": STATES,
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
