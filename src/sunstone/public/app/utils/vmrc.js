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

define(function (require) {
  var WMKS = require("wmks");
  var Config = require("sunstone-config");
  var UtilsConnection = require("utils/info-connection/utils");

  var _lock = false;
  var _wmks;
  var _is_encrypted = "";
  var vm_name = ""

  return {
    "lockStatus": lockStatus,
    "lock": lock,
    "unlock": unlock,
    "vmrcCallback": vmrcCallback,
    "disconnect": disconnect,
    "sendCtrlAltDel": sendCtrlAltDel,
    "updateScreen": updateScreen
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

  function setStatus(message = "", status = "") {
    $(".VMRC_message").text(message);
    $("#VMRC_status").text(status);
  }

  function connected() {
    setStatus(null, "VMRC " + _wmks.connectionState + " (" + _is_encrypted + ") to: " + vm_name);
  }

  function disconnectedFromServer(e) {
    if (e.detail.clean) {
      setStatus(null, "VMRC " + _wmks.connectionState + " (" + _is_encrypted + ") to: " + vm_name);
    } else {
      setStatus("Something went wrong, connection is closed", "Failed");
    }
  }

  function render(ticket, host_vmrc, port_vmrc, response){
    var hostname = window.location.hostname;
    var port = window.location.port;
    var protocol = window.location.protocol;
    var fireedge_endpoint = Config.publicFireedgeEndpoint.split("//")[1];
    var fireedge_host = fireedge_endpoint.split(":")[0];
    var fireedge_port = fireedge_endpoint.split(":")[1];

    var info = response.info;
    var info_decode = UtilsConnection.decodeInfoConnection(info);
    UtilsConnection.printInfoConnection($('.VMRC_info'), info_decode)

    // set vm name on title
    vm_name = (info_decode && info_decode.name) ? info_decode.name : ""

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    // Content of response.data
    var ticket = ticket || urlParams.get('ticket');
    var host_vmrc = host_vmrc || urlParams.get('host');
    var port_vmrc = port_vmrc || urlParams.get('port');

    var URL = "";
    if (protocol === "https:") {
      URL = "wss";
      _is_encrypted ="encrypted";
    } else {
      URL = "ws";
      _is_encrypted ="unencrypted";
    }

    URL += "://" + fireedge_endpoint + "/";
    
    var regex = new RegExp("^(ws|wss):\\/\\/[\\w\\D]*?\\/", "gi");
    var link = URL.replace(regex, protocol + "//" + hostname + ":" + port + "fireedge/vmrc?");

    URL += "fireedge/vmrc/" + ticket;
    link += "host=" + fireedge_host;
    link += "&port=" + fireedge_port;
    link += "&ticket=" + ticket;
    link += "&info=" + info;

    try {
      _wmks = WMKS.createWMKS('wmksContainer', {})
        .register(WMKS.CONST.Events.CONNECTION_STATE_CHANGE,
          function (_, data) {
            if (data.state === WMKS.CONST.ConnectionState.CONNECTED) {
              console.log("connection	state	change: connected");
            }
          }
        );
      
        _wmks.eventHandlers["connectionstatechange"].push(connected);
        _wmks.eventHandlers["disconnect"] = disconnectedFromServer;
        
        _wmks.connect(URL);

        $("#VMRC_buttons #open_in_a_new_window").attr("href",link);

    } catch (err) {
      setStatus("Something went wrong, connection is closed", "Failed");
    }
  }

  function vmrcCallback(response) {
    if (response.data) {
      render(
        response.data.ticket,
        response.data.host,
        response.data.port,
        response
      );
    }
  }

  function disconnect() {
    if (_wmks) { _wmks.disconnect(); }
  }

  function sendCtrlAltDel() {
    if (_wmks) { _wmks.sendCAD(); }
  }

  function updateScreen() {    
    _wmks.updateScreen();
  }
});
