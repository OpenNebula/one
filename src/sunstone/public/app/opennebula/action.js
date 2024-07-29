/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

define(function(require) {
  var OpenNebulaHelper = require("./helper");
  var OpenNebulaError = require("./error");
  var Config = require("sunstone-config");

  var listCache = {};
  var listWaiting = {};
  var listCallbacks = {};

  var nameIndex = {};

  var CACHE_EXPIRE = 60000; //ms

  var _clearCache = function(cache_name) {
    listCache[cache_name] = null;
  };

  //Example: Simple action: publish. Simple action with action obj: deploy
  var _simple_action = function(params, resource, method, action_obj, path) {
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
    }

    var reqPath = path ? path : resource.toLowerCase();
    var cache_name = params.cache_name ? params.cache_name : resource;
    $.ajax({
      url: reqPath + "/" + id + "/action",
      type: "POST",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(action),
      success: function(response) {
        _clearCache(cache_name);

        return callback ? callback(request, response) : null;
      },
      error: function(response) {
        return callbackError ?
            callbackError(request, OpenNebulaError(response)) : null;
      }
    });
  };

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
          _clearCache(cache_name);

          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebulaError(response)) : null;
        }
      });
    },

    "del": function(params, resource, path, extra_param) {
      var callback = params.success;
      var callbackError = params.error;
      var id = params.data.id;
      var request = OpenNebulaHelper.request(resource, "delete", id);
      var reqPath = path ? path : resource.toLowerCase();
      var cache_name = params.cache_name ? params.cache_name : resource;
      var ajaxData = {
        url: reqPath + "/" + id,
        type: "DELETE",
        success: function() {
          _clearCache(cache_name);

          return callback ? callback(request) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebulaError(response)) : null;
        }
      };
      if(extra_param){
        ajaxData.data = JSON.stringify(extra_param);
        ajaxData.dataType = "json";
        ajaxData.contentType = "application/json; charset=utf-8";
      }
      $.ajax(ajaxData);
    },

    "cache": function(resource) {
      return listCache[resource];
    },

    "check": function(params, path){
      if(params &&
        params.success &&
        typeof params.success === "function" &&
        params &&
        params.error &&
        typeof params.error === "function"){
        var reqPath = path.toLowerCase();
        $.ajax({
          url: reqPath,
          type: "GET",
          success: function(response) {
            params.success(response);
            return false;
          },
          error: function(response) {
            params.error(response);
            return false;
          }
        });
      }
    },

    "checkversion": function(params, path){
      if(params &&
        params.success &&
        typeof params.success === "function" &&
        params &&
        params.error &&
        typeof params.error === "function"){
        var reqPath = path.toLowerCase();
        $.ajax({
          url: reqPath,
          type: "GET",
          success: function(response) {
            params.success(response);
            return false;
          },
          error: function(response) {
            params.error(response);
            return false;
          }
        });
      }
    },
    "list": function(params, resource, path, process, extra_params = {}, async = true) {
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
        _clearCache(cache_name);
      }

      if (
        !force &&
        listCache[cache_name] &&
        listCache[cache_name]["timestamp"] + CACHE_EXPIRE > new Date().getTime()
      ) {
        return callback ? callback(request, listCache[cache_name]["data"]) : null;
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

      if (listWaiting[cache_name]) {
        return;
      }

      listWaiting[cache_name] = true;
      var pool_filter = Config.isChangedFilter()?-4:-2;

      let data = $.extend(extra_params, { timeout: timeout, pool_filter: pool_filter });

      $.ajax({
        url: reqPath,
        type: "GET",
        data: data,
        async: async,
        dataType: "json",
        success: function(response) {
          var list;

          if (process){
            list = process(response);
          } else {
            list = OpenNebulaHelper.pool(resource, response);
          }

          nameIndex[cache_name] = OpenNebulaHelper.pool_name_processing(
                                        resource+"_POOL", resource, response);

          listCache[cache_name] = {
            timestamp   : new Date().getTime(),
            data        : list
          };

          listWaiting[cache_name] = false;

          for (var i = 0; i < listCallbacks[cache_name].length; i++) {
            var callback = listCallbacks[cache_name][i].success;

            if (callback) {
              try{
                callback(request, list, response);
              }catch(err){
                console.error(err);
              }
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
              callback(request, OpenNebulaError(response));
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
        data: {timeout: timeout, zone_id: params.data.zone_id, pool_filter: params.data.pool_filter},
        dataType: "json",
        success: function(response) {
          var list = OpenNebulaHelper.pool(resource, response);
          return callback ?
              callback(request, list) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebulaError(response)) : null;
        }
      });
    },

    "show": function(params, resource, subresource, path, async = true) {
      var callback = params.success;
      var callbackError = params.error;
      var id = params.data.id;
      var data = params.data;
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
        data: data,
        async: async,
        success: function(response) {
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebulaError(response)) : null;
        }
      });
    },

    "chown": function(params, resource, path) {
      var id = params.data.extra_param;
      var action_obj = {"owner_id": id,
                        "group_id": "-1"};

      _simple_action(params, resource, "chown", action_obj, path);
    },

    "lock": function(params, resource, path) {
      var level = params.data.extra_param;
      var action_obj = {"level": level};

      _simple_action(params, resource, "lock", action_obj, path);
    },

    "addFlowAction": function(params, resource) {
      var callback = params && params.success;
      var callbackError = params && params.error;
      var id = params && params.data && params.data.id;
      var roleName = params && params.data && params.data.roleName;
      var action = params && params.data && params.data.action;
      var cacheName = params.cacheName ? params.cacheName : resource;
      if(id!==undefined && action && resource){
        $.ajax({
          url: roleName?
            resource.toLowerCase()+"/"+id+"/role/"+roleName+"/action"
          :
            resource.toLowerCase()+"/"+id+"/action",
          type: "POST",
          dataType: "text",
          contentType: "application/json; charset=utf-8",
          data: JSON.stringify({"action": action}),
          success: function(response) {
            _clearCache(cacheName);
            return callback ? callback(response) : null;
          },
          error: function(response) {
            return callbackError ? callbackError(OpenNebulaError(response)) : null;
          }
        });
      }
    },

    "chgrp": function(params, resource, path) {
      var id = params.data.extra_param;
      var action_obj = {"owner_id": "-1",
                        "group_id": id};

      _simple_action(params, resource, "chown", action_obj, path);
    },

    "simple_action": _simple_action,

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
        data: data["monitor"],
        dataType: "json",
        success: function(response) {
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebulaError(response)) : null;
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
              callbackError(request, OpenNebulaError(response)) : null;
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
              callbackError(request, OpenNebulaError(response)) : null;
        }
      });
    },

    "getName": function(id, cache_name){
      if(nameIndex[cache_name] != undefined){
        var name = nameIndex[cache_name][id];
        if (name != undefined){
          return name;
        }

        // TODO: if name is not found, perform a .list or .show to at least
        // get it ready for the next call?
      }

      return ""+id;
    },
    "importMarketApp": function(params, resource, method, action_obj) {
      var callback = params.success;
      var callbackError = params.error;
      var id = params.data.id;
      var action = OpenNebulaHelper.action(method, action_obj);
      var request = OpenNebulaHelper.request(resource, method, [id, action_obj]);

      var reqPath = resource.toLowerCase();
      var cache_name = params.cache_name ? params.cache_name : resource;
      $.ajax({
        url: reqPath + "/" + id + "/create",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(action),
        success: function(response) {
          _clearCache(cache_name);
  
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebulaError(response)) : null;
        }
      });
    }, 
    "getAppTags": function(params, resource){
      var callback = params.success;
      var callbackError = params.error;
      var data = params.data;

      var method = "getAppTags";
      var request = OpenNebulaHelper.request(resource, method, data);

      var url = resource.toLowerCase() + "/" + params.data.id + "/tags";
      $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        success: function(response) {
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebulaError(response)) : null;
        }
      });
    },
    "get_all_cache": function() {
      return listCache;
    },
    "clear_cache": _clearCache
  };

  return Action;
});
