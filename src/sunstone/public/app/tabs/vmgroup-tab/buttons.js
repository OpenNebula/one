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
  var TemplateButtons = require('tabs/templates-tab/buttons');
  var Tips = require('utils/tips');

  var Buttons = {
    "VMGroup.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "VMGroup.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "VMGroup.update_dialog" : {
      type : "action",
      layout: "main",
      text : Locale.tr("Update")
    },
    "VMGroup.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      layout: "user_select",
      select: "User",
      tip: Locale.tr("Select the new owner")
    },
    "VMGroup.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      layout: "user_select",
      select: "Group",
      tip: Locale.tr("Select the new group")
    },
    "VMGroup.delete" : {
      type: "confirm",
      text: Locale.tr("Delete"),
      layout: "del"
    },
    // "VMGroup.lockA" : {
    //   type: "action",
    //   text: Locale.tr("Admin"),
    //   layout: "lock_buttons",
    //   data: 3
    // },
    // "VMGroup.lockM" : {
    //   type: "action",
    //   text: Locale.tr("Manage"),
    //   layout: "lock_buttons",
    //   data: 2
    // },
    "VMGroup.lockU" : {
      type: "action",
      text: Locale.tr("Lock"),
      layout: "lock_buttons",
      data: 1
    },
    "VMGroup.unlock" : {
      type: "action",
      text: Locale.tr("Unlock"),
      layout: "lock_buttons"
    }/*,
    "VMGroup.edit_labels" : {
      layout: "labels",
    }*/
  };

  return Buttons;
});
