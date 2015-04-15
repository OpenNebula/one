define(function(require) {
  var OpenNebulaHelper = require('./helper');

  var listCache = {};
  var listWaiting = {};
  var listCallbacks = {};

  var CACHE_EXPIRE = 60000; //ms

  var clearCache = function(cache_name) {
    listCache[cache_name] = null;
    //console.log(cache_name+" cache cleaned");
  }

  var Action = {
    "create": function(params, resource, path) {
      var callback = params.success;
      var callbackError = params.error;
      var data = params.data;
      var request = OpenNebulaHelper.request(resource, "create", data);
      var reqPath = path ? path : resource.toLowerCase();
      var cache_name = params.cache_name ? params.cache_name : resource;

      $.ajax({
        url: reqPath,
        type: "POST",
        dataType: "json",
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        success: function(response) {
          clearCache(cache_name);

          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebula.Error(response)) : null;
        }
      });
    },

    "del": function(params, resource, path) {
      var callback = params.success;
      var callbackError = params.error;
      var id = params.data.id;
      var request = OpenNebulaHelper.request(resource, "delete", id);
      var reqPath = path ? path : resource.toLowerCase();
      var cache_name = params.cache_name ? params.cache_name : resource;

      $.ajax({
        url: reqPath + "/" + id,
        type: "DELETE",
        success: function() {
          clearCache(cache_name);

          return callback ? callback(request) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebula.Error(response)) : null;
        }
      });
    },

    "list": function(params, resource, path) {
      var callback = params.success;
      var callbackError = params.error;
      var timeout = params.timeout || false;
      var request = OpenNebulaHelper.request(resource, "list");
      var reqPath = path ? path : resource.toLowerCase();
      var cache_name = params.cache_name ? params.cache_name : resource;

      var options = params.options;
      var force = false;
      if (options) {
        force = options.force;
      }

      if (force) {
        clearCache(cache_name);
      }

      if (!force &&
          listCache[cache_name] &&
          listCache[cache_name]["timestamp"] + CACHE_EXPIRE > new Date().getTime()) {

        //console.log(cache_name+" list. Cache used");

        return callback ?
            callback(request, listCache[cache_name]["data"]) : null;
      }

      // TODO: Because callbacks are queued, we may need to force a
      // timeout. Otherwise a blocked call cannot be retried.

      if (!listCallbacks[cache_name]) {
        listCallbacks[cache_name] = [];
      }

      listCallbacks[cache_name].push({
        success : callback,
        error : callbackError
      });

      //console.log(cache_name+" list. Callback queued");

      if (listWaiting[cache_name]) {
        return;
      }

      listWaiting[cache_name] = true;

      //console.log(cache_name+" list. NO cache, calling ajax");

      $.ajax({
        url: reqPath,
        type: "GET",
        data: {timeout: timeout},
        dataType: "json",
        success: function(response) {
          var list = OpenNebulaHelper.pool(resource, response)

          listCache[cache_name] = {
            timestamp   : new Date().getTime(),
            data        : list
          };

          listWaiting[cache_name] = false;

          for (var i = 0; i < listCallbacks[cache_name].length; i++) {
            var callback = listCallbacks[cache_name][i].success;

            if (callback) {
              //console.log(cache_name+" list. Callback called");
              callback(request, list, response);
            }
          }

          listCallbacks[cache_name] = [];

          return;
        },
        error: function(response) {
          listWaiting[cache_name] = false;

          for (var i = 0; i < listCallbacks[cache_name].length; i++) {
            var callback = listCallbacks[cache_name][i].error;

            if (callback) {
              //console.log(cache_name+" list. ERROR Callback called");
              callback(request, OpenNebula.Error(response));
            }
          }

          listCallbacks[cache_name] = [];

          return;
        }
      });
    },

    "list_in_zone": function(params, resource, path) {
      var callback = params.success;
      var callbackError = params.error;
      var timeout = params.timeout || false;
      var request = OpenNebulaHelper.request(resource, "list");
      var reqPath = path ? path : resource.toLowerCase();

      $.ajax({
        url: reqPath,
        type: "GET",
        data: {timeout: timeout, zone_id: params.data.zone_id},
        dataType: "json",
        success: function(response) {
          var list = OpenNebulaHelper.pool(resource, response)
          return callback ?
              callback(request, list) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebula.Error(response)) : null;
        }
      });
    },

    //Subresource examples: "fetch_template", "log"...
    "show": function(params, resource, subresource, path) {
      var callback = params.success;
      var callbackError = params.error;
      var id = params.data.id;
      var request = subresource ?
          OpenNebulaHelper.request(resource, subresource, id) :
          OpenNebulaHelper.request(resource, "show", id);

      var reqPath = path ? path : resource.toLowerCase();
      var url = reqPath + "/" + id;
      url = subresource ? url + "/" + subresource : url;

      $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        success: function(response) {
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebula.Error(response)) : null;
        }
      });
    },

    "chown": function(params, resource, path) {
      var id = params.data.extra_param;
      var action_obj = {"owner_id": id,
                        "group_id": "-1"};

      OpenNebula.Action.simple_action(params,
                                      resource,
                                      "chown",
                                      action_obj,
                                      path);
    },

    "chgrp": function(params, resource, path) {
      var id = params.data.extra_param;
      var action_obj = {"owner_id": "-1",
                        "group_id": id};

      OpenNebula.Action.simple_action(params,
                                      resource,
                                      "chown",
                                      action_obj,
                                      path);
    },

    //Example: Simple action: publish. Simple action with action obj: deploy
    "simple_action": function(params, resource, method, action_obj, path) {
      var callback = params.success;
      var callbackError = params.error;
      var id = params.data.id;

      var action, request;
      if (action_obj) {
        action = OpenNebulaHelper.action(method, action_obj);
        request = OpenNebulaHelper.request(resource, method, [id, action_obj]);
      } else {
        action = OpenNebulaHelper.action(method);
        request = OpenNebulaHelper.request(resource, method, id);
      };

      var reqPath = path ? path : resource.toLowerCase();
      var cache_name = params.cache_name ? params.cache_name : resource;

      $.ajax({
        url: reqPath + "/" + id + "/action",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(action),
        success: function() {
          clearCache(cache_name);

          return callback ? callback(request) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebula.Error(response)) : null;
        }
      });
    },

    "monitor": function(params, resource, all, path) {
      var callback = params.success;
      var callbackError = params.error;
      var data = params.data;

      var method = "monitor";
      var request = OpenNebulaHelper.request(resource, method, data);

      var url = path ? path : resource.toLowerCase();
      url = all ? url + "/monitor" : url + "/" + params.data.id + "/monitor";

      $.ajax({
        url: url,
        type: "GET",
        data: data['monitor'],
        dataType: "json",
        success: function(response) {
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebula.Error(response)) : null;
        }
      });
    },

    "accounting": function(params, resource, path) {
      var callback = params.success;
      var callbackError = params.error;
      var data = params.data;

      var method = "accounting";
      var request = OpenNebulaHelper.request(resource, method, data);

      var url = path ? path : resource.toLowerCase() + "/accounting";

      $.ajax({
        url: url,
        type: "GET",
        data: data,
        dataType: "json",
        success: function(response) {
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebula.Error(response)) : null;
        }
      });
    },

    "showback": function(params, resource, path) {
      var callback = params.success;
      var callbackError = params.error;
      var data = params.data;

      var method = "showback";
      var request = OpenNebulaHelper.request(resource, method, data);

      var url = path ? path : resource.toLowerCase() + "/showback";

      $.ajax({
        url: url,
        type: "GET",
        data: data,
        dataType: "json",
        success: function(response) {
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebula.Error(response)) : null;
        }
      });
    },

    "clear_cache": clearCache
  }

  return Action;
});
