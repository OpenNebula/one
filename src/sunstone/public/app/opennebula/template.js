define(function(require) {
  var OpenNebulaAction = require('./action');

  var RESOURCE = "VMTEMPLATE";

  var Template = {
    "resource": RESOURCE,
    "create" : function(params) {
      OpenNebulaAction.create(params, RESOURCE);
    },
    "del" : function(params) {
      OpenNebulaAction.del(params, RESOURCE);
    },
    "list" : function(params) {
      OpenNebulaAction.list(params, RESOURCE);
    },
    "show" : function(params) {
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
    "update" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "fetch_template" : function(params) {
      OpenNebulaAction.show(params, RESOURCE, "template");
    },
    "publish" : function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "publish");
    },
    "unpublish" : function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "unpublish");
    },
    "instantiate" : function(params) {
      var action_obj = params.data.extra_param ? params.data.extra_param : {};
      OpenNebulaAction.simple_action(params, RESOURCE, "instantiate", action_obj);
    },
    "clone" : function(params) {
      var name = params.data.extra_param ? params.data.extra_param : "";
      var action_obj = {"name" : name};
      OpenNebulaAction.simple_action(params, RESOURCE, "clone", action_obj);
    },
    "rename" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rename", action_obj);
    }
  }

  return Template;
})
