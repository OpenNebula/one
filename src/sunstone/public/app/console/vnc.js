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
  var Config = require("sunstone-config");
  var rfb;

  function passwordRequired(rfb) {
    var msg;
    msg = "<form id=\"setPasswordForm\"";
    msg += "  style=\"margin-bottom: 0px\">";
    msg += "Password Required: ";
    msg += "<input type=password size=10 id=\"password_input\" class=\"noVNC_status\">";
    msg += "<\/form>";
    document.querySelector("#noVNC_status_bar").setAttribute("class", "noVNC_status_warn");
    document.querySelector("#noVNC_status").innerHTML = msg;
    document.querySelector("#setPasswordForm").addEventListener("submit", setPassword);
  }
  function setPassword(event) {
    rfb.sendPassword(document.querySelector("#password_input").value);
    event.preventDefault();
    return false;
  }
  function sendCtrlAltDel() {
    rfb.sendCtrlAltDel();
    return false;
  }
  function xvpShutdown() {
    rfb.xvpShutdown();
    return false;
  }
  function xvpReboot() {
    rfb.xvpReboot();
    return false;
  }
  function xvpReset() {
    rfb.xvpReset();
    return false;
  }
  function updateState(rfb, state, oldstate, msg) {
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

  function getQueryVariable(variable)
  {
         var query = window.location.search.substring(1);
         var vars = query.split("&");
         for (var i=0;i<vars.length;i++) {
                 var pair = vars[i].split("=");
                 if(pair[0] == variable){return pair[1];}
         }
         return(false);
  }
  token = window.token;
  var URL = "";
  var proxy_host = window.location.hostname;
  var proxy_port = Config.vncProxyPort;
  var token = getQueryVariable("token");
  var password = getQueryVariable("password");

  var rfbConfig = password? { "credentials": { "password": password } } : {};

  if (window.location.protocol === "https:") {
    URL = "wss";
  } else {
    URL = "ws";
  }
  URL += "://" + window.location.hostname;
  URL += ":" + proxy_port;
  URL += "?host=" + proxy_host;
  URL += "&port=" + proxy_port;
  if(token){
    URL += "&token=" + token;
  }
  URL += "&encrypt=" + Config.vncWSS;

  document.querySelector("#sendCtrlAltDelButton").style.display = "inline";
  document.querySelector("#sendCtrlAltDelButton").onclick = sendCtrlAltDel;
  document.querySelector("#xvpShutdownButton").onclick = xvpShutdown;
  document.querySelector("#xvpRebootButton").onclick = xvpReboot;
  document.querySelector("#xvpResetButton").onclick = xvpReset;

  if ((!proxy_host) || (!proxy_port)) {
    updateState("failed",
        "Must specify host and port in URL");
    return;
  }
  try{
    rfb = new RFB(document.querySelector("#VNC_canvas"), URL, rfbConfig);
  }catch(err){
    console.log("error start NOVNC ", err);
  }
});
