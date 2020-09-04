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

define(function (require) {

  var Config = require("sunstone-config");
  var Sunstone = require('sunstone');


  // user config
  const wss = Config.autorefreshWSS || 'ws';
  const port = Config.autorefreshPort || 2346;
  const host = Config.autorefreshIP || '127.0.0.1';

  var address = wss + "://" + host + ":" + port;
  var ws = new WebSocket(address);
  var csrftoken;

  var _start = function () {
    ws.addEventListener('open', function (event) {
      //console.log("Connected to websocket");
      ws.readyState = 1;
      // Send CSRF token
      var msg = {
        "STATE": ws.readyState,
        "ACTION": "authenticate",
        "DATA": {
          "csrf-token": csrftoken,
        },
      }

      ws.send(JSON.stringify(msg));
    });

    // Listen for messages
    ws.addEventListener('message', function (event) {
      var vm_info = JSON.parse(event.data);
      // console.log(vm_info);
      var response = { "VM": vm_info.HOOK_MESSAGE.VM };
      var request = {
        "request": {
          "data": [response.ID],
          "method": "show",
          "resource": "VM"
        }
      }

      // update VM

      var TAB_ID = "vms-tab";
      var tab = $('#' + TAB_ID);
      Sunstone.getDataTable(TAB_ID).updateElement(request, response);
      if (Sunstone.rightInfoVisible(tab) && vm_info.HOOK_MESSAGE.RESOURCE_ID == Sunstone.rightInfoResourceId(tab)) {
        Sunstone.autorefreshVM(TAB_ID, response);
      }

      if (vm_info.HOOK_MESSAGE.STATE == "DONE"){
        Sunstone.getDataTable(TAB_ID).waitingNodes();
        Sunstone.runAction("VM.list", {force: true});
      }

    });

    // Close Socket when close browser or tab.
    window.onbeforeunload = function () {
      _close();
    };
  };

  var _subscribe = function (vm_id, context) {
    var msg = {
      "SUBSCRIBE": true,
      "VM": vm_id
    }

    ws.send(JSON.stringify(msg));
  };

  var _unsubscribe = function (vm_id) {
    var msg = {
      "SUBSCRIBE": false,
      "VM": vm_id
    }

    ws.send(JSON.stringify(msg));
  };

  var _close = function () {
    ws.onclose = function () { }; // disable onclose handler first
    ws.close()
  };



  var websocket = {
    "start": _start,
    "subscribe": _subscribe,
    "unsubscribe": _unsubscribe,
    "close": _close
  };

  return websocket;
});