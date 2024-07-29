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
  var Actions = require("./official-support-tab/actions");
  var SupportUtils = require("./official-support-tab/utils/common");
  var TAB_ID = require("./official-support-tab/tabId");

  var Tab = {
    tabId: TAB_ID,
    resource: "official-support",
    actions: Actions,
    setup: _setup
  };

  return Tab;

  function _setup() {
    SupportUtils.checkValidateOfficialSupport();
    SupportUtils.checkLastVersionSupport();
    $(".support_not_connected > button").on("click", function(e){
      e.stopPropagation();
      window.open("http://opennebula.io/support/", "_blank");
    });
  }
});
