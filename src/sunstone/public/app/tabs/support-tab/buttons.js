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
    "Support.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Support.upload" : {
      type: "action",
      layout: "main",
      text: '<i class="fa fa-cloud-upload" style="color: rgb(111, 111, 111)"/> '+Locale.tr("Upload a file"),
      custom_classes: "only-right-info"
    },
    "Support.signout" : {
      type: "action",
      layout: "main",
      text: '<i class="fa fa-sign-out fa fa-lg">',
      tip: "Sign out of Commercial Support",
      alwaysActive: true
    },
    "Support.create_dialog" : {
      type: "create_dialog",
      layout: "create",
      text: "Submit a Request"
    }
  };

  return Buttons;
});
