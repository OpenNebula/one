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
    "Cluster.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
    "Cluster.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "Cluster.update_dialog" : {
        type : "action",
        layout: "main",
        text : Locale.tr("Update")
    },
    "Cluster.delete" : {
        type: "confirm",
        layout: "del",
        text: Locale.tr("Delete")
    },
    "Cluster.edit_labels" : {
      layout: "labels",
    }
  };

  return Buttons;
});
