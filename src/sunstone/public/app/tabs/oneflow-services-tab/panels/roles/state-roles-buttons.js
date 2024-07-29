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
  var OpenNebulaFlow = require('opennebula/service');
  var Buttons = require('./roles-buttons');

  var ALL_ACTION_BUTTONS = $.map(Buttons, function(_, action) {
    return [action]
  });

  var STATE_ACTIONS = {};

  STATE_ACTIONS[OpenNebulaFlow.STATES.PENDING] =
    ['Role.scale_dialog','Role.terminate', 'Role.terminate_hard'];

  STATE_ACTIONS[OpenNebulaFlow.STATES.DEPLOYING] =
    ['Role.scale_dialog','Role.terminate', 'Role.terminate_hard'];

  STATE_ACTIONS[OpenNebulaFlow.STATES.RUNNING] =
    [ALL_ACTION_BUTTONS];

  STATE_ACTIONS[OpenNebulaFlow.STATES.UNDEPLOYING] =
    ['Role.scale_dialog','Role.terminate', 'Role.terminate_hard'];

  STATE_ACTIONS[OpenNebulaFlow.STATES.WARNING] =
    ['Role.scale_dialog','Role.terminate', 'Role.terminate_hard'];

  STATE_ACTIONS[OpenNebulaFlow.STATES.DONE] =
    ['Role.scale_dialog','Role.terminate', 'Role.terminate_hard'];

  STATE_ACTIONS[OpenNebulaFlow.STATES.FAILED_UNDEPLOYING] =
    ['Role.scale_dialog','Role.terminate', 'Role.terminate_hard'];

  STATE_ACTIONS[OpenNebulaFlow.STATES.FAILED_DEPLOYING] =
    ['Role.scale_dialog','Role.terminate', 'Role.terminate_hard'];

  STATE_ACTIONS[OpenNebulaFlow.STATES.SCALING] =
    ['Role.scale_dialog','Role.terminate', 'Role.terminate_hard'];

  STATE_ACTIONS[OpenNebulaFlow.STATES.FAILED_SCALING] =
    ['Role.scale_dialog','Role.terminate', 'Role.terminate_hard'];

  STATE_ACTIONS[OpenNebulaFlow.STATES.COOLDOWN] =
    ['Role.scale_dialog','Role.terminate', 'Role.terminate_hard'];

  STATE_ACTIONS[OpenNebulaFlow.STATES.DEPLOYING_NETS] =
    ['Role.scale_dialog','Role.terminate', 'Role.terminate_hard'];

  STATE_ACTIONS[OpenNebulaFlow.STATES.UNDEPLOYING_NETS] =
    ['Role.scale_dialog','Role.terminate', 'Role.terminate_hard'];

  STATE_ACTIONS[OpenNebulaFlow.STATES.FAILED_DEPLOYING_NETS] =
    ['Role.scale_dialog','Role.terminate', 'Role.terminate_hard'];

  STATE_ACTIONS[OpenNebulaFlow.STATES.FAILED_UNDEPLOYING_NETS] =
    ['Role.scale_dialog','Role.terminate', 'Role.terminate_hard'];

  return {
    'disableStateButton': disableStateButton,
    'enableStateButton': enableStateButton,
    'enableStateActions': enableStateActions
  };

  function disableStateButton(action) {
    $(".role-state-dependent[href='" + action + "']")
      .prop("disabled", true)
      .removeClass("action-enabled")
      .addClass("action-disabled")
      .on("click.stateaction", function() { return false; });
  }

  function enableStateButton(action) {
    $(".role-state-dependent[href='" + action + "']")
      .removeAttr("disabled")
      .addClass("action-enabled")
      .removeClass("action-disabled")
      .off("click.stateaction")
  }

  function enableStateActions(state) {
    var state = parseInt(state);
    var actionsAvailable = STATE_ACTIONS[state]

    if (actionsAvailable === undefined) return;

    $.each(ALL_ACTION_BUTTONS, function(_, action) {
      const isDisabled = actionsAvailable.indexOf(action) !== -1

      isDisabled ? disableStateButton(action) : enableStateButton(action)
    });
  }
});
