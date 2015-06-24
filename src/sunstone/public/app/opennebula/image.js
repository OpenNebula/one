define(function(require) {
  var OpenNebulaAction = require('./action');

  var RESOURCE = "IMAGE";
  var STATES_STR = [
    Locale.tr("INIT"),
    Locale.tr("READY"),
    Locale.tr("USED"),
    Locale.tr("DISABLED"),
    Locale.tr("LOCKED"),
    Locale.tr("ERROR"),
    Locale.tr("CLONE"),
    Locale.tr("DELETE"),
    Locale.tr("USED_PERS")
  ];

  var TYPES_STR = [
    Locale.tr("OS"),
    Locale.tr("CDROM"),
    Locale.tr("DATABLOCK"),
    Locale.tr("KERNEL"),
    Locale.tr("RAMDISK"),
    Locale.tr("CONTEXT")
  ];

  var STATES = {
    INIT      : 0,
    READY     : 1,
    USED      : 2,
    DISABLED  : 3,
    LOCKED    : 4,
    ERROR     : 5,
    CLONE     : 6,
    DELETE    : 7,
    USED_PERS : 8
  };

  var TYPES = {
    OS        : 0,
    CDROM     : 1,
    DATABLOCK : 2,
    KERNEL    : 3,
    RAMDISK   : 4,
    CONTEXT   : 5
  };

  var Image = {
    "resource": RESOURCE,
    "stateStr": function(stateId) {
      return STATES_STR[stateId];
    },
    "STATES": STATES,
    "typeStr": function(typeId) {
      return TYPES_STR[typeId];
    },
    "TYPES": TYPES,
    "create": function(params) {
      OpenNebulaAction.create(params, RESOURCE);
    },
    "del": function(params) {
      OpenNebulaAction.del(params, RESOURCE);
    },
    "list": function(params) {
      OpenNebulaAction.list(params, RESOURCE);
    },
    "show": function(params) {
      OpenNebulaAction.show(params, RESOURCE);
    },
    "chown" : function(params) {
      OpenNebulaAction.chown(params, RESOURCE);
    },
    "chgrp" : function(params) {
      OpenNebulaAction.chgrp(params, RESOURCE);
    },
    "chmod" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "chmod", action_obj);
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
    "persistent": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "persistent");
    },
    "nonpersistent": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "nonpersistent");
    },
    "chtype": function(params) {
      var action_obj = {"type" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "chtype", action_obj);
    },
    "clone" : function(params) {
      var action_obj = params.data.extra_param ? params.data.extra_param : {};
      OpenNebulaAction.simple_action(params, RESOURCE, "clone", action_obj);
    },
    "rename" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rename", action_obj);
    },
    "getName": function(id){
      return OpenNebulaAction.getName(id, RESOURCE);
    }
  }

  return Image;
})
