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

  require("guacamole-common-js")

  function GuacMouse($guac, $scope, $elements) {
    var mouse = $guac.mouse = new Guacamole.Mouse($elements.displayContainer);

    // Ensure focus is regained via mousedown before forwarding event
    mouse.onmouseup   =
    mouse.onmousedown = function(mouseState) {
      $elements.displayContainer.focus();
      handleMouseState(mouseState);
    };

    // Forward mousemove events untouched
    mouse.onmousemove = function(mouseState) {
      handleMouseState(mouseState, true);
    }

    // Hide software cursor when mouse leaves display
    mouse.onmouseout = function() {
        if (!$guac.display) return;

        $guac.display.showCursor(false);
    };

    function handleMouseState(mouseState, scaleMouse = false) {
      // Do not attempt to handle mouse state changes if the client
      // or display are not yet available
      if (!$guac.client || !$guac.display || $scope.disabledMouse) return;

      if (scaleMouse) {
        mouseState.y =  mouseState.y / $guac.display.getScale();
        mouseState.x =  mouseState.x / $guac.display.getScale();
      }
  
      // Send mouse state, show cursor if necessary
      $guac.display.showCursor(!$scope.localCursor);
      $guac.client.sendMouseState(mouseState);
    };

    GuacMouse.destroy = function() {
      $guac.mouse             =
      $guac.mouse.onmouseup   =
      $guac.mouse.onmousedown =
      $guac.mouse.onmouseout  = null;
    };
  }

  return GuacMouse;

});