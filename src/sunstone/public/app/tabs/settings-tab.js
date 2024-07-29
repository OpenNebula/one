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
  var Locale = require("utils/locale");
  var OpenNebulaUser = require("opennebula/user");
  var Sunstone = require("sunstone");
  var _actions = require("./users-tab/actions");

  var TAB_ID = require("./settings-tab/tabId");

  _actions["Settings.refresh"] = {
    type: "custom",
    call: _onShow
  };

  var _dialogs = [
    require("tabs/users-tab/dialogs/password"),
    require("./users-tab/dialogs/login-token"),
    require("./users-tab/dialogs/two-factor-auth")
  ];

  var _panels = [
    require("tabs/settings-tab/panels/info"),
    require("tabs/settings-tab/panels/user-config"),
    require("tabs/settings-tab/panels/quotas"),
    require("tabs/settings-tab/panels/group-quotas"),
    require("tabs/settings-tab/panels/accounting"),
    require("tabs/settings-tab/panels/showback"),
    require("tabs/settings-tab/panels/auth")
  ];

  var _formPanels = [
    require("./acls-tab/form-panels/create")
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("Settings"),
    listHeader: Locale.tr("Settings"),
    resource: "Settings",
    actions: _actions,
    content: "<span class=\"fa-stack fa-2x\" style=\"color: #dfdfdf\">" +
      "<i class=\"fas fa-cloud fa-stack-2x\"></i>" +
      "<i class=\"fa  fa-spinner fa-spin fa-stack-1x fa-inverse\"></i>" +
    "</span>",
    dialogs: _dialogs,
    panels: _panels,
  };

  return Tab;

  function _onShow() {
    OpenNebulaUser.show({
      data : {
        id: -1
      },
      success: function(request, user_json) {
        Sunstone.insertPanels(TAB_ID, user_json, TAB_ID, $(".sunstone-list", $("#" + TAB_ID)));
      }
    });
  }
});
