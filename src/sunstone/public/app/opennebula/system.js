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


  var onedconfCache;
  var onedconfWaiting = false;
  var onedconfCallbacks = [];

  var CACHE_EXPIRE = 36000000; //ms

  var _clearCache = function() {
    onedconfCache = null;
    //console.log("onedconf. Cache cleaned");
  };

  var RESOURCE = "SYSTEM";

  var System = {
    "resource": RESOURCE,
    "onedconf": function(params){
      var callback = params.success;
      var callbackError = params.error;
      var request = OpenNebulaHelper.request(RESOURCE, "onedconf");

      if (onedconfCache &&
          onedconfCache["timestamp"] + CACHE_EXPIRE > new Date().getTime()) {

        //console.log("onedconf. Cache used");

        return callback ?
            callback(request, onedconfCache["pcis"]) : null;
      }

      onedconfCallbacks.push({
        success : callback,
        error : callbackError
      });

      //console.log("onedconf. Callback queued");

      if (onedconfWaiting) {
        return;
      }

      onedconfWaiting = true;

      //console.log("onedconf. NO cache, calling ajax");

      $.ajax({
        url: "onedconf",
        type: "GET",
        dataType: "json",
        success: function(response) {
          onedconfCache = {
            timestamp       : new Date().getTime(),
            onedConf        : response
          };

          onedconfWaiting = false;

          for (var i = 0; i < onedconfCallbacks.length; i++) {
            var callback = onedconfCallbacks[i].success;

            if (callback) {
              //console.log("onedconf. Callback called");
              callback(request, response);
            }
          }

          onedconfCallbacks = [];

          return;
        },
        error: function(response) {
          onedconfWaiting = false;

          for (var i = 0; i < onedconfCallbacks.length; i++) {
            var callback = onedconfCallbacks[i].error;

            if (callback) {
              //console.log("onedconf. ERROR Callback called");
              callback(request, OpenNebulaError(response));
            }
          }

          onedconfCallbacks = [];

          return;
        }
      });
    }
  };

  return System;
})
