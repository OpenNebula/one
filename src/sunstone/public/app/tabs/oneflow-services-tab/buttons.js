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

  var Buttons = {
    "Service.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Service.update_dialog" : {
      type: "action",
      text: Locale.tr("Update"),
      layout: "main",
    },
    "Service.create_dialog" : {
      type: "action",
      layout: "create",
      alwaysActive: true
    },
    "Service.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      select: "User",
      tip: Locale.tr("Select the new owner"),
      layout: "user_select"
    },
    "Service.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      select: "Group",
      tip: Locale.tr("Select the new group"),
      layout: "user_select"
    },
    "Service.recover" : {
      type: "action",
      text: Locale.tr("Recover"),
      layout: "vmsplanification_buttons",
    },
    "Service.recover_delete" : {
      type: "action",
      text: Locale.tr("Recover") + ' <span class="label secondary radius">' + Locale.tr("delete") + '</span>',
      layout: "vmsplanification_buttons",
    },
    "Service.shutdown" : {
      type: "confirm",
      text: Locale.tr("Terminate"),
      layout: "vmsdelete_buttons",
      tip: Locale.tr("This will remove information from non-persistent hard disks")
    },
    "Service.delete" : {
      type: "confirm",
      text: Locale.tr("Delete"),
      layout: "vmsdelete_buttons",
      tip: Locale.tr("This will delete the selected services")
    },
    "Service.edit_labels" : {
      layout: "labels",
    },
    "Service.purge_done" : {
      type: "action",
      text: Locale.tr("Purge done"),
      alwaysActive: true,
      tip: Locale.tr("This will delete all services in DONE state to free some space in your database"),
      layout: "purge",
    }
  };

  return Buttons;
});
