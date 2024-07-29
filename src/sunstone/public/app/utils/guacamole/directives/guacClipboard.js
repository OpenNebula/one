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

  var ClipboardData = require("utils/guacamole/types/clipboard-data");
  var ManagedClient = require("utils/guacamole/types/client");

  function GuacClipboard($guac, $scope, $elements) {
    window.addEventListener('load',  checkClipboard, true);
    window.addEventListener('copy',  checkClipboard);
    window.addEventListener('cut',   checkClipboard);
    window.addEventListener('focus', focusGained, true);

    function focusGained(event) {
      // Only recheck clipboard if it's the window itself that gained focus
      if (event.target === window) checkClipboard();
    }

    function checkClipboard() {
      $.when(getLocalClipboard()).done(function(data) {
        if ($guac.client) {
          ManagedClient.setClipboard($scope.client, data);
          $scope.client.clipboardData = data;
        }
      });
    };

    function getLocalClipboard() {
      var deferred = $.Deferred();

      try {
        // Attempt to read the clipboard using the Asynchronous Clipboard
        // API, if it's available
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText().then(function(text) {
            deferred.resolve(
              new ClipboardData({ type: 'text/plain', data: text })
            );
          }, deferred.reject);

          return deferred.promise();
        }
      }
      // Ignore any hard failures to use Asynchronous Clipboard API
      catch (ignore) { console.error(ignore) }
    }

    GuacClipboard.destroy = function() {
      window.removeEventListener('load',  checkClipboard, true);
      window.removeEventListener('copy',  checkClipboard);
      window.removeEventListener('cut',   checkClipboard);
      window.removeEventListener('focus', focusGained, true);
    };
  }

  return GuacClipboard;

});