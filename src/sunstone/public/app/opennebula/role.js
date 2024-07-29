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
  var OpenNebulaError = require('./error');
  var OpenNebulaHelper = require('./helper');
  var Locale = require('utils/locale');

  var RESOURCE = "DOCUMENT";
  var PATH = 'service';

  var TAB_ID = require('tabs/oneflow-services-tab/tabId');
  var PANEL_ID = require('tabs/oneflow-services-tab/panels/roles/panelId');

  function generate_batch_action_params() {
    var context = $('#'+TAB_ID+' #'+PANEL_ID);

    var action_obj = {
        "period" : $("#batch_action_period", context).val(),
        "number" : $("#batch_action_number", context).val()};

    return action_obj;
  }

  var Role = {
    "resource": RESOURCE,
    "state" : function(state_int) {
      state_int = state_int ? state_int : 0;
      var state = [
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
          Locale.tr("COOLDOWN")
      ][state_int]
      return state ? state : state_int;
    },
    "suspend" : function(params) {
      OpenNebulaAction.simple_action(params,
                                      RESOURCE,
                                      "suspend",
                                      generate_batch_action_params(),
                                      PATH);
    },
    "resume" : function(params) {
      OpenNebulaAction.simple_action(params,
                                      RESOURCE,
                                      "resume",
                                      generate_batch_action_params(),
                                      PATH);
    },
    "stop" : function(params) {
      OpenNebulaAction.simple_action(params,
                                      RESOURCE,
                                      "stop",
                                      generate_batch_action_params(),
                                      PATH);
    },
    "boot" : function(params) {
      OpenNebulaAction.simple_action(params,
                                      RESOURCE,
                                      "boot",
                                      generate_batch_action_params(),
                                      PATH);
    },
    "reboot" : function(params) {
      OpenNebulaAction.simple_action(params,
                                      RESOURCE,
                                      "reboot",
                                      generate_batch_action_params(),
                                      PATH);
    },
    "reboot_hard" : function(params) {
      OpenNebulaAction.simple_action(params,
                                      RESOURCE,
                                      "reboot-hard",
                                      generate_batch_action_params(),
                                      PATH);
    },
    "poweroff" : function(params) {
      OpenNebulaAction.simple_action(params,
                                      RESOURCE,
                                      "poweroff",
                                      generate_batch_action_params(),
                                      PATH);
    },
    "poweroff_hard" : function(params) {
      OpenNebulaAction.simple_action(params,
                                      RESOURCE,
                                      "poweroff-hard",
                                      generate_batch_action_params(),
                                      PATH);
    },
    "undeploy" : function(params) {
      OpenNebulaAction.simple_action(params,
                                      RESOURCE,
                                      "undeploy",
                                      generate_batch_action_params(),
                                      PATH);
    },
    "undeploy_hard" : function(params) {
      OpenNebulaAction.simple_action(params,
                                      RESOURCE,
                                      "undeploy-hard",
                                      generate_batch_action_params(),
                                      PATH);
    },
    "snapshot_create" : function(params) {
      OpenNebulaAction.simple_action(params,
                                      RESOURCE,
                                      "snapshot-create",
                                      generate_batch_action_params(),
                                      PATH);
    },
    "terminate" : function(params) {
      OpenNebulaAction.simple_action(params,
                                      RESOURCE,
                                      "terminate",
                                      generate_batch_action_params(),
                                      PATH);
    },
    "terminate_hard" : function(params) {
      OpenNebulaAction.simple_action(params,
                                      RESOURCE,
                                      "terminate-hard",
                                      generate_batch_action_params(),
                                      PATH);
    },
    "recover" : function(params) {
      OpenNebulaAction.simple_action(params,
                                      RESOURCE,
                                      "recover",
                                      null,
                                      PATH);
    },
    "update" : function(params) {
      var request = OpenNebulaHelper.request(RESOURCE, "update", params.data.id);

      $.ajax({
        url: PATH + "/" + params.data.id,
        type: "PUT",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(params.data.extra_param),
        success: function(response) {
          return params.success ? params.success(request, response) : null;
        },
        error: function(response) {
          return params.error ? params.error(request, OpenNebulaError(response)) : null;
        }
      });
    },
    "scale" : function(params) {
      var request = OpenNebulaHelper.request(RESOURCE, "scale", params.data.id); 

      $.ajax({
        url: PATH + "/" + String(params.data.id) + "/scale",
        type: "POST",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(params.data.extra_param),
        success: function(response) {
          return params.success ? params.success(request, response) : null;
        },
        error: function(response) {
          response.status === 201
            ? params.success ? params.success(request, response) : null
            : params.error ? params.error(request, OpenNebulaError(response)) : null;
        }
      });
    },
    "remove" : function(params) {
      var request = OpenNebulaHelper.request(RESOURCE, "remove", params.data.id); 

      $.ajax({
        url: PATH + "/" + String(params.data.id) + "/role_action",
        type: "POST",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(params.data.extra_param),
        success: function(response) {
          return params.success ? params.success(request, response) : null;
        },
        error: function(response) {
          response.status === 201
            ? params.success ? params.success(request, response) : null
            : params.error ? params.error(request, OpenNebulaError(response)) : null;
        }
      });
    },
    "add" : function(params) {
      var request = OpenNebulaHelper.request(RESOURCE, "add", params.data.id); 

      $.ajax({
        url: PATH + "/" + String(params.data.id) + "/role_action",
        type: "POST",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(params.data.extra_param),
        success: function(response) {
          return params.success ? params.success(request, response) : null;
        },
        error: function(response) {
          response.status === 201
            ? params.success ? params.success(request, response) : null
            : params.error ? params.error(request, OpenNebulaError(response)) : null;
        }
      });
    },
  }

  return Role;
})
