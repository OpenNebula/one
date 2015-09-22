/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
    "Service.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      select: "User",
      tip: Locale.tr("Select the new owner")+":",
      layout: "user_select"
    },
    "Service.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      select: "Group",
      tip: Locale.tr("Select the new group")+":",
      layout: "user_select"
    },
    "Service.shutdown" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Shutdown")
    },
    "Service.recover" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Recover")
    },
    "Service.delete" : {
      type: "confirm",
      text: Locale.tr("Delete"),
      layout: "del",
      tip: Locale.tr("This will delete the selected services")
    }
  };

  return Buttons;
});
