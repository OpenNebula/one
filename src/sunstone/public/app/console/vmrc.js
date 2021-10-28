/* -------------------------------------------------------------------------- */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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
  var UtilsConnection = require("utils/info-connection/utils");

  var _wmks;
  var _is_encrypted = "";

  function setStatus(message="", status=""){
    $(".VMRC_message").text(message);
    $("#VMRC_status_msg").text(status);
  }

  function connected(){
    setStatus(null, "VMRC " + _wmks.connectionState);
  }

  function disconnectedFromServer(e){
    if (e.detail.clean) {
      setStatus(null, "VMRC " + _wmks.connectionState);
    } else {
      setStatus("Something went wrong, connection is closed", "Failed");
    }
  }

  function sendCtrlAltDel() {
    if (_wmks) { _wmks.sendCAD(); }
  }

  function enterFullScreen() {
    if (_wmks) { _wmks.enterFullScreen(); }
  }

  function selectLanguage() {
    if(!_wmks) return;
    var keyboardLayoutId = $("#selectLanguage").find(":selected").val();
    _wmks.setOption("keyboardLayoutId",keyboardLayoutId);
  }

  function keyboardSelector() {
    $("#selectLanguage").toggle();
  }

  function updateScreen() {
    _wmks.updateScreen();
  }

  document.querySelector("#sendCtrlAltDelButton").style.display = "inline";
  document.querySelector("#sendCtrlAltDelButton").onclick = sendCtrlAltDel;

  document.querySelector("#fullScreenButton").onclick = enterFullScreen;
  document.querySelector("#keyboardSelector").onclick = keyboardSelector;
  document.querySelector("#selectLanguage").onchange = selectLanguage;

  var endpoint = new URL(window.location.href);
  var encoded_socket = endpoint.searchParams.get("socket");
  var socket_string = atob(encoded_socket);

  var socket_endpoint = new URL(socket_string);
  var host = socket_endpoint.searchParams.get("host");
  var port = socket_endpoint.searchParams.get("port");
  var info = socket_endpoint.searchParams.get("info");
  var ticket = socket_endpoint.searchParams.get("ticket");

  var info_decode = UtilsConnection.decodeInfoConnection(info);
  UtilsConnection.printInfoConnection($(".VMRC_info"), info_decode);


  try{
    _wmks = WMKS.createWMKS("wmksContainer", {
      fixANSIEquivalentKeys: true,
    })
      .register(WMKS.CONST.Events.CONNECTION_STATE_CHANGE,
        function (_, data) {
          if (typeof cons !== "undefined" && data.state == cons.ConnectionState.CONNECTED) {
            console.log("connection	state	change: connected");
          }
        }
      );

    _wmks.eventHandlers["connectionstatechange"].push(connected);
    _wmks.eventHandlers["disconnect"] = disconnectedFromServer;
    _wmks.vm_name = info_decode && info_decode.name;

    _wmks.connect(socket_string);
  }catch(err){
    setStatus("Something went wrong, connection is closed", "Failed");
  }

  $(window).resize(updateScreen);
});
