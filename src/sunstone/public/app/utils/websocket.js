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

define(function (require) {

  var Config = require("sunstone-config");
  var Sunstone = require("sunstone");
  var io = require("socket-io-client");
  var OpenNebula = require("opennebula");

  var VM_header = require("tabs/vms-tab/hooks/header");
  var VM_state = require("tabs/vms-tab/hooks/state");

  const STATUS = {
    DISCONNECTED: 0,
    CONNECTED: 1,
    PROCESSING: 2
  };

  var connection = STATUS.DISCONNECTED;

  var _connected = function(){
    return connection == STATUS.CONNECTED;
  };

  var _disconnected = function(){
    return connection == STATUS.DISCONNECTED;
  };

  var _processing = function(){
    return connection == STATUS.PROCESSING;
  };

  var _start = function (fireedgeToken="") {
    /* 
    // This code is disabled to forbid the autorefresh feature

    
    connection = STATUS.PROCESSING;

    if (sunstone_fireedge_active && fireedgeToken != "" ){
      const socket = io(Config.publicFireedgeEndpoint, {
        path: "/fireedge/hooks",
        query: {
          token: fireedgeToken
        }
      });

      // Listen for messages
      socket.on("hooks", function (event) {
        var event_data = event.data;
        if (event_data && event_data.HOOK_MESSAGE && event_data.HOOK_MESSAGE.HOOK_OBJECT){

          var tab_id, callFunction;
          var object = event_data.HOOK_MESSAGE.HOOK_OBJECT;

          switch (object) {
            case "VM":
              tab_id = "vms-tab";
              callFunction = function(data_vm){
                // Update Header and Buttons
                VM_header.pre(data_vm);
                VM_state.pre(data_vm);

                // Update VM Info
                var vm_state = OpenNebula.VM.stateStr(data_vm.VM.STATE);
                var vm_state_class = OpenNebula.VM.stateClass(data_vm.VM.STATE);
                var vm_lcm_state = OpenNebula.VM.lcmStateStr(data_vm.VM.LCM_STATE);
                var vm_lcm_state_class = OpenNebula.VM.lcmStateClass(data_vm.VM.LCM_STATE);

                if (vm_state_class == ""){
                  $("#state_value").html(vm_state);
                  $("#lcm_state_value").html("<span class='label " + vm_lcm_state_class + " round' style='border-radius: 1em; font-weight: bold;'>" + vm_lcm_state + "</span>");
                }
                else{
                  $("#state_value").html("<span class='label " + vm_state_class + " round' style='border-radius: 1em; font-weight: bold;'>" + vm_state + "</span>");
                  $("#lcm_state_value").html(vm_lcm_state);
                }
              };
              break;
            case "HOST":
              tab_id = "hosts-tab";
              callFunction = function(data_host){
                var host_state = OpenNebula.Host.stateStr(data_host.HOST.STATE);
                $("#host_state_value").html(host_state);
              };
              break;
            default:
              break;
          }

          // this code recreate the datatable for VM and HOST this call foundation()

          var response = {};
          response[object] = event_data.HOOK_MESSAGE[object];
          var request = {
            "request": {
              "data": [response[object].ID],
              "method": "show",
              "resource": object
            }
          };
          // update VM and HOST
          var tab = $("#" + tab_id);
          if(
            Sunstone.getDataTable(tab_id) &&
            Sunstone.getDataTable(tab_id).updateElement &&
            typeof Sunstone.getDataTable(tab_id).updateElement === "function"
          ){
            Sunstone.getDataTable(tab_id).updateElement(request, response);
          }
          if (Sunstone.rightInfoVisible(tab) && event_data.HOOK_MESSAGE.RESOURCE_ID == Sunstone.rightInfoResourceId(tab)) {
            callFunction(response);
          }
          if (event_data.HOOK_MESSAGE.STATE == "DONE"){
            Sunstone.getDataTable(tab_id).waitingNodes();
            Sunstone.runAction(object + ".list", {force: true});
          }
        }  
      });

      // Close Socket when close browser or tab.
      window.onbeforeunload = function () {
        socket.close();
        connection = STATUS.DISCONNECTED;
      };

      connection = STATUS.CONNECTED;
    }
    else{
      connection = STATUS.DISCONNECTED;
    } */
  };

  var websocket = {
    "start": _start,
    "connected": _connected,
    "disconnected": _disconnected,
    "processing": _processing,
  };

  return websocket;
});