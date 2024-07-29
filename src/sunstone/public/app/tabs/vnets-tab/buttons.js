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

  var VNetButtons = {
    "Network.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Network.create_dialog" : {
      type: "create_dialog",
      text:  Locale.tr("Create"),
      layout: "create_flatten",
      custom_classes: "only-sunstone-list"
    },
    "Network.import_dialog" : {
      type: "create_dialog",
      layout: "create_flatten",
      text:  Locale.tr("Import"),
      custom_classes: "only-sunstone-list" + ((config.id_own_federation !== config.zone_id) ? " hide" : ""),
      alwaysActive: true
    },
    "Network.instantiate_dialog" : {
      type: "create_dialog",
      text:  Locale.tr("Instantiate"),
      layout: "create_flatten",
      custom_classes: "only-sunstone-list"
    },
    "Network.reserve_dialog" : {
      type: "create_dialog",
      layout: "create_flatten",
      text: Locale.tr("Reserve")
    },
    "Network.update_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Update")
    },
    "Network.addtocluster" : {
      type : "action",
      layout: "main",
      text : Locale.tr("Clusters")
    },
    "Network.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      layout: "user_select",
      select: "User",
      tip: Locale.tr("Select the new owner")
    },

    "Network.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      layout: "user_select",
      select: "Group",
      tip: Locale.tr("Select the new group")
    },

    "Network.delete" : {
      type: "confirm",
      layout: "del",
      text: Locale.tr("Delete")
    },
    "Network.edit_labels" : {
      layout: "labels",
    },
    // "Network.lockA" : {
    //   type: "action",
    //   text: Locale.tr("Admin"),
    //   layout: "lock_buttons",
    //   data: 3
    // },
    // "Network.lockM" : {
    //   type: "action",
    //   text: Locale.tr("Manage"),
    //   layout: "lock_buttons",
    //   data: 2
    // },
    "Network.lockU" : {
      type: "action",
      text: Locale.tr("Lock"),
      layout: "lock_buttons",
      data: 1
    },
    "Network.unlock" : {
      type: "action",
      text: Locale.tr("Unlock"),
      layout: "lock_buttons"
    },
    "Network.recover" : {
      type: "confirm_with_select",
      text: Locale.tr("Recover"),
      layout: "main",
      custom_select: '<select class="resource_list_select">\
                    <option value="3">' + Locale.tr("retry") + '</option>\
                    <option value="1">' + Locale.tr("success") + '</option>\
                    <option value="0">' + Locale.tr("failure") + '</option>\
                    <option value="2">' + Locale.tr("delete") + '</option>\
                  </select>'              ,
      tip: Locale.tr("Recovers a stuck Virtual Network after an update operation that didn't finish successfully,\
                  since updating a Virtual Network implies updating the corresponding Virtual Machine NICs. \
                  The recovery may be done by failing, succeeding or retrying the current operation; or deleting \
                  the Virtual Network. <b>You need to manually check the affected VMs and the network resources on \
                  the infrastructure </b>to decide if the operation was successful or not, or if it can be retried."),
    },
  };

  return VNetButtons;
})
