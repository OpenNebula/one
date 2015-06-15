define(function(require) {
  var Locale = require('utils/locale');
  var VMButtons = require('tabs/vms-tab/buttons');

  var Buttons = {
    "RoleVM.hold" : VMButtons["VM.hold"],
    "RoleVM.release" : VMButtons["VM.release"],
    "RoleVM.suspend" : VMButtons["VM.suspend"],
    "RoleVM.resume" : VMButtons["VM.resume"],
    "RoleVM.stop" : VMButtons["VM.stop"],
    "RoleVM.reboot" : VMButtons["VM.reboot"],
    "RoleVM.reboot_hard" : VMButtons["VM.reboot_hard"],
    "RoleVM.poweroff" : VMButtons["VM.poweroff"],
    "RoleVM.poweroff_hard" : VMButtons["VM.poweroff_hard"],
    "RoleVM.undeploy" : VMButtons["VM.undeploy"],
    "RoleVM.undeploy_hard" : VMButtons["VM.undeploy_hard"],
    "RoleVM.shutdown" : VMButtons["VM.shutdown"],
    "RoleVM.shutdown_hard" : VMButtons["VM.shutdown_hard"],
    "RoleVM.delete" : VMButtons["VM.delete"],
    "RoleVM.delete_recreate" : VMButtons["VM.delete_recreate"],
    "RoleVM.resched" : VMButtons["VM.resched"],
    "RoleVM.unresched" : VMButtons["VM.unresched"]
  };

  return Buttons;
});