define(function(require) {
  var OpenNebulaAction = require('./action');

  var RESOURCE = "IMAGE";
  var STATES = [
    "INIT",
    "READY",
    "USED",
    "DISABLED",
    "LOCKED",
    "ERROR",
    "CLONE",
    "DELETE",
    "USED_PERS"
  ];

  var TYPES = [
    "OS", 
    "CDROM", 
    "DATABLOCK", 
    "KERNEL", 
    "RAMDISK", 
    "CONTEXT"
  ];

  var Image = {
    "resource": RESOURCE,
    "stateStr": function(stateId) {
      return STATES[stateId];
    },
    "typeStr": function(typeId) {
      return TYPES[typeId];
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
    }
  }

  return Image;
})
