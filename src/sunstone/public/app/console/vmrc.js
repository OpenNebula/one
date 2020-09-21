/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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
  require("jquery");
  require("jquery-ui");
  var WMKS = require("wmks");
  var Config = require("sunstone-config");
  var _wmks;
  var _is_encrypted = "";

  function setStatus(message="", status=""){
    $(".VMRC_message").text(message);
    $("#VMRC_status").text(status);
  }

  function connected(){
    setStatus(null, "VMRC " + _wmks.connectionState + " (" + _is_encrypted + ") to: " + _wmks.vm_name);
  }

  function disconnectedFromServer(e){
    if (e.detail.clean) {
      setStatus(null, "VMRC " + _wmks.connectionState + " (" + _is_encrypted + ") to: " + _wmks.vm_name);
    } else {
      setStatus("Something went wrong, connection is closed", "Failed");
    }
  }

  function desktopNameChange(name) {
    if (e.detail.name) {
      setStatus(null, "VMRC " + _wmks.connectionState + " (" + _is_encrypted + ") to: " + name);
    }
  }

  function credentialsRequired(e) {
    setStatus("Something went wrong, more credentials must be given to continue", "Failed");
  }
  
  function sendCtrlAltDel() {
    if (_wmks) { _wmks.sendCAD(); }
  }

  function updateState(state, msg) {
    var s, sb, cad, level;
    s = document.querySelector("#VMRC_status");
    sb = document.querySelector("#VMRC_status_bar");
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
      sb.setAttribute("class", "VMRC_status_" + level);
      s.innerHTML = msg;
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

  var URL = "";
  var host = getQueryVariable("host");
  var port = getQueryVariable("port");
  var ticket = getQueryVariable("ticket");
  var vm_name = getQueryVariable("name");

  if (window.location.protocol === "https:") {
    URL = "wss";
    _is_encrypted = "encrypted";
  } else {
    URL = "ws";
    _is_encrypted = "unencrypted";
  }
  URL += "://" + host;
  URL += ":" + port;
  URL += "/vmrc/" + ticket;

  document.querySelector("#sendCtrlAltDelButton").style.display = "inline";
  document.querySelector("#sendCtrlAltDelButton").onclick = sendCtrlAltDel;
  
  if ((!host) || (!port)) {
    updateState("failed",
        "Must specify host and port in URL");
    return;
  }

  try{
    _wmks = WMKS.createWMKS("wmksContainer", {})
      .register(WMKS.CONST.Events.CONNECTION_STATE_CHANGE,
        function (event, data) {
          if (typeof cons !== 'undefined' && data.state == cons.ConnectionState.CONNECTED) {
            console.log("connection	state	change	:	connected");
          }
        }
      );
    
    _wmks.eventHandlers["connectionstatechange"].push(connected);
    _wmks.eventHandlers["disconnect"] = disconnectedFromServer;
    
    _wmks.connect(URL);
    _wmks["vm_name"] = vm_name;
  }catch(err){
    setStatus("Something went wrong, connection is closed", "Failed");
    console.log("error start VMRC ", err);
  }
});
