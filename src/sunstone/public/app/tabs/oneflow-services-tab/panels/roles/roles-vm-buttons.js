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
