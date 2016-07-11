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

  var Buttons = {
    "ServiceTemplate.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "ServiceTemplate.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "ServiceTemplate.update_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Update")
    },
    "ServiceTemplate.instantiate_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Instantiate")
    },
    "ServiceTemplate.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      select: "User",
      layout: "user_select",
      tip: Locale.tr("Select the new owner")
    },
    "ServiceTemplate.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      select: "Group",
      layout: "user_select",
      tip: Locale.tr("Select the new group")
    },
    "ServiceTemplate.clone_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Clone")
    },
    "ServiceTemplate.delete" : {
      type: "confirm",
      text: Locale.tr("Delete"),
      layout: "del",
      tip: Locale.tr("This will delete the selected templates")
    },
    "ServiceTemplate.edit_labels" : {
      layout: "labels",
    }
  };

  return Buttons;
});
