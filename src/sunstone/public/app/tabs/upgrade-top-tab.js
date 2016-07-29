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

  var Tab = {
    tabId: TAB_ID,
    title: "",
    setup: _setup,
    content: ""
  }

  return Tab;

  function _setup() {
    $('#li_upgrade-top-tab > a').on("click", function(e){
      var redirect_port = config['upgrade']['redirect_port'];
      var upgrade_url = config['upgrade']['url'];

      if (redirect_port) {
        window.location = document.URL.replace(/(https?:\/\/)([^:\/]+).*$/,"http://$2:"+redirect_port)
      } else {
        window.location = upgrade_url
      }

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
          tab_title = config['upgrade']['upgrade'];
        } else {
          tab_title = config['upgrade']['no_upgrade'];
        }

        $("li[id$='upgrade-top-tab'] > a").html(tab_title);
      },
      error: function(response) {
        return null;
      }
    });
  }
});
