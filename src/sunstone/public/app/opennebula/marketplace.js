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
  var OpenNebulaError = require('./error');
  var OpenNebulaHelper = require('./helper');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');

  var RESOURCE = "MARKETPLACE";

  var Marketplace = {
    "resource": RESOURCE,
    "show" : function(params) {
      params.error = function() {
        return Notifier.notifyError(Locale.tr("Cannot connect to OpenNebula Marketplace"));
      };
      OpenNebulaAction.show(params, RESOURCE);
    },
    "list" : function(params) {
      //Custom list request function, since the contents do not come
      //in the same format as the rest of opennebula resources.
      var callback = params.success;
      var callback_error = params.error;
      var timeout = params.timeout || false;
      var request = OpenNebulaHelper.request('MARKETPLACE', 'list');

      $.ajax({
        url: 'marketplace',
        type: 'GET',
        data: {timeout: timeout},
        dataType: "json",
        success: function(response) {
          $(".marketplace_error_message").hide();
          return callback ? callback(request, response) : null;
        },
        error: function(res) {
          $(".marketplace_error_message").show();
          return callback_error ? callback_error(request, OpenNebulaError(res)) : null;
        }
      });
    }
  };

  return Marketplace;
});
