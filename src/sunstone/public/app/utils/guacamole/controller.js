/* -------------------------------------------------------------------------- */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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
  var ManagedClient = require("utils/guacamole/types/client");
  var ManagedClientState = require("utils/guacamole/types/client-state");
  var Utils = require("utils/guacamole/utils");
  var UtilsConnection = require("utils/info-connection/utils");

  var GuacButtons = require("utils/guacamole/directives/guacButtons");
  var GuacClipboard = require("utils/guacamole/directives/guacClipboard");
  var GuacKeyboard = require("utils/guacamole/directives/guacKeyboard");
  var GuacMouse = require("utils/guacamole/directives/guacMouse");
  var GuacOsk = require("utils/guacamole/directives/guacOsk");

  function GuacController() {
    var $guac = {};
    var $scope = {};
    var $elements = {
      main: document.getElementById('guacamole-main'),
      displayContainer: document.getElementById('guacamole-display'),
      osk: document.getElementById('osk'),
      closeOskButton: document.getElementById('osk-close'),

      /* Buttons */
      sendCtrlAltDelButton: document.getElementById('sendCtrlAltDelButton_gclient'),
      mouseButton: document.getElementById('mouseButton_gclient'),
      screenshotButton: document.getElementById('takeScreenshot_gclient'),
      oskButton: document.getElementById('oskButton_gclient'),
    };

    var throttleResizeFunction = Utils.throttle(containerResized, 250);
    window.addEventListener('resize', throttleResizeFunction);

    this.disconnect = function() {
      if ($guac.client) $guac.client.disconnect();
      if ($guac.keyboard) GuacKeyboard.destroy();
      if ($guac.mouse) GuacMouse.destroy();
      if ($guac.osk) GuacOsk.destroy();

      GuacButtons.destroy();
      GuacClipboard.destroy();
      window.removeEventListener('resize', throttleResizeFunction);
      $('#guacamole-state').text('');

      $guac = {};
      $scope = {};
    }

    this.setConnection = function(token) {
      var managedClient = ManagedClient.getInstance(token, undefined, $elements.displayContainer)

      new GuacKeyboard($guac, $scope, $elements);
      new GuacMouse($guac, $scope, $elements);
      new GuacOsk($guac, $scope, $elements);
      new GuacButtons($guac, $scope, $elements);
      new GuacClipboard($guac, $scope, $elements);

      // Remove any existing display
      $elements.displayContainer.innerHTML = "";
  
      // Only proceed if a client is given 
      if (!managedClient) return;
      $scope.client = managedClient;
  
      // Get Guacamole client instance
      $guac.client = managedClient.client;
  
      // Attach possibly new display
      $guac.display = $guac.client.getDisplay();
      $guac.display.scale($scope.client.clientProperties.scale);
  
      // Add display element
      $scope.displayElement = $guac.display.getElement();
      $elements.displayContainer.appendChild($scope.displayElement);
  
      // Do nothing when the display element is clicked on
      $guac.display.getElement().onclick = function(event) {
          event.preventDefault();
          return false;
      };
  
      // Size of newly-attached client
      containerResized();

      Utils.observe($scope.client.managedDisplay, 'size', (function() {
        updateDisplayScale();
      }).bind(this));

      Utils.observe($scope.client.managedDisplay, 'cursor', (function(cursor) {
        if (cursor && $scope.localCursor) {
          $scope.localCursor = $guac.mouse.setCursor(cursor.canvas, cursor.x, cursor.y);
        }
      }).bind(this));

      Utils.observe($scope, 'disableCursor', (function(disabled) {
        $elements.mouseButton.disabled = !!disabled;
      }).bind(this));

      Utils.observe($scope.client.clientState, 'connectionState', (function(connectionState) {
        var isLoading = connectionState === ManagedClientState.ConnectionState.WAITING;
        
        $('#guacamole-loading')[isLoading ? 'fadeIn' : 'fadeOut']('fast');
        $('#guacamole-state').text(connectionState).animate();
      }).bind(this));

      Utils.observe($scope.client.clientProperties, 'scale', (function(scale) {
        scale = Math.max(scale, $scope.client.clientProperties.minScale);
        scale = Math.min(scale, $scope.client.clientProperties.maxScale);
  
        // Apply scale if client attached
        if ($guac.display && scale !== 0) {
          $guac.display.scale(scale);
          $elements.displayContainer.style['min-height'] = $guac.display.getHeight() + "px";
        }
        
        if (scale !== $scope.client.clientProperties.scale) {
          $scope.client.clientProperties.scale = scale;
        }
      }).bind(this));
    };

    this.setInformation = function(information) {
      var info_decode = UtilsConnection.decodeInfoConnection(information);
      UtilsConnection.printInfoConnection($('.guacamole_info'), info_decode);
    }

    function containerResized() {
      // Send new display size, if changed
      if ($guac.client && $guac.display) {
        var pixelDensity = window.devicePixelRatio || 1;
        var width  = $elements.main.offsetWidth  * pixelDensity;
        var height = $elements.main.offsetHeight * pixelDensity;
  
        if ($guac.display.getWidth() !== width || $guac.display.getHeight() !== height) {
          $guac.client.sendSize(width, height);
        }
        
        if ($guac.osk) {
          var MAX_OSK_WIDTH = 1000;

          $guac.osk.resize(Math.min(MAX_OSK_WIDTH, width));
        }
      }

      updateDisplayScale();
    };

    function updateDisplayScale() {
      if (!$guac.display) return;

      // Calculate scale to fit screen
      $scope.client.clientProperties.minScale = Math.min(
        $elements.main.offsetWidth / Math.max($guac.display.getWidth(), 1),
        $elements.main.offsetHeight / Math.max($guac.display.getHeight(), 1)
      );

      // Calculate appropriate maximum zoom level
      $scope.client.clientProperties.maxScale = Math.max($scope.client.clientProperties.minScale, 3);

      // Clamp zoom level, maintain auto-fit
      if (
        $guac.display.getScale() < $scope.client.clientProperties.minScale ||
        $scope.client.clientProperties.autoFit
      ) {
        $scope.client.clientProperties.scale = $scope.client.clientProperties.minScale;
      }
      else if ($guac.display.getScale() > $scope.client.clientProperties.maxScale) {
        $scope.client.clientProperties.scale = $scope.client.clientProperties.maxScale;
      }
    };
  }

  return GuacController;

});