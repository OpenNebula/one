/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
  var TAB_ID = 'upgrade-top-tab';

  var UPGRADE     = "<span style='color: #0098c3'>Upgrade Available</span>&nbsp;<span style='color:#DC7D24'><i class='fa fa-exclamation-circle'></i></span>";
  var NO_UPGRADE  = "";
  var UPGRADE_URL = "http://opennebula.org/software/";

  var Tab = {
    tabId: TAB_ID,
    title: "",
    setup: _setup,
    content: ""
  }

  return Tab;

  function _setup() {
    $('#li_upgrade-top-tab > a').on("click", function(e){
      window.location = UPGRADE_URL;
      return false;
    });

    $.ajax({
      url: '/version',
      type: "GET",
      dataType: "json",
      success: function(response) {
        var version = response["version"];

        // remote_version could be null if the server cannot reach the url
        var remote_version = response["remote_version"];

        var tab_title;

        if (remote_version && (version < remote_version)) {
          tab_title = UPGRADE;
        } else {
          tab_title = NO_UPGRADE;
        }

        $("li[id$='upgrade-top-tab'] > a").html(tab_title);
      },
      error: function(response) {
        return null;
      }
    });
  }
});
