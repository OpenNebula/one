/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
  var RFB = require("vnc-rfb").default;
  console.log("utils");
  var Config = require("sunstone-config");

  var _lock = false;
  var _rfb;

  return {
    "lockStatus": lockStatus,
    "lock": lock,
    "unlock": unlock,
    "vncCallback": vncCallback,
    "disconnect": disconnect,
    "sendCtrlAltDel": sendCtrlAltDel
  };

  function lockStatus() {
    return _lock;
  }

  function lock() {
    _lock = true;
  }

  function unlock() {
    _lock = false;
  }

  function vncCallback(response) {
    var URL = "";
    var proxy_host = window.location.hostname;
    var proxy_port = Config.vncProxyPort;
    var pw = response["password"];
    var token = response["token"];
    var vm_name = response["vm_name"];

    if (window.location.protocol === "https:") {
      URL = "wss";
    } else {
      URL = "ws";
    }
    URL += "://" + window.location.hostname;
    URL += ":" + proxy_port;
    URL += "?host=" + proxy_host; //se podra borrar porque ya esta!
    URL += "&port=" + proxy_port; //se podra borrar porque ya esta!
    URL += "&token=" + token;
    URL += "&encrypt=" + Config.vncWSS;
    URL += "&title=" + vm_name;

    if (!Config.requestVNCPassword) {
      URL += "&password=" + pw;
    }
    _rfb = new RFB(document.querySelector("#VNC_canvas"), URL);

    console.log("test-> ", _rfb);

    $("#open_in_a_new_window").attr("href", URL);
  }

  function disconnect() {
    if (_rfb) { _rfb.disconnect(); }
  }

  function sendCtrlAltDel() {
    if (_rfb) { _rfb.sendCtrlAltDel(); }
  }

  //This is taken from noVNC examples
  function updateVNCState(rfb, state, oldstate, msg) {
    var s, sb, cad, klass;
    s = document.querySelector("#VNC_status");
    sb = document.querySelector("#VNC_status_bar");
    cad = document.querySelector("#sendCtrlAltDelButton");
    switch (state) {
      case "failed":       level = "error";  break;
      case "fatal":        level = "error";  break;
      case "normal":       level = "normal"; break;
      case "disconnected": level = "normal"; break;
      case "loaded":       level = "normal"; break;
      default:             level = "warn";   break;
    }

    if (state === "normal") {
      cad.disabled = false;
    } else {
      cad.disabled = true;
    }

    if (typeof(msg) !== "undefined") {
      sb.setAttribute("class", "noVNC_status_" + level);
      s.innerHTML = msg;
    }
  }
});
