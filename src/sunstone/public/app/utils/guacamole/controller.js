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

  require('guacamole-common-js')
  var ConnectionTypes = require('utils/guacamole/types/connection-types');
  var ManagedClient = require('utils/guacamole/types/client');
  var ManagedClientState = require('utils/guacamole/types/client-state');
  var Utils = require('utils/guacamole/utils');
  var UtilsConnection = require('utils/info-connection/utils');

  var GuacButtons = require('utils/guacamole/directives/guacButtons');
  // var GuacClipboard = require('utils/guacamole/directives/guacClipboard');
  var GuacKeyboard = require('utils/guacamole/directives/guacKeyboard');
  var GuacMouse = require('utils/guacamole/directives/guacMouse');
  var GuacOsk = require('utils/guacamole/directives/guacOsk');

  function GuacController() {
    var $guac = {};
    var $scope = {};
    var $elements = {
      main: document.querySelector('.wrapper__display'),
      displayContainer: document.getElementById('display'),
      selectResolution: document.getElementById('select__resolution'),
      osk: document.getElementById('osk'),
      closeOskButton: document.querySelector('.osk__header__buttons .close'),

      /* Buttons */
      sendCtrlAltDelButton: document.getElementById('buttons__sendctrlaltdel'),
      mouseButton: document.getElementById('buttons__mouse'),
      screenshotButton: document.getElementById('buttons__screenshot'),
      oskButton: document.getElementById('buttons__osk'),
      fullscreenButton: document.getElementById('buttons__fullscreen'),
    };

    this.disconnect = disconnect;

    this.setConnection = function(token, connectionType) {
      $scope.connectionType = String(connectionType).toUpperCase();

      $scope.connectionType === ConnectionTypes.SSH
        ? $elements.displayContainer.classList.add('ssh')
        : $elements.displayContainer.classList.remove('ssh');

      var isRDP = $scope.connectionType === ConnectionTypes.RDP
      var resolution = $elements.selectResolution.value;

      isRDP &&  $elements.selectResolution.classList.remove('hidden');

      var displayOptions = isRDP && resolution && resolution !== ''
        ? {
          width: resolution.split('x')[0],
          height: resolution.split('x')[1]
        }
        : { display: $elements.displayContainer }; // get width & height from container

      var managedClient = ManagedClient.getInstance(token, displayOptions)

      new GuacKeyboard($guac, $scope, $elements);
      new GuacMouse($guac, $scope, $elements);
      new GuacOsk($guac, $scope, $elements);
      new GuacButtons($guac, $scope, $elements);
      // new GuacClipboard($guac, $scope, $elements);
      window.addEventListener('resize', containerResized);
      document.addEventListener('fullscreenchange', containerResized)

      // Remove any existing display
      $elements.displayContainer.innerHTML = '';
  
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

      Utils.observe($scope.client.clientState, 'connectionState', (function(connectionState) {
        var isLoading = connectionState === ManagedClientState.ConnectionState.WAITING;
        var isConnected = connectionState === ManagedClientState.ConnectionState.CONNECTED;
        var isDisconnected = connectionState === ManagedClientState.ConnectionState.DISCONNECTED;

        isConnected && setTimeout(containerResized, 100);
        isDisconnected && disconnect();
        
        $('.spinner')[isLoading ? 'fadeIn' : 'fadeOut']('fast');
        $('.toolbar__state h5').text(connectionState).animate();
      }).bind(this));
    };

    this.setInformation = function(information) {
      var info_decode = UtilsConnection.decodeInfoConnection(information);
      UtilsConnection.printInfoConnection($('.information'), info_decode);
    }

    function disconnect() {
      if ($guac.client) $guac.client.disconnect();
      if ($guac.keyboard) GuacKeyboard.destroy();
      if ($guac.mouse) GuacMouse.destroy();
      if ($guac.osk) GuacOsk.destroy();

      GuacButtons.destroy();
      // GuacClipboard.destroy();
      window.removeEventListener('resize', containerResized);
      document.removeEventListener('fullscreenchange', containerResized)

      while($elements.displayContainer.firstChild)
        $elements.displayContainer.removeChild($elements.displayContainer.firstChild);

      $guac = {};
      $scope = {};
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

        // when type connection is SSH, display doesn't need scale
        $scope.connectionType !== ConnectionTypes.SSH && updateDisplayScale();
      }

      if ($guac.osk) {
        $guac.osk.resize(1000);
      }
    };

    function updateDisplayScale() {
      if (!$guac.display) return;

      // Get screen resolution.
      var origHeight = Math.max($guac.display.getHeight(), 1);
      var origWidth = Math.max($guac.display.getWidth(), 1);
      
      var htmlWidth = window.innerWidth;
      var htmlHeight = window.innerHeight;
      
      var xScale = htmlWidth / origWidth;
      var yScale = htmlHeight / origHeight;
      
      // This is done to handle both X and Y axis
      var scale = Math.min(yScale, xScale);

      // Limit to 1
      scale = Math.min(scale, 1);

      if (scale !== 0) {
        $guac.display.scale(scale);
      }
    };
  }

  return GuacController;

});