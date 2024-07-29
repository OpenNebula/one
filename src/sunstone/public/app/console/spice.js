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
  require('spice-main');

  var UtilsConnection = require("utils/info-connection/utils");

  var sc;

  function spice_set_cookie(name, value, days) {
    var date, expires;
    date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toGMTString();
    document.cookie = name + "=" + value + expires + "; path=/";
  };

  function spice_error(e) {
    disconnect();
  }

  function connect() {
    var endpoint = new URL(window.location.href);
    var encoded_socket = endpoint.searchParams.get("socket");
    var socket_string = atob(encoded_socket);
    
    var socket_endpoint = new URL(socket_string);
    var password = socket_endpoint.searchParams.get("password");
    var token = socket_endpoint.searchParams.get("token");
    var info = socket_endpoint.searchParams.get("info");

    var info_decode = UtilsConnection.decodeInfoConnection(info);
    UtilsConnection.printInfoConnection($('.SPICE_info'), info_decode)

    // If a token variable is passed in, set the parameter in a cookie.
    // This is used by nova-spiceproxy.
    if (token) {
      spice_set_cookie('token', token, 1)
    }

    if (sc) {
      sc.stop();
    }

    try {
      sc = new SpiceMainConn({
        uri: socket_string,
        screen_id: "spice-screen",
        dump_id: "debug-div",
        message_id: "message-div",
        password: password,
        onerror: spice_error,
        onagent: agent_connected
      });
    }
    catch (e) {
      alert(e.toString());
      disconnect();
    }
  }

  function disconnect() {
    if (sc) {
      sc.stop();
    }
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      var spice_xfer_area = document.getElementById('spice-xfer-area');
      document.getElementById('spice-area').removeChild(spice_xfer_area);
      document.getElementById('spice-area').removeEventListener('dragover', handle_file_dragover, false);
      document.getElementById('spice-area').removeEventListener('drop', handle_file_drop, false);
    }
  }

  function agent_connected(sc) {
    window.addEventListener('resize', handle_resize);
    window.spice_connection = this;

    resize_helper(this);

    if (window.File && window.FileReader && window.FileList && window.Blob) {
      var spice_xfer_area = document.createElement("div");
      spice_xfer_area.setAttribute('id', 'spice-xfer-area');
      document.getElementById('spice-area').addEventListener('dragover', handle_file_dragover, false);
      document.getElementById('spice-area').addEventListener('drop', handle_file_drop, false);
    }
  }

  connect();
});
