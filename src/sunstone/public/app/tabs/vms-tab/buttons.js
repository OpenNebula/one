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
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var Config = require('sunstone-config');
  var confirm = Config.confirmVMActions;
  var text = "action";
  if(confirm){
    text = "confirm";
  }
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
    "VM.upload_marketplace_dialog" : {
      type: "action",
      text: '<i class="fas fa-shopping-cart"/>',
      custom_classes : "state-dependent"
    },
    "VM.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      select: "User",
      layout: "user_select",
      tip: Locale.tr("Select the new owner")
    },
    "VM.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      select: "Group",
      layout: "user_select",
      tip: Locale.tr("Select the new group")
    },
    "VM.deploy" : {
      type: text,
      text: Locale.tr("Deploy"),
      layout: "vmsplanification_buttons",
      custom_classes : "state-dependent"
    },
    "VM.migrate" : {
      type: "action",
      text: Locale.tr("Migrate"),
      layout: "vmsplanification_buttons",
      custom_classes : "state-dependent"
    },
    "VM.migrate_poff" : {
      type: "action",
      text: Locale.tr("Migrate") + ' <span class="label secondary radius">' + Locale.tr("Poweroff") + '</span>',
      layout: "vmsplanification_buttons",
      custom_classes : "state-dependent"
    },
    "VM.migrate_poff_hard" : {
      type: "action",
      text: Locale.tr("Migrate") + ' <span class="label secondary radius">' + Locale.tr("Poweroff-hard") + '</span>',
      layout: "vmsplanification_buttons",
      custom_classes : "state-dependent"
    },
    "VM.migrate_live" : {
      type: "action",
      text: Locale.tr("Migrate") + ' <span class="label secondary radius">' + Locale.tr("live") + '</span>',
      layout: "vmsplanification_buttons",
      custom_classes : "state-dependent not_firecracker"
    },
    "VM.hold" : {
      type: "action",
      text: Locale.tr("Hold"),
      layout: "vmsplanification_buttons",
      custom_classes : "state-dependent"
    },
    "VM.release" : {
      type: "action",
      text: Locale.tr("Release"),
      layout: "vmsplanification_buttons",
      custom_classes : "state-dependent"
    },
    "VM.suspend" : {
      type: text,
      text: Locale.tr("Suspend") + "<span class='right'>&nbsp;" + Tips.html(Locale.tr("Keeps allocated Host resources. The resume operation happens quickly")) + "</span>",
      layout: "vmsstop_buttons",
      custom_classes : "state-dependent"
    },
    "VM.resume" : {
      type: text,
      text: '<i class="fas fa-play"/>',
      layout: "vmsplay_buttons",
      custom_classes : "state-dependent"
    },
    "VM.stop" : {
      type: text,
      text: Locale.tr("Stop")  + "<span class='right'>&nbsp;" + Tips.html(Locale.tr("Frees Host resources. The resume operation may take long")) + "</span>",
      layout: "vmsstop_buttons",
      custom_classes : "state-dependent"
    },
    "VM.reboot" : {
      type: text,
      text: Locale.tr("Reboot"),
      layout: "vmsrepeat_buttons",
      custom_classes : "state-dependent"
    },
    "VM.reboot_hard" : {
      type: text,
      text: Locale.tr("Reboot") + ' <span class="label secondary radius">' + Locale.tr("hard") + '</span>',
      layout: "vmsrepeat_buttons",
      custom_classes : "state-dependent"
    },
    "VM.poweroff" : {
      type: text,
      text: Locale.tr("Power Off") + "<span class='right'>&nbsp;" + Tips.html(Locale.tr("Keeps allocated Host resources. The resume operation happens quickly")) + "</span>",
      layout: "vmsstop_buttons",
      custom_classes : "state-dependent"
    },
    "VM.poweroff_hard" : {
      type: text,
      text: Locale.tr("Power Off") + ' <span class="label secondary radius">' + Locale.tr("hard") + '</span>'  + "<span class='right'>&nbsp;" + Tips.html(Locale.tr("Keeps allocated Host resources. The resume operation happens quickly")) + "</span>",
      layout: "vmsstop_buttons",
      custom_classes : "state-dependent"
    },
    "VM.undeploy" : {
      type: text,
      text: Locale.tr("Undeploy")  + "<span class='right'>&nbsp;" + Tips.html(Locale.tr("Frees Host resources. The resume operation may take long")) + "</span>",
      layout: "vmsstop_buttons",
      custom_classes : "state-dependent"
    },
    "VM.undeploy_hard" : {
      type: text,
      text: Locale.tr("Undeploy") + ' <span class="label secondary radius">' + Locale.tr("hard") + '</span>'  + "<span class='right'>&nbsp;" + Tips.html(Locale.tr("Frees Host resources. The resume operation may take long")) + "</span>",
      layout: "vmsstop_buttons",
      custom_classes : "state-dependent"
    },
    "VM.terminate" : {
      type: "confirm",
      icon: "<i class='fas fa-trash fa-3' style='color:#ec5840'/>",
      text: Locale.tr(" Terminate"),
      layout: "vmsdelete_buttons",
      tip: Locale.tr("This will remove information from non-persistent hard disks"),
      custom_classes : "state-dependent"
    },
    "VM.terminate_hard" : {
      type: "confirm",
      icon: "<i class='fas fa-trash fa-3' style='color:#ec5840'/>",
      text: Locale.tr(" Terminate") + ' <span class="label secondary radius">' + Locale.tr("hard") + '</span>',
      layout: "vmsdelete_buttons",
      tip: Locale.tr("This will remove information from non-persistent hard disks"),
      custom_classes : "state-dependent"
    },
    "VM.resched" : {
      type: text,
      text: Locale.tr("Reschedule"),
      layout: "vmsplanification_buttons",
      custom_classes : "state-dependent"
    },
    "VM.unresched" : {
      type: text,
      text: Locale.tr("Un-Reschedule"),
      layout: "vmsplanification_buttons",
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
                    <option value="5">' + Locale.tr("delete-db") + '</option>\
                  </select>'              ,
      tip: Locale.tr("Recovers a stuck VM that is waiting for a driver operation. \
                    The recovery may be done by failing, succeeding or retrying the current operation. \
                    <b>You need to manually check the VM status on the host</b>, to decide if the operation \
                    was successful or not, or if it can be retried.\
                    <br/>\
                    <br/>Delete: This will delete the selected VMs\
                    <br/>Delete-recreate: This will delete and recreate VMs to PENDING state\
                    <br/>Delete-db: This will delete the selected VMs, but will not perform any action on the hypervisor"),
      custom_classes : "state-dependent"
    },
    "VM.startvnc" : {
      type: "action",
      id: "vm_vnc_action",
      text: '<div class="remote-logo-dropdown"><img src="images/remote_console/noVNC.png"/></div>' + Locale.tr("VNC"),
      layout: "vmsremote_buttons",
      custom_classes: "only-sunstone-info vnc-sunstone-info vnc-button"
    },
    "VM.startvmrc" : {
      type: "action",
      text: '<div class="remote-logo-dropdown"><img src="images/remote_console/vmrc.png"/></div>' + Locale.tr("VMRC"),
      layout: "vmsremote_buttons",
      custom_classes: "only-sunstone-info vnc-sunstone-info vmrc-button"
    },
    "VM.startspice" : {
      type: "action",
      text: '<div class="remote-logo-dropdown"><img src="images/remote_console/spice.png"/></div>' + Locale.tr("SPICE"),
      layout: "vmsremote_buttons",
      custom_classes: "only-sunstone-info spice-sunstone-info"
    },
    "VM.save_virt_viewer" : {
      type: "action",
      text: '<div class="remote-logo-dropdown"><img src="images/remote_console/virtviewer.png"/></div>' + Locale.tr("Virt Viewer"),
      layout: "vmsremote_buttons",
      custom_classes: "only-sunstone-info vv-sunstone-info"
    },
    "VM.guac_vnc" : {
      type: "action",
      text: '<div class="remote-logo-dropdown"><img src="images/remote_console/guacamole-alt.png"/></div>' + Locale.tr("VNC"),
      layout: "vmsremote_buttons",
      custom_classes: "only-sunstone-info vnc-sunstone-info guac-button guac-vnc-button"
    },
    "VM.guac_ssh" : {
      type: "action",
      text: '<div class="remote-logo-dropdown"><img src="images/remote_console/guacamole-alt.png"/></div>' + Locale.tr("SSH"),
      layout: "vmsremote_buttons",
      custom_classes: "only-sunstone-info ssh-sunstone-info guac-button guac-ssh-button"
    },
    "VM.guac_rdp" : {
      type: "action",
      text: '<div class="remote-logo-dropdown"><img src="images/remote_console/guacamole-alt.png"/></div>' + Locale.tr("RDP"),
      layout: "vmsremote_buttons",
      custom_classes: "only-sunstone-info rdp-sunstone-info guac-button guac-rdp-button"
    },
    "VM.save_rdp" : {
      type: "action",
      text: '<div class="remote-logo-dropdown"><img src="images/remote_console/windows.png"/></div>' + Locale.tr("RDP Client"),
      layout: "vmsremote_buttons",
      custom_classes: "only-sunstone-info rdp-sunstone-info"
    },
    "VM.save_as_template" : {
      type: "action",
      text: '<i class="fas fa-save"/>',
      custom_classes : "state-dependent"
    },
    "VM.edit_labels" : {
      layout: "labels",
    },
    // "VM.lockA" : {
    //   type: "action",
    //   text: Locale.tr("Admin"),
    //   layout: "lock_buttons",
    //   data: 3
    // },
    // "VM.lockM" : {
    //   type: "action",
    //   text: Locale.tr("Manage"),
    //   layout: "lock_buttons",
    //   data: 2
    // },
    "VM.lockU" : {
      type: "action",
      text: Locale.tr("Lock"),
      layout: "lock_buttons",
      data: 1
    },
    "VM.unlock" : {
      type: "action",
      text: Locale.tr("Unlock"),
      layout: "lock_buttons"
    },
    "VM.backup_dialog" : {
      type: "action",
      text: Locale.tr("Backup"),
      layout: "vmsplanification_buttons",
      custom_classes : "state-dependent"
    },
  }
  return Buttons;
})
