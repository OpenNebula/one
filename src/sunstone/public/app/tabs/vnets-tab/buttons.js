/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
      layout: "create"
    },
    "Network.import_dialog" : {
      type: "create_dialog",
      layout: "create",
      text:  Locale.tr("Import"),
      icon: '<i class="fa fa-download"/>',
      alwaysActive: true
    },
    "Network.update_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Update")
    },
    "Network.reserve_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Reserve"),
      custom_classes: "only-sunstone-info reserve-sunstone-info",
    },
    "Network.addtocluster" : {
      type : "action",
      layout: "main",
      text : Locale.tr("Select cluster")
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
    "Network.lockA" : {
      type: "action",
      text: Locale.tr("Admin"),
      layout: "lock_buttons",
      data: 3
    },
    "Network.lockM" : {
      type: "action",
      text: Locale.tr("Manage"),
      layout: "lock_buttons",
      data: 2
    },
    "Network.lockU" : {
      type: "action",
      text: Locale.tr("Use"),
      layout: "lock_buttons",
      data: 1
    },
    "Network.unlock" : {
      type: "action",
      text: Locale.tr("Unlock"),
      layout: "lock_buttons"
    }
  };

  return VNetButtons;
})
