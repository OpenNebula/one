/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
  require('spice-main');
  var Config = require('sunstone-config');
  var Notifier = require('utils/notifier');

  var _lock = false;
  var _sc;

  return {
    'lockStatus': lockStatus,
    'lock': lock,
    'unlock': unlock,
    'spiceCallback': spiceCallback,
    'disconnect': disconnect
  }

  function lockStatus() {
    return _lock;
  }

  function lock() {
    _lock = true;
  }

  function unlock() {
    _lock = false;
  }

  function spice_error(e) {
    disconnect();
  }

  function disconnect() {
    if (_sc) {
      _sc.stop();
    }
  }

  function agent_connected(sc) {
    window.addEventListener('resize', handle_resize);
    window.spice_connection = this;

    resize_helper(this);
  }

  function spiceCallback(response) {
    var host, port, password, scheme = "ws://", uri, token, vm_name;

    if (Config.vncWSS == "yes") {
      scheme = "wss://";
    }

    host = window.location.hostname;
    port = Config.vncProxyPort;
    password = response["password"];
    token = response["token"];
    vm_name = response["vm_name"];

    if ((!host) || (!port)) {
      console.log("must specify host and port in URL");
      return;
    }

    if (_sc) {
      _sc.stop();
    }

    uri = scheme + host + ":" + port + "?token=" + token;

    try {
      _sc = new SpiceMainConn({uri: uri, screen_id: "spice-screen", dump_id: "debug-div",
                  message_id: "message-div", password: password, onerror: spice_error, onagent: agent_connected});
    }
    catch (e) {
      spice_error(e)
    }

    var url = "spice?";
    url += "host=" + host;
    url += "&port=" + port;
    url += "&token=" + token;
    url += "&password=" + password;
    url += "&encrypt=" + config['user_config']['vnc_wss'];
    url += "&title=" + vm_name;

    $("#open_in_a_new_window_spice").attr('href', url);
  }
});
