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
  var RFB = require("vnc-rfb").default;
  var Config = require("sunstone-config");
  var _lock = false;
  var _rfb;
  var _message = "";
  var _status = "Loading";
  var _is_encrypted = "";

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

  function setStatus(message="", status=""){
    _message = message;
    _status = status;
    $(".NOVNC_message").text(_message);
    $("#VNC_status").text(_status);
  }

  function connected(){
    setStatus(null, "VNC " + _rfb._rfb_connection_state + " (" + _is_encrypted + ") to: " + _rfb._fb_name);
  }

  function disconnectedFromServer(e){
    if (e.detail.clean) {
      setStatus(null, "VNC " + _rfb._rfb_connection_state + " (" + _is_encrypted + ") to: " + _rfb._fb_name);
    } else {
      setStatus("Something went wrong, connection is closed", "Failed");
    }
  }

  function desktopNameChange(e) {
    if (e.detail.name) {
      setStatus(null, "VNC " + _rfb._rfb_connection_state + " (" + _is_encrypted + ") to: " + e.detail.name);
    }
  }

  function credentialsRequired(e) {
    setStatus("Something went wrong, more credentials must be given to continue", "Failed");
  }

  function vncCallback(response) {
    var URL = "";
    var proxy_host = window.location.hostname;
    var proxy_port = Config.vncProxyPort;
    var pw = response["password"];
    var token = response["token"];
    var vm_name = response["vm_name"];
    var protocol = window.location.protocol;
    var hostname = window.location.hostname;
    var port = window.location.port;
    var rfbConfig = pw? { "credentials": { "password": pw } } : {};

    if (protocol === "https:") {
      URL = "wss";
      _is_encrypted ="encrypted";
    } else {
      URL = "ws";
      _is_encrypted ="unencrypted";
    }
    URL += "://" + hostname;
    URL += ":" + proxy_port;
    URL += "?host=" + proxy_host;
    URL += "&port=" + proxy_port;
    URL += "&token=" + token;
    URL += "&encrypt=" + Config.vncWSS;
    URL += "&title=" + vm_name;

    if (!Config.requestVNCPassword) {
      URL += "&password=" + pw;
    }
    var re = new RegExp("^(ws|wss):\\/\\/[\\w\\D]*?\\?", "gi");
    var link = URL.replace(re, protocol + "//" + hostname + ":" + port + "/vnc?");

    try{
      _rfb = new RFB(document.querySelector("#VNC_canvas"), URL, rfbConfig);
      _rfb.addEventListener("connect",  connected);
      _rfb.addEventListener("disconnect", disconnectedFromServer);
      _rfb.addEventListener("desktopname", desktopNameChange);
      _rfb.addEventListener("credentialsrequired", credentialsRequired);
    }catch(err){
      setStatus("Something went wrong, connection is closed", "Failed");
      console.log("error start NOVNC ", err);
    }

    $("#open_in_a_new_window").attr("href", link);
  }

  function disconnect() {
    if (_rfb) { _rfb.disconnect(); }
  }

  function sendCtrlAltDel() {
    if (_rfb) { _rfb.sendCtrlAltDel(); }
  }
});
