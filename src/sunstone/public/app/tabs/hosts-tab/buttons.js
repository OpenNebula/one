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
    "Host.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Host.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "Host.addtocluster" : {
      type: "confirm_with_select",
      text: Locale.tr("Select cluster"),
      select: "Cluster",
      tip: Locale.tr("Select the destination cluster"),
      layout: "main"
    },
    "Host.enable" : {
      type: "action",
      text: Locale.tr("Enable"),
      layout: "main"
    },
    "Host.disable" : {
      type: "action",
      text: Locale.tr("Disable"),
      layout: "main"
    },
    "Host.offline" : {
      type: "action",
      text: Locale.tr("Offline"),
      layout: "main"
    },
    "Host.delete" : {
      type: "confirm",
      text: Locale.tr("Delete host"),
      layout: "del"
    },
    "Host.edit_labels" : {
      layout: "labels",
    }
  };

  return Buttons;
})
