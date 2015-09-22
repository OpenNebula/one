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
    "Template.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Template.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "Template.import_dialog" : {
      type: "create_dialog",
      layout: "create",
      text:  Locale.tr("Import"),
      icon: '<i class="fa fa-download">',
      alwaysActive: true
    },
    "Template.update_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Update")
    },
    "Template.instantiate_vms" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Instantiate")
    },
    "Template.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      layout: "user_select",
      select: "User",
      tip: Locale.tr("Select the new owner") + ":",
    },
    "Template.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      layout: "user_select",
      select: "Group",
      tip: Locale.tr("Select the new group") + ":",
    },
    "Template.clone_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Clone")
    },
    "Template.delete" : {
      type: "confirm",
      layout: "del"
    }
  }

  return Buttons;
})
