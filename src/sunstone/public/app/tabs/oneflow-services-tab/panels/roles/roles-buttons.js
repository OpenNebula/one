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
      tip: Locale.tr("This will hold selected pending VMs from being deployed"),
      layout: "vmsplanification_buttons"
    },
    "Role.release" : {
      type: "action",
      text: Locale.tr("Release"),
      layout: "vmsplanification_buttons",
      tip: Locale.tr("This will release held machines")
    },
    "Role.suspend" : {
      type: "action",
      text: Locale.tr("Suspend"),
      layout: "vmspause_buttons",
      tip: Locale.tr("This will suspend selected machines")
    },
    "Role.resume" : {
      type: "action",
      text: '<i class="fa fa-play"/>',
      layout: "vmsplay_buttons",
      tip: Locale.tr("This will resume selected VMs")
    },
    "Role.stop" : {
      type: "action",
      text: Locale.tr("Stop"),
      layout: "vmsstop_buttons",
      tip: Locale.tr("This will stop selected VMs")
    },
    "Role.reboot" : {
      type: "action",
      text: Locale.tr("Reboot"),
      layout: "vmsrepeat_buttons",
      tip: Locale.tr("This will send a reboot action to running VMs")
    },
    "Role.reboot_hard" : {
      type: "action",
      text: Locale.tr("Reboot") + ' <span class="label secondary radius">hard</span>',
      layout: "vmsrepeat_buttons",
      tip: Locale.tr("This will perform a hard reboot on selected VMs")
    },
    "Role.poweroff" : {
      type: "action",
      text: Locale.tr("Power Off"),
      layout: "vmspause_buttons",
      tip: Locale.tr("This will send a power off signal to running VMs. They can be resumed later.")
    },
    "Role.poweroff_hard" : {
      type: "action",
      text: Locale.tr("Power Off") + ' <span class="label secondary radius">hard</span>',
      layout: "vmspause_buttons",
      tip: Locale.tr("This will send a forced power off signal to running VMs. They can be resumed later.")
    },
    "Role.undeploy" : {
      type: "action",
      text: Locale.tr("Undeploy"),
      layout: "vmsstop_buttons",
      tip: Locale.tr("Shuts down the given VM. The VM is saved in the system Datastore.")
    },
    "Role.undeploy_hard" : {
      type: "action",
      text: Locale.tr("Undeploy") + ' <span class="label secondary radius">hard</span>',
      layout: "vmsstop_buttons",
      tip: Locale.tr("Shuts down the given VM. The VM is saved in the system Datastore.")
    },
    "Role.shutdown" : {
      type: "action",
      text: Locale.tr("Shutdown"),
      layout: "vmsdelete_buttons",
      tip: Locale.tr("This will initiate the shutdown process in the selected VMs")
    },
    "Role.shutdown_hard" : {
      type: "action",
      text: Locale.tr("Shutdown") + ' <span class="label secondary radius">hard</span>',
      layout: "vmsdelete_buttons",
      tip: Locale.tr("This will initiate the shutdown-hard (forced) process in the selected VMs")
    },
    "Role.delete" : {
      type: "action",
      text: Locale.tr("Delete"),
      layout: "vmsdelete_buttons",
      tip: Locale.tr("This will delete the selected VMs from the database")
    },
    "Role.delete_recreate" : {
      type: "action",
      text: Locale.tr("Delete") + ' <span class="label secondary radius">recreate</span>',
      layout: "vmsrepeat_buttons",
      tip: Locale.tr("This will delete and recreate VMs to PENDING state")
    }
  };

  return Buttons;
});
