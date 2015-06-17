define(function(require) {
  var Helper = {
    "action": function(action, params) {
      obj = {
        "action": {
          "perform": action
        }
      }
      if (params) {
        obj.action.params = params;
      }
      return obj;
    },

    "request": function(resource, method, data) {
      var r = {
        "request": {
          "resource"  : resource,
          "method"    : method
        }
      }
      if (data) {
        if (typeof(data) != "array") {
          data = [data];
        }
        r.request.data = data;
      }
      return r;
    },

    "pool": function(resource, response) {
      var pool_name = resource + "_POOL";
      var type = resource;
      var pool;

      if (typeof(pool_name) == "undefined") {
        return Error('Incorrect Pool');
      }

      var p_pool = [];

      if (response[pool_name]) {
        pool = response[pool_name][type];
      } else {
        pool = null;
      }

      if (pool == null) {
        return p_pool;
      } else if (pool.length) {
        for (i = 0; i < pool.length; i++) {
          p_pool[i] = {};
          p_pool[i][type] = pool[i];
        }
        return (p_pool);
      } else {
        p_pool[0] = {};
        p_pool[0][type] = pool;
        return (p_pool);
      }
    },

    "pool_hash_processing": function(pool_name, resource_name, response) {
      var pool;

      if (typeof(pool_name) == "undefined") {
        return Error('Incorrect Pool');
      }

      var p_pool = {};

      if (response[pool_name]) {
        pool = response[pool_name][resource_name];
      } else {
        pool = null;
      }

      if (pool == null) {
        return p_pool;
      } else if (pool.length) {
        for (i = 0; i < pool.length; i++) {
          var res = {};
          res[resource_name] = pool[i];

          p_pool[res[resource_name]['ID']] = res;
        }
        return (p_pool);
      } else {
        var res = {};
        res[resource_name] = pool;

        p_pool[res[resource_name]['ID']] = res;

        return (p_pool);
      }
    }
  };

  return Helper;
});
