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
    "Template.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Template.create_dialog" : {
      type: "create_dialog",
      text:  Locale.tr("Create"),
      layout: "create_flatten",
      custom_classes: "only-sunstone-list"
    },
    "Template.import_dialog" : {
      type: "create_dialog",
      text:  Locale.tr("Import"),
      layout: "create_flatten",
      custom_classes: "only-sunstone-list" + ((config.id_own_federation !== config.zone_id) ? " hide" : ""),
      alwaysActive: true
    },
    "Template.upload_marketplace_dialog" : {
      type: "action",
      layout: "main",
      text: '<i class="fas fa-shopping-cart"/>'
    },
    "Template.update_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Update")
    },
    "Template.instantiate_vms" : {
      type: "action",
      text:  Locale.tr("Instantiate"),
      layout: "main"
    },
    "Template.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      layout: "user_select",
      select: "User",
      tip: Locale.tr("Select the new owner"),
    },
    "Template.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      layout: "user_select",
      select: "Group",
      tip: Locale.tr("Select the new group"),
    },
    "Template.clone_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Clone")
    },
    "Template.share" : {
      type: "confirm",
      layout: "user_select",
      text: Locale.tr("Share"),
      tip: Locale.tr("The template, along with any image referenced by it, will be shared with the group's users. Permission changed: GROUP USE"),
    },
    "Template.unshare" : {
      type: "confirm",
      layout: "user_select",
      text: Locale.tr("Unshare"),
      tip: Locale.tr("The template, along with any image referenced by it, will be unshared with the group's users. Permission changed: GROUP USE"),
    },
    "Template.delete_dialog" : {
      type: "action",
      layout: "del",
      text: Locale.tr("Delete")
    },
    "Template.edit_labels" : {
      layout: "labels",
    },
    "Template.lockU" : {
      type: "action",
      text: Locale.tr("Lock"),
      layout: "lock_buttons",
      data: 1
    },
    "Template.unlock" : {
      type: "action",
      text: Locale.tr("Unlock"),
      layout: "lock_buttons"
    }
  };

  return Buttons;
})
