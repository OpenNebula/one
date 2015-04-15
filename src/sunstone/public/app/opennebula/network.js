define(function(require) {
  var OpenNebulaAction = require('./action');

  var RESOURCE = "VNET";

  var Network =  {
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
    "publish": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "publish");
    },
    "unpublish": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "unpublish");
    },
    "hold" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "hold", action_obj);
    },
    "release" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "release", action_obj);
    },
    "add_ar" : function(params) {
      var action_obj = {"ar_template" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "add_ar", action_obj);
    },
    "rm_ar" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rm_ar", action_obj);
    },
    "update_ar": function(params) {
      var action_obj = {"ar_template" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update_ar", action_obj);
    },
    "reserve": function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "reserve", action_obj);
    },
    "update": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "fetch_template" : function(params) {
      OpenNebulaAction.show(params, RESOURCE, "template");
    },
    "rename" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rename", action_obj);
    }
  }

  return Network;
})
