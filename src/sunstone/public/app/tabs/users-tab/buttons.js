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
    "User.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "User.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "User.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change primary group"),
      layout: "user_select",
      select: "Group",
      tip: Locale.tr("This will change the primary group of the selected users. Select the new group")
    },
    "User.enable" : {
      type: "action",
      text: Locale.tr("Enable"),
      layout: "main"
    },
    "User.disable" : {
      type: "action",
      text: Locale.tr("Disable"),
      layout: "main"
    },
    "User.delete" : {
      type: "confirm",
      text: Locale.tr("Delete"),
      layout: "del"
    },
    "User.edit_labels" : {
      layout: "labels",
    }
  };

  return Buttons;
});
