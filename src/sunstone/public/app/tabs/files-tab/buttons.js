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
  var ImageButtons = require("tabs/images-tab/buttons");

  var Buttons = {
    "File.refresh" : ImageButtons["Image.refresh"],
    "File.create_dialog" : ImageButtons["Image.create_dialog"],
    "File.chown" : ImageButtons["Image.chown"],
    "File.chgrp" : ImageButtons["Image.chgrp"],
    "File.enable" : ImageButtons["Image.enable"],
    "File.disable" : ImageButtons["Image.disable"],
    "File.delete" : ImageButtons["Image.delete"],
    "File.edit_labels" : ImageButtons["Image.edit_labels"]
  };

  return Buttons;
});
