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

  var RESOURCE = "AUTH";

  var Auth = {
    "login": function(params) {
      var callback = params.success;
      var callbackError = params.error;
      var username = params.data.username;
      var password = params.data.password;
      var remember = params.remember;

      var request = OpenNebulaHelper.request(RESOURCE, "login");

      $.ajax({
        url: "login",
        type: "POST",
        data: {remember: remember},
        beforeSend : function(req) {
          var token = username + ':' + password;
          var authString = 'Basic ';
          if (typeof(btoa) === 'function')
              authString += btoa(unescape(encodeURIComponent(token)))
          else {
            token = CryptoJS.enc.Utf8.parse(token);
            authString += CryptoJS.enc.Base64.stringify(token)
          }

          req.setRequestHeader("Authorization", authString);
        },
        success: function(response) {
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebulaError(response)) : null;
        }
      });
    },

    "logout": function(params) {
      var callback = params.success;
      var callbackError = params.error;

      var request = OpenNebulaHelper.request(RESOURCE, "logout");

      $.ajax({
        url: "logout",
        type: "POST",
        success: function(response) {
          // TODO $.cookie("one-user", null);
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebulaError(response)) : null;
        }
      });
    }
  }

  return Auth;
})
