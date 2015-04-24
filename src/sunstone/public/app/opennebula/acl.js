define(function(require) {
  var OpenNebulaAction = require('./action');

  var RESOURCE = "ACL";

  var Acl = {
    "resource": RESOURCE,
    "create" : function(params) {
      OpenNebulaAction.create(params, RESOURCE);
    },
    "del" : function(params) {
      OpenNebulaAction.del(params, RESOURCE);
    },
    "list" : function(params) {
      OpenNebulaAction.list(params, RESOURCE);
    }
  }

  return Acl;
})
