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

  var MarketPlaceButtons = {
    "MarketPlace.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "MarketPlace.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "MarketPlace.enable" : {
      type: "action",
      text: Locale.tr("Enable"),
      layout: "main"
    },
    "MarketPlace.disable" : {
      type: "action",
      text: Locale.tr("Disable"),
      layout: "main"
    },
    "MarketPlace.update_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Update")
    },
    "MarketPlace.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      select: "User",
      layout: "user_select",
      tip: Locale.tr("Select the new owner")
    },
    "MarketPlace.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      select: "Group",
      layout: "user_select",
      tip: Locale.tr("Select the new group")
    },
    "MarketPlace.delete" : {
      type: "confirm",
      text: Locale.tr("Delete"),
      layout: "del"
    },
    "MarketPlace.edit_labels" : {
      layout: "labels",
    }
  };

  return MarketPlaceButtons;
})
