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
  var OpenNebulaAction = require('./action');
  var Locale = require('utils/locale');
  var OpenNebulaError = require('./error');
  var OpenNebulaHelper = require('./helper');


  var pcisCache;
  var pcisWaiting = false;
  var pcisCallbacks = [];

  var CACHE_EXPIRE = 300000; //ms

  var _clearCache = function() {
    pcisCache = null;
    //console.log("Host.pciDevices. Cache cleaned");
  };

  var RESOURCE = "HOST";

  var STATES_STR = [
    Locale.tr("INIT"),
    Locale.tr("MONITORING_MONITORED"),
    Locale.tr("MONITORED"),
    Locale.tr("ERROR"),
    Locale.tr("DISABLED"),
    Locale.tr("MONITORING_ERROR"),
    Locale.tr("MONITORING_INIT"),
    Locale.tr("MONITORING_DISABLED")
  ];

  var SIMPLE_STATES_STR = [
    Locale.tr("INIT"),
    Locale.tr("UPDATE"),
    Locale.tr("ON"),
    Locale.tr("ERROR"),
    Locale.tr("OFF"),
    Locale.tr("RETRY"),
    Locale.tr("INIT"),
    Locale.tr("OFF")
  ];

  var STATES = {
    INIT                 : 0,
    MONITORING_MONITORED : 1,
    MONITORED            : 2,
    ERROR                : 3,
    DISABLED             : 4,
    MONITORING_ERROR     : 5,
    MONITORING_INIT      : 6,
    MONITORING_DISABLED  : 7
  };

  var Host = {
    "resource": RESOURCE,
    "stateStr": function(stateId) {
      return STATES_STR[stateId];
    },
    "simpleStateStr": function(stateId) {
      return SIMPLE_STATES_STR[stateId];
    },
    "STATES": STATES,
    "create": function(params) {
      OpenNebulaAction.create(params, RESOURCE);
      _clearCache();
    },
    "del": function(params) {
      OpenNebulaAction.del(params, RESOURCE);
      _clearCache();
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
    "update": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
      _clearCache();
    },
    "enable": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "enable");
      _clearCache();
    },
    "disable": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "disable");
      _clearCache();
    },
    "monitor" : function(params) {
      OpenNebulaAction.monitor(params, RESOURCE, false);
    },
    "pool_monitor" : function(params) {
      OpenNebulaAction.monitor(params, RESOURCE, true);
    },
    "rename" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rename", action_obj);
    },
    "getName": function(id){
      return OpenNebulaAction.getName(id, RESOURCE);
    },
    "pciDevices": function(params){
      var callback = params.success;
      var callbackError = params.error;
      var request = OpenNebulaHelper.request(RESOURCE, "infrastructure");

      if (pcisCache &&
          pcisCache["timestamp"] + CACHE_EXPIRE > new Date().getTime()) {

        //console.log("Host.pciDevices. Cache used");

        return callback ?
            callback(request, pcisCache["data"]) : null;
      }

      pcisCallbacks.push({
        success : callback,
        error : callbackError
      });

      //console.log("Host.pciDevices. Callback queued");

      if (pcisWaiting) {
        return;
      }

      pcisWaiting = true;

      //console.log("Host.pciDevices. NO cache, calling ajax");

      $.ajax({
        url: "infrastructure",
        type: "GET",
        dataType: "json",
        success: function(response) {
          var pcis = response.pci_devices;

          if (pcis == undefined){
            pcis = [];
          }

          if (!$.isArray(pcis)){ // If only 1 convert to array
            pcis = [pcis];
          }

          pcisCache = {
            timestamp   : new Date().getTime(),
            data        : pcis
          };

          pcisWaiting = false;

          for (var i = 0; i < pcisCallbacks.length; i++) {
            var callback = pcisCallbacks[i].success;

            if (callback) {
              //console.log("Host.pciDevices. Callback called");
              callback(request, pcis);
            }
          }

          pcisCallbacks = [];

          return;
        },
        error: function(response) {
          pcisWaiting = false;

          for (var i = 0; i < pcisCallbacks.length; i++) {
            var callback = pcisCallbacks[i].error;

            if (callback) {
              //console.log("Host.pciDevices. ERROR Callback called");
              callback(request, OpenNebulaError(response));
            }
          }

          pcisCallbacks = [];

          return;
        }
      });
    }
  }

  return Host;
})
