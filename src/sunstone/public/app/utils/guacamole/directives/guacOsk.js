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
  var enUsQwerty = require('utils/guacamole/layouts/en-us-qwerty');
  var esEsQwerty = require('utils/guacamole/layouts/es-es-qwerty');

  var DEFAULT_LAYOUT = enUsQwerty.language;

  function GuacOsk($guac, $scope, $elements) {
    loadLayouts();
    changeLayout(DEFAULT_LAYOUT);

    $('#osk__container').draggable({
      start: function() { $scope.disabledMouse = true; },
      stop: function() { $scope.disabledMouse = false; }
    });

    function loadLayouts() {
      $('#select__qwerty').empty();

      var enUsLayout = new Option(enUsQwerty.language, enUsQwerty.language);
      $('#select__qwerty').append(enUsLayout);

      var esEsLayout = new Option(esEsQwerty.language, esEsQwerty.language);
      $('#select__qwerty').append(esEsLayout);

      $('#select__qwerty').off().on('change', function() {
        changeLayout(this.value);
      })
    };

    function changeLayout(newLayout) {
      var layout = newLayout === enUsQwerty.language ? enUsQwerty : esEsQwerty;

      var osk = $guac.osk = new Guacamole.OnScreenKeyboard(layout);

      $elements.osk.innerHTML = "";
      $elements.osk.appendChild(osk.getElement());

      osk.onkeydown = function(keysym) {
          $guac.client.sendKeyEvent(1, keysym);
      };

      osk.onkeyup = function(keysym) {
          $guac.client.sendKeyEvent(0, keysym);
      };

      var pixelDensity = window.devicePixelRatio || 1;
      var width  = $elements.main.offsetWidth  * pixelDensity;
      var MAX_OSK_WIDTH = 1000;
      $guac.osk.resize(Math.min(MAX_OSK_WIDTH, width));
    }

    GuacOsk.destroy = function() {
      $guac.osk            =
      $guac.osk.onkeydown  = 
      $guac.osk.onkeyup    = null;
    };
  }

  return GuacOsk;

});