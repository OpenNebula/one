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
  require('spice-main');

  var host = null, port = null;
  var sc;

  function spice_set_cookie(name, value, days) {
    var date, expires;
    date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toGMTString();
    document.cookie = name + "=" + value + expires + "; path=/";
  };

  function spice_query_var(name, defvalue) {
    var match = RegExp('[?&]' + name + '=([^&]*)')
                      .exec(window.location.search);
    return match ?
        decodeURIComponent(match[1].replace(/\+/g, ' '))
        : defvalue;
  }

  function spice_error(e) {
    disconnect();
  }

  function connect() {
    var host, port, password, scheme = "ws://", uri;

    // By default, use the host and port of server that served this file
    host = spice_query_var('host', window.location.hostname);

    // Note that using the web server port only makes sense
    //  if your web server has a reverse proxy to relay the WebSocket
    //  traffic to the correct destination port.
    var default_port = window.location.port;
    if (!default_port) {
      if (window.location.protocol == 'http:') {
        default_port = 80;
      } else if (window.location.protocol == 'https:') {
        default_port = 443;
      }
    }
    port = spice_query_var('port', default_port);
    if (window.location.protocol == 'https:') {
      scheme = "wss://";
    }

    // If a token variable is passed in, set the parameter in a cookie.
    // This is used by nova-spiceproxy.
    token = spice_query_var('token', null);
    if (token) {
      spice_set_cookie('token', token, 1)
    }

    password = spice_query_var('password', '');
    path = spice_query_var('path', 'websockify');

    if ((!host) || (!port)) {
      console.log("must specify host and port in URL");
      return;
    }

    if (sc) {
      sc.stop();
    }

    uri = scheme + host + ":" + port + "?token=" + token;

    try {
      sc = new SpiceMainConn({uri: uri, screen_id: "spice-screen", dump_id: "debug-div",
                  message_id: "message-div", password: password, onerror: spice_error, onagent: agent_connected});
    }
    catch (e) {
      alert(e.toString());
      disconnect();
    }

  }

  function disconnect() {
    console.log(">> disconnect");
    if (sc) {
      sc.stop();
    }
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      var spice_xfer_area = document.getElementById('spice-xfer-area');
      document.getElementById('spice-area').removeChild(spice_xfer_area);
      document.getElementById('spice-area').removeEventListener('dragover', handle_file_dragover, false);
      document.getElementById('spice-area').removeEventListener('drop', handle_file_drop, false);
    }
    console.log("<< disconnect");
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
    } else {
      console.log("File API is not supported");
    }
  }

  connect();
});
