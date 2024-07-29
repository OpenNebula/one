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

  function GuacKeyboard($guac, $scope, $elements) {
    // Add default destination for input events
    var sink = $guac.sink = new Guacamole.InputSink();
    $elements.displayContainer.appendChild(sink.getElement());

    // Create event listeners at the global level
    var  keyboard = $guac.keyboard = new Guacamole.Keyboard(document);
    keyboard.listenTo(sink.getElement());

    keyboard.onkeydown = function(keysym) {
      $guac.client.sendKeyEvent(1, keysym);
    };

    keyboard.onkeyup = function(keysym) {
      $guac.client.sendKeyEvent(0, keysym);
    };

    // Release all keys when window loses focus
    window.addEventListener('blur', keyboard.reset);

    GuacKeyboard.destroy = function() {
      window.removeEventListener('blur', keyboard.reset);

      $guac.sink                =
      $guac.keyboard            =
      $guac.keyboard.onkeydown  = 
      $guac.keyboard.onkeyup    = null;
    }
  }

  return GuacKeyboard;

});