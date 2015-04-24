define(function(require) {
  var OpenNebulaAction = require('./action');

  var RESOURCE = "CLUSTER";

  var Cluster = {
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
    "list_in_zone" : function(params) {
      OpenNebulaAction.list_in_zone(params, RESOURCE);
    },
    "show" : function(params) {
      OpenNebulaAction.show(params, RESOURCE);
    },
    "addhost" : function(params) {
      var action_obj = {"host_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "addhost", action_obj);
    },
    "delhost" : function(params) {
      var action_obj = {"host_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "delhost", action_obj);
    },
    "adddatastore" : function(params) {
      var action_obj = {"ds_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "adddatastore", action_obj);
    },
    "deldatastore" : function(params) {
      var action_obj = {"ds_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "deldatastore", action_obj);
    },
    "addvnet" : function(params) {
      var action_obj = {"vnet_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "addvnet", action_obj);
    },
    "delvnet" : function(params) {
      var action_obj = {"vnet_id": params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "delvnet", action_obj);
    },
    "fetch_template" : function(params) {
      OpenNebulaAction.show(params, RESOURCE, "template");
    },
    "update" : function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "rename" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rename", action_obj);
    }
  }

  return Cluster;
})
