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

  var Files = require('utils/files');

  function GuacButtons($guac, $scope, $elements) {
    $elements.screenshotButton.onclick = function() {
      if (!$guac.client) return;

      var canvas = $guac.client.getDisplay().getDefaultLayer().getCanvas();
      Files.downloadImage('screenshot', canvas)
    };

    $elements.sendCtrlAltDelButton.onclick = function() {
      if (!$guac.client || !$guac.osk) return;

      var ctrlKey = $guac.osk.keys['LCtrl'][0].keysym;
      var altKey = $guac.osk.keys['LAlt'][0].keysym;
      var delKey = $guac.osk.keys['Del'][0].keysym;
  
      $guac.client.sendKeyEvent(1, ctrlKey);
      $guac.client.sendKeyEvent(1, altKey);
      $guac.client.sendKeyEvent(1, delKey);
      $guac.client.sendKeyEvent(0, delKey);
      $guac.client.sendKeyEvent(0, altKey);
      $guac.client.sendKeyEvent(0, ctrlKey);
    };

    $elements.oskButton.onclick =
    $elements.closeOskButton.onclick = function() {
      if (!$guac.client) return;

      $('#osk__container').fadeToggle('fast');
    };

    $elements.mouseButton.onclick = function() {
      // toggle disabled
      this.classList.toggle('disabled');

      $scope.localCursor = $elements.mouseButton.classList.contains('disabled');
    };

    $elements.fullscreenButton.onclick = function() {
      // If the document is not in full screen mode make the video full screen
      if (!document.fullscreenElement && document.fullscreenEnabled) {
        $elements.main.requestFullscreen();
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    };

    GuacButtons.destroy = function() {
      // reset default state
      $('#osk__container').hide();
      $elements.mouseButton.classList.remove('disabled');

      $elements.sendCtrlAltDelButton.onclick  =
      $elements.screenshotButton.onclick      =
      $elements.mouseButton.onclick           =
      $elements.oskButton.onclick             =
      $elements.closeOskButton.onclick        = null;
    };
  }

  return GuacButtons;

});