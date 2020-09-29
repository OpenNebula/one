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
  var FireedgeValidator = require('utils/fireedge-validator');
  var io = require('socket-io-client');  
  
  var _start = function () {
    if (sessionStorage.getItem(FireedgeValidator.sessionVar) == 'true'){
      const socket = io(Config.fireedgeEndpoint, {
        path: '/zeromq',
        query: {
          token: fireedge_token
        }
      });

      // Listen for messages
      socket.on('zeroMQ', function (event) {
        var event_data = event.data;
        // console.log(vm_info);
        if (event_data && event_data.HOOK_MESSAGE && event_data.HOOK_MESSAGE.HOOK_TYPE && event_data.HOOK_MESSAGE.HOOK_TYPE != 'API'){
          
          var tab_id;
          if (event_data.HOOK_MESSAGE.HOOK_OBJECT){
            var object = event_data.HOOK_MESSAGE.HOOK_OBJECT;

            switch (object) {
              case "VM":
                tab_id = "vms-tab"
                break;
              case "HOST":
                tab_id = "hosts-tab"
                break;
              default:
                break;
              }

            var response = {};
            response[object] = event_data.HOOK_MESSAGE[object];
            var request = {
              "request": {
                "data": [response.ID],
                "method": "show",
                "resource": object
              }
            }

            // update VM and HOST
            var tab = $('#' + tab_id);
            Sunstone.getDataTable(tab_id).updateElement(request, response);
            if (Sunstone.rightInfoVisible(tab) && event_data.HOOK_MESSAGE.RESOURCE_ID == Sunstone.rightInfoResourceId(tab)) {
              Sunstone.autorefresh(tab_id, response);
            }

            if (event_data.HOOK_MESSAGE.STATE == "DONE"){
              Sunstone.getDataTable(tab_id).waitingNodes();
              Sunstone.runAction(object + ".list", {force: true});
            }
          }
        }
      });

      // Close Socket when close browser or tab.
      window.onbeforeunload = function () {
        socket.close();
      };
    }
  };

  var websocket = {
    "start": _start
  };

  return websocket;
});