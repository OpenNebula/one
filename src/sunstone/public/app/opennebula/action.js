/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
  var OpenNebulaHelper = require('./helper');
  var OpenNebulaError = require('./error');

  var listCache = {};
  var listWaiting = {};
  var listCallbacks = {};

  var nameIndex = {};

  var CACHE_EXPIRE = 60000; //ms

  var _clearCache = function(cache_name) {
    listCache[cache_name] = null;
    //console.log(cache_name+" cache cleaned");
  }

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
    };

    var reqPath = path ? path : resource.toLowerCase();
    var cache_name = params.cache_name ? params.cache_name : resource;

    $.ajax({
      url: reqPath + "/" + id + "/action",
      type: "POST",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(action),
      success: function() {
        _clearCache(cache_name);

        return callback ? callback(request) : null;
      },
      error: function(response) {
        return callbackError ?
            callbackError(request, OpenNebulaError(response)) : null;
      }
    });
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
          _clearCache(cache_name);

          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebulaError(response)) : null;
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
          _clearCache(cache_name);

          return callback ? callback(request) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebulaError(response)) : null;
        }
      });
    },

    "list": function(params, resource, path, process) {
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
        data: {timeout: timeout, zone_id: params.data.zone_id},
        dataType: "json",
        success: function(response) {
          var list = OpenNebulaHelper.pool(resource, response)
          return callback ?
              callback(request, list) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebulaError(response)) : null;
        }
      });
    },

    //Subresource examples: "log"...
    "show": function(params, resource, subresource, path) {
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
        data: data['monitor'],
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

    "clear_cache": _clearCache
  };

  return Action;
});
