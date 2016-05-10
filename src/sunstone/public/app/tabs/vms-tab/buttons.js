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
    "VM.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "VM.create_dialog" : {
      type: "action",
      layout: "create",
      alwaysActive: true
    },
    "VM.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      select: "User",
      layout: "user_select",
      tip: Locale.tr("Select the new owner") + ":"
    },
    "VM.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      select: "Group",
      layout: "user_select",
      tip: Locale.tr("Select the new group") + ":"
    },
    "VM.deploy" : {
      type: "action",
      text: Locale.tr("Deploy"),
      tip: Locale.tr("This will deploy the selected VMs on the chosen host"),
      layout: "vmsplanification_buttons",
      custom_classes : "state-dependent"
    },
    "VM.migrate" : {
      type: "action",
      text: Locale.tr("Migrate"),
      tip: Locale.tr("This will migrate the selected VMs to the chosen host"),
      layout: "vmsplanification_buttons",
      custom_classes : "state-dependent"
    },
    "VM.migrate_live" : {
      type: "action",
      text: Locale.tr("Migrate") + ' <span class="label secondary radius">' + Locale.tr("live") + '</span>',
      tip: Locale.tr("This will live-migrate the selected VMs to the chosen host"),
      layout: "vmsplanification_buttons",
      custom_classes : "state-dependent"
    },
    "VM.hold" : {
      type: "action",
      text: Locale.tr("Hold"),
      tip: Locale.tr("This will hold selected pending VMs from being deployed"),
      layout: "vmsplanification_buttons",
      custom_classes : "state-dependent"
    },
    "VM.release" : {
      type: "action",
      text: Locale.tr("Release"),
      layout: "vmsplanification_buttons",
      tip: Locale.tr("This will release held machines"),
      custom_classes : "state-dependent"
    },
    "VM.suspend" : {
      type: "action",
      text: Locale.tr("Suspend"),
      layout: "vmspause_buttons",
      tip: Locale.tr("This will suspend selected machines"),
      custom_classes : "state-dependent"
    },
    "VM.resume" : {
      type: "action",
      text: '<i class="fa fa-play"/>',
      layout: "vmsplay_buttons",
      tip: Locale.tr("This will resume selected VMs"),
      custom_classes : "state-dependent"
    },
    "VM.stop" : {
      type: "action",
      text: Locale.tr("Stop"),
      layout: "vmsstop_buttons",
      tip: Locale.tr("This will stop selected VMs"),
      custom_classes : "state-dependent"
    },
    "VM.reboot" : {
      type: "action",
      text: Locale.tr("Reboot"),
      layout: "vmsrepeat_buttons",
      tip: Locale.tr("This will send a reboot action to running VMs"),
      custom_classes : "state-dependent"
    },
    "VM.reboot_hard" : {
      type: "action",
      text: Locale.tr("Reboot") + ' <span class="label secondary radius">' + Locale.tr("hard") + '</span>',
      layout: "vmsrepeat_buttons",
      tip: Locale.tr("This will perform a hard reboot on selected VMs"),
      custom_classes : "state-dependent"
    },
    "VM.poweroff" : {
      type: "action",
      text: Locale.tr("Power Off"),
      layout: "vmspause_buttons",
      tip: Locale.tr("This will send a power off signal to running VMs. They can be resumed later."),
      custom_classes : "state-dependent"
    },
    "VM.poweroff_hard" : {
      type: "action",
      text: Locale.tr("Power Off") + ' <span class="label secondary radius">' + Locale.tr("hard") + '</span>',
      layout: "vmspause_buttons",
      tip: Locale.tr("This will send a forced power off signal to running VMs. They can be resumed later."),
      custom_classes : "state-dependent"
    },
    "VM.undeploy" : {
      type: "action",
      text: Locale.tr("Undeploy"),
      layout: "vmsstop_buttons",
      tip: Locale.tr("Shuts down the given VM. The VM is saved in the system Datastore."),
      custom_classes : "state-dependent"
    },
    "VM.undeploy_hard" : {
      type: "action",
      text: Locale.tr("Undeploy") + ' <span class="label secondary radius">' + Locale.tr("hard") + '</span>',
      layout: "vmsstop_buttons",
      tip: Locale.tr("Shuts down the given VM. The VM is saved in the system Datastore."),
      custom_classes : "state-dependent"
    },
    "VM.terminate" : {
      type: "confirm",
      text: Locale.tr("Terminate"),
      layout: "vmsdelete_buttons",
      tip: Locale.tr("This will initiate the terminate process in the selected VMs"),
      custom_classes : "state-dependent"
    },
    "VM.terminate_hard" : {
      type: "confirm",
      text: Locale.tr("Terminate") + ' <span class="label secondary radius">' + Locale.tr("hard") + '</span>',
      layout: "vmsdelete_buttons",
      tip: Locale.tr("This will initiate the terminate-hard (forced) process in the selected VMs"),
      custom_classes : "state-dependent"
    },
    "VM.resched" : {
      type: "action",
      text: Locale.tr("Reschedule"),
      layout: "vmsplanification_buttons",
      tip: Locale.tr("This will reschedule selected VMs"),
      custom_classes : "state-dependent"
    },
    "VM.unresched" : {
      type: "action",
      text: Locale.tr("Un-Reschedule"),
      layout: "vmsplanification_buttons",
      tip: Locale.tr("This will cancel the rescheduling for the selected VMs"),
      custom_classes : "state-dependent"
    },
    "VM.recover" : {
      type: "confirm_with_select",
      text: Locale.tr("Recover"),
      layout: "vmsplanification_buttons",
      custom_select: '<select class="resource_list_select">\
                    <option value="2">' + Locale.tr("retry") + '</option>\
                    <option value="1">' + Locale.tr("success") + '</option>\
                    <option value="0">' + Locale.tr("failure") + '</option>\
                    <option value="3">' + Locale.tr("delete") + '</option>\
                    <option value="4">' + Locale.tr("delete-recreate") + '</option>\
                  </select>'              ,
      tip: Locale.tr("Recovers a stuck VM that is waiting for a driver operation. \
                    The recovery may be done by failing, succeeding or retrying the current operation. \
                    YOU NEED TO MANUALLY CHECK THE VM STATUS ON THE HOST, to decide if the operation \
                    was successful or not, or if it can be retried.\
                    <br/>\
                    <br/>Delete: This will delete the selected VMs\
                    <br/>Delete-recreate: This will delete and recreate VMs to PENDING state"),
      custom_classes : "state-dependent"
    },
    "VM.startvnc" : {
      type: "action",
      text: '<i class="fa fa-desktop" style="color: rgb(111, 111, 111)"/> ' + Locale.tr("VNC"),
      custom_classes: "only-sunstone-info vnc-sunstone-info",
      tip: Locale.tr("VNC")
    },
    "VM.startspice" : {
      type: "action",
      text: '<i class="fa fa-desktop" style="color: rgb(111, 111, 111)"/> ' + Locale.tr("SPICE"),
      custom_classes: "only-sunstone-info spice-sunstone-info",
      tip: Locale.tr("SPICE")
    },
    "VM.save_as_template" : {
      type: "action",
      text: '<i class="fa fa-save"/>',
      tip: Locale.tr("This Virtual Machine will be saved in a new Template. You can then create a new Virtual Machine using this Template"),
      custom_classes : "state-dependent"
    },
  }

  return Buttons;
})
