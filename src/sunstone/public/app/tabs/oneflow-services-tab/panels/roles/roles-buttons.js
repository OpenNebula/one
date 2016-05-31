/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
  var Locale = require('utils/locale');

  var Buttons = {
    "Role.scale_dialog" : {
      type: "action",
      text: Locale.tr("Scale"),
      layout: "create"
    },
    "Role.hold" : {
      type: "action",
      text: Locale.tr("Hold"),
      layout: "vmsplanification_buttons"
    },
    "Role.release" : {
      type: "action",
      text: Locale.tr("Release"),
      layout: "vmsplanification_buttons"
    },
    "Role.suspend" : {
      type: "action",
      text: Locale.tr("Suspend"),
      layout: "vmspause_buttons"
    },
    "Role.resume" : {
      type: "action",
      text: '<i class="fa fa-play"/>',
      layout: "vmsplay_buttons"
    },
    "Role.stop" : {
      type: "action",
      text: Locale.tr("Stop"),
      layout: "vmsstop_buttons"
    },
    "Role.reboot" : {
      type: "action",
      text: Locale.tr("Reboot"),
      layout: "vmsrepeat_buttons"
    },
    "Role.reboot_hard" : {
      type: "action",
      text: Locale.tr("Reboot") + ' <span class="label secondary radius">hard</span>',
      layout: "vmsrepeat_buttons"
    },
    "Role.poweroff" : {
      type: "action",
      text: Locale.tr("Power Off"),
      layout: "vmspause_buttons"
    },
    "Role.poweroff_hard" : {
      type: "action",
      text: Locale.tr("Power Off") + ' <span class="label secondary radius">hard</span>',
      layout: "vmspause_buttons"
    },
    "Role.undeploy" : {
      type: "action",
      text: Locale.tr("Undeploy"),
      layout: "vmsstop_buttons"
    },
    "Role.undeploy_hard" : {
      type: "action",
      text: Locale.tr("Undeploy") + ' <span class="label secondary radius">hard</span>',
      layout: "vmsstop_buttons"
    },
    "Role.terminate" : {
      type: "action",
      text: Locale.tr("Terminate"),
      layout: "vmsdelete_buttons"
    },
    "Role.terminate_hard" : {
      type: "action",
      text: Locale.tr("Terminate") + ' <span class="label secondary radius">hard</span>',
      layout: "vmsdelete_buttons"
    }
  };

  return Buttons;
});
