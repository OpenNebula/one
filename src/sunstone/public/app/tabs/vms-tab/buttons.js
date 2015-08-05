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
      text: Locale.tr("Migrate") + ' <span class="label secondary radius">live</span>',
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
      text: Locale.tr("Reboot") + ' <span class="label secondary radius">hard</span>',
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
      text: Locale.tr("Power Off") + ' <span class="label secondary radius">hard</span>',
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
      text: Locale.tr("Undeploy") + ' <span class="label secondary radius">hard</span>',
      layout: "vmsstop_buttons",
      tip: Locale.tr("Shuts down the given VM. The VM is saved in the system Datastore."),
      custom_classes : "state-dependent"
    },
    "VM.shutdown" : {
      type: "confirm",
      text: Locale.tr("Shutdown"),
      layout: "vmsdelete_buttons",
      tip: Locale.tr("This will initiate the shutdown process in the selected VMs"),
      custom_classes : "state-dependent"
    },
    "VM.shutdown_hard" : {
      type: "confirm",
      text: Locale.tr("Shutdown") + ' <span class="label secondary radius">hard</span>',
      layout: "vmsdelete_buttons",
      tip: Locale.tr("This will initiate the shutdown-hard (forced) process in the selected VMs"),
      custom_classes : "state-dependent"
    },

    "VM.delete" : {
      type: "confirm",
      text: Locale.tr("Delete"),
      layout: "vmsdelete_buttons",
      tip: Locale.tr("This will delete the selected VMs from the database"),
      custom_classes : "state-dependent"
    },
    "VM.delete_recreate" : {
      type: "confirm",
      text: Locale.tr("Delete") + ' <span class="label secondary radius">recreate</span>',
      layout: "vmsrepeat_buttons",
      tip: Locale.tr("This will delete and recreate VMs to PENDING state"),
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
                    <option value="2">'              + Locale.tr("retry") + '</option>\
                    <option value="1">'              + Locale.tr("success") + '</option>\
                    <option value="0">'              + Locale.tr("failure") + '</option>\
                    </select>'              ,
      tip: Locale.tr("Recovers a stuck VM that is waiting for a driver operation. \
                    The recovery may be done by failing, succeeding or retrying the current operation. \
                    YOU NEED TO MANUALLY CHECK THE VM STATUS ON THE HOST, to decide if the operation \
                    was successful or not, or if it can be retried."),
      custom_classes : "state-dependent"
    },
    "VM.startvnc" : {
      type: "action",
      text: '<i class="fa fa-desktop" style="color: rgb(111, 111, 111)"/> ' + Locale.tr("VNC"),
      custom_classes: "only-right-info vnc-right-info",
      tip: Locale.tr("VNC")
    },
    "VM.startspice" : {
      type: "action",
      text: '<i class="fa fa-desktop" style="color: rgb(111, 111, 111)"/> ' + Locale.tr("SPICE"),
      custom_classes: "only-right-info spice-right-info",
      tip: Locale.tr("SPICE")
    },
    "VM.saveas_template" : {
      type: "action",
      text: '<i class="fa fa-save"/>',
      tip: Locale.tr("This Virtual Machine will be saved in a new Template. You can then create a new Virtual Machine using this Template"),
      custom_classes : "state-dependent"
    },
  }

  return Buttons;
})
