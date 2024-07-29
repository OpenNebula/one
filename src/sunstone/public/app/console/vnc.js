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
  var Config = require("sunstone-config");
  var UtilsConnection = require("utils/info-connection/utils");

  var RFB = require("vnc-rfb").default;
  var _rfb;
  var _is_encrypted = "";

  function setStatus(message="", status=""){
    $(".NOVNC_message").text(message);
    $("#noVNC_status_msg").text(status);
  }

  function connected(){
    setStatus(null, "VNC " + _rfb._rfb_connection_state);
  }

  function disconnectedFromServer(e){
    if (e.detail.clean) {
      setStatus(null, "VNC " + _rfb._rfb_connection_state);
    } else {
      setStatus("Something went wrong, connection is closed", "Failed");
    }
  }

  function desktopNameChange(e) {
    if (e.detail.name) {
      setStatus(null, "VNC " + _rfb._rfb_connection_state);
    }
  }

  function credentialsRequired(e) {
    setStatus("Something went wrong, more credentials must be given to continue", "Failed");
  }

  function sendCtrlAltDel() {
    _rfb.sendCtrlAltDel();
    return false;
  }

  function xvpShutdown() {
    _rfb.xvpShutdown();
    return false;
  }

  function xvpReboot() {
    _rfb.xvpReboot();
    return false;
  }

  function xvpReset() {
    _rfb.xvpReset();
    return false;
  }

  function updateState(rfb, state, _, msg) {
    var s, sb, cad, level;
    s = document.querySelector("#noVNC_status");
    sb = document.querySelector("#noVNC_status_bar");
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
      xvpInit(0);
    }

    if (typeof(msg) !== "undefined") {
      sb.setAttribute("class", "noVNC_status_" + level);
      s.innerHTML = msg;
    }
  }

  function xvpInit(ver) {
    var xvpbuttons;
    xvpbuttons = document.querySelector("#noVNC_xvp_buttons");
    if (ver >= 1) {
      xvpbuttons.style.display = "inline";
    } else {
      xvpbuttons.style.display = "none";
    }
  }

  var endpoint = new URL(window.location.href);
  var encoded_socket = endpoint.searchParams.get("socket");
  var socket_string = atob(encoded_socket);
  
  var socket_endpoint = new URL(socket_string);
  var password = socket_endpoint.searchParams.get("password");
  var info = socket_endpoint.searchParams.get("info");
  
  var info_decode = UtilsConnection.decodeInfoConnection(info);
  UtilsConnection.printInfoConnection($('.NOVNC_info'), info_decode);
  
  var rfbConfig = password? { "credentials": { "password": password } } : {};

  document.querySelector("#sendCtrlAltDelButton").style.display = "inline";
  document.querySelector("#sendCtrlAltDelButton").onclick = sendCtrlAltDel;
  document.querySelector("#xvpShutdownButton").onclick = xvpShutdown;
  document.querySelector("#xvpRebootButton").onclick = xvpReboot;
  document.querySelector("#xvpResetButton").onclick = xvpReset;

  try {
    _rfb = new RFB(document.querySelector("#VNC_canvas"), socket_string, rfbConfig);
    _rfb.addEventListener("connect",  connected);
    _rfb.addEventListener("disconnect", disconnectedFromServer);
    _rfb.addEventListener("desktopname", desktopNameChange);
    _rfb.addEventListener("credentialsrequired", credentialsRequired);
  } catch(err) {
    setStatus("Something went wrong, connection is closed", "Failed");
  }
});
