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
    "BackupJob.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "BackupJob.create_dialog" : {
      type: "create_dialog",
      text:  Locale.tr("Create"),
      layout: "create_flatten",
      custom_classes: "only-sunstone-list"
    },
    "BackupJob.start" : {
      type: "action",
      text:  Locale.tr("Start"),
      layout: "main",
    },
    "BackupJob.cancel" : {
      type: 'action',
      text: Locale.tr("Cancel"),
      layout: "main",
    },
    "BackupJob.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      layout: "user_select",
      select: "User",
      tip: Locale.tr("Select the new owner")
    },
    "BackupJob.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      layout: "user_select",
      select: "Group",
      tip: Locale.tr("Select the new group")
    },
    "BackupJob.delete" : {
      type: "confirm",
      layout: "del",
      text: Locale.tr("Delete")
    },
    "BackupJob.lockU" : {
      type: "action",
      text: Locale.tr("Lock"),
      layout: "lock_buttons",
      data: 1
    },
    "BackupJob.unlock" : {
      type: "action",
      text: Locale.tr("Unlock"),
      layout: "lock_buttons"
    },
    "BackupJob.edit_labels" : {
      layout: "labels",
    },
  }
  return Buttons;
});

