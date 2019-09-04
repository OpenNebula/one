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
  var _lock = false;
  var _rfb;
  var _message = "";
  var _status = "Loading";

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

  function connected(){
    status("","Loaded");
  }

  function status(message="", status=""){
    _message = message;
    _status = status;
    $(".NOVNC_message").text(_message);
    $("#VNC_status").text(_status);
  }

  function disconnectedFromServer(e){
    if (e.detail.clean) {
      status("", "Loaded");
    } else {
      status("Something went wrong, connection is closed", "Failed");
    }
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
    } else {
      URL = "ws";
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
    }catch(err){
      status("Something went wrong, connection is closed", "Failed");
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
