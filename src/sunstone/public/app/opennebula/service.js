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
  var OpenNebulaAction = require('./action');
  var OpenNebulaHelper = require("./helper");
  var OpenNebulaError  = require("./error");
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');

  var RESOURCE = "DOCUMENT";
  var PATH = 'service';
  var CACHE_NAME = 'SERVICE'

  var STATES_STR = [
    Locale.tr("PENDING"),
    Locale.tr("DEPLOYING"),
    Locale.tr("RUNNING"),
    Locale.tr("UNDEPLOYING"),
    Locale.tr("WARNING"),
    Locale.tr("DONE"),
    Locale.tr("FAILED_UNDEPLOYING"),
    Locale.tr("FAILED_DEPLOYING"),
    Locale.tr("SCALING"),
    Locale.tr("FAILED_SCALING"),
    Locale.tr("COOLDOWN"),
    Locale.tr("DEPLOYING_NETS"),
    Locale.tr("UNDEPLOYING_NETS"),
    Locale.tr("FAILED_DEPLOYING_NETS"),
    Locale.tr("FAILED_UNDEPLOYING_NETS")
  ];

  var STATES = {
    PENDING                 : 0,
    DEPLOYING               : 1,
    RUNNING                 : 2,
    UNDEPLOYING             : 3,
    WARNING                 : 4,
    DONE                    : 5,
    FAILED_UNDEPLOYING      : 6,
    FAILED_DEPLOYING        : 7,
    SCALING                 : 8,
    FAILED_SCALING          : 9,
    COOLDOWN                : 10,
    DEPLOYING_NETS          : 11,
    UNDEPLOYING_NETS        : 12,
    FAILED_DEPLOYING_NETS   : 13,
    FAILED_UNDEPLOYING_NETS : 14
  };

  var Service = {
    "resource": RESOURCE,
    "del": function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.del(params, RESOURCE, PATH);
    },
    "list" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.list(params, RESOURCE, PATH)
    },
    "show" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.show(params, RESOURCE, false, PATH)
    },
    "chown" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.chown(params, RESOURCE, PATH);
    },
    "chgrp" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.chgrp(params, RESOURCE, PATH);
    },
    "chmod" : function(params) {
      params.cache_name = CACHE_NAME;
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "chmod", action_obj, PATH);
    },
    "shutdown" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.simple_action(params, RESOURCE, "shutdown", null, PATH);
    },
    "recover" : function(params) {
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.simple_action(params, RESOURCE, "recover", null, PATH);
    },
    "recover_delete" : function(params) {
      var action_obj = {"delete": true};
      params.cache_name = CACHE_NAME;
      OpenNebulaAction.simple_action(params, RESOURCE, "recover", action_obj, PATH);
    },
    "rename" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rename", action_obj, PATH);
    },
    "append": function(params) {
      params.cache_name = CACHE_NAME;

      var action_obj = {};

      try {
        JSON.parse(params.data.extra_param);
        action_obj["template"] = params.data.extra_param;
      }
      catch(err) {
        action_obj["template_raw"] = params.data.extra_param;
      }

      action_obj["append"] = true;

      var callback = params.success;
      var callbackError = params.error;
      var id = params.data.id;
      var request = OpenNebulaHelper.request(RESOURCE, "update", [id, action_obj]);

      var reqPath = PATH ? PATH : RESOURCE.toLowerCase();
      $.ajax({
        url: reqPath + "/" + id,
        type: "PUT",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(action_obj),
        success: function(response) {
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebulaError(response)) : null;
        }
      });
    },
    "update": function(params){
      params.cache_name = CACHE_NAME;

      var json_aux = JSON.parse(params.data.extra_param);
      var action_obj = JSON.stringify(json_aux);

      var callback = params.success;
      var callbackError = params.error;
      var id = params.data.id;
      var request = OpenNebulaHelper.request(RESOURCE, "update", [id, action_obj]);

      var reqPath = PATH ? PATH : RESOURCE.toLowerCase();

      $.ajax({
        url: reqPath + "/" + id,
        type: "PUT",
        contentType: "application/json; charset=utf-8",
        data: action_obj,
        success: function(response) {
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebulaError(response)) : null;
        }
      });
    },
    "purgeDone": function(){
      var reqPath = PATH ? PATH : RESOURCE.toLowerCase();
      $.ajax({
        url: reqPath + '/purge',
        type: "POST",
        data: {
          csrftoken: csrftoken
        },
        success: function() {
          Notifier.notifyCustom(Locale.tr("Purge Services"),Locale.tr("Services on DONE state has been deleted from database"));
          return null;
        },
        error: Notifier.onError
      });
    },
    "stateStr" : function(stateId) {
      return STATES_STR[stateId];
    },
    "STATES": STATES,
    "filterDoneServices": _filterDoneServices,
    "getService": _getService,
    "getName": function(id){
      return OpenNebulaAction.getName(id, CACHE_NAME);
    }
  }

  function _promiseGetService({ id, success, async = true } = {}) {
    return $.ajax({
      url: 'service/' + id,
      type: 'GET',
      success: success,
      async: async
    });
  }

  function _getServiceById({ services, id } = {}) {
    return Array.isArray(services) &&
      services.find(function(service) {
        return service && service[RESOURCE] && service[RESOURCE].ID === id
      });
  }

  function _getService(id) {
    if (!id) return undefined;

    var service = undefined;
    var cache = OpenNebulaAction.cache(CACHE_NAME);

    if (cache && cache.data) {
      service = _getServiceById({ services: cache.data, id: id })
    }

    if (!service || service.length === 0) {
      _promiseGetService({
        id: id,
        async: false,
        success: function(res) { service = res }
      })
    }

    return service ? service[RESOURCE] : undefined
  }

  function _filterDoneServices(services) {
    return $.grep(services, function(service) {
      return service.DOCUMENT.TEMPLATE.BODY.state !== STATES.DONE;
    });
  }

  return Service;
})
