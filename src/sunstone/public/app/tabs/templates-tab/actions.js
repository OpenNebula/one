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
  var Actions = require("tabs/templates-tab/actions-common");

  var TAB_ID = require("tabs/templates-tab/tabId");
  var CREATE_DIALOG_ID = require("tabs/templates-tab/form-panels/create/formPanelId");
  var CLONE_DIALOG_ID = require("tabs/templates-tab/dialogs/clone/dialogId");
  var INSTANTIATE_DIALOG_ID = require("tabs/templates-tab/form-panels/instantiate/formPanelId");
  var IMPORT_DIALOG_ID = require("tabs/templates-tab/form-panels/import/formPanelId");
  var CONFIRM_DIALOG_ID = require("utils/dialogs/generic-confirm/dialogId");

  var RESOURCE = "Template";

  return Actions(TAB_ID, RESOURCE,
    {
      "TAB_ID"  : TAB_ID,
      "CREATE_DIALOG_ID"  : CREATE_DIALOG_ID,
      "CLONE_DIALOG_ID" : CLONE_DIALOG_ID,
      "INSTANTIATE_DIALOG_ID" : INSTANTIATE_DIALOG_ID,
      "IMPORT_DIALOG_ID"  : IMPORT_DIALOG_ID,
      "CONFIRM_DIALOG_ID" : CONFIRM_DIALOG_ID,
    });
});
