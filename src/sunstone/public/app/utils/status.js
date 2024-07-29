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
    var resource_states = {
      IMAGES:{
        CLONE:"#8A8A8A",
        INIT:"#8A8A8A",
        READY:"#3adb76",
        USED:"#3adb76",
        ERROR:"#ec5840",
        DELETE:"#8A8A8A",
        LOCKED:"#8A8A8A",
        DISABLED:"#8A8A8A",
        USED_PERS: "#3adb76",
        LOCKED_USED: "#8A8A8A",
        LOCKED_USED_PERS: "#8A8A8A",
      },
      HOST:{
        INIT:"#4DBBD3",
        ON:"#3adb76",
        OFF:"#ec5840",
        DISABLED:"lightsalmon"
      },
      DATASTORE:{
        INIT:"#4DBBD3",
        READY:"#3adb76",
        DISABLED:"lightsalmon"
      },
      MARKETPLACEAPP:{
        INIT:"#4DBBD3",
        READY:"#3adb76",
        LOCKED:"lightsalmon",
        ERROR:"#ec5840",
        DISABLED:"lightsalmon"
      },
      VM:{
        INIT:"#4DBBD3",
        PENDING:"#4DBBD3",
        HOLD:"lightsalmon",
        ACTIVE:"#3adb76",
        STOPPED:"lightsalmon",
        SUSPENDED:"lightsalmon",
        DONE:"#ec5840",
        FAILED:"#ec5840",
        POWEROFF:"lightsalmon",
        UNDEPLOYED:"lightsalmon",
        CLONING:"#4DBBD3",
        CLONING_FAILURE:"#ec5840"
      },
      DOCUMENT:{
        PENDING:"#4DBBD3",
        DEPLOYING:"#4DBBD3",
        RUNNING:"#3adb76",
        UNDEPLOYING:"#4DBBD3",
        WARNING:"lightsalmon",
        DONE:"#ec5840",
        FAILED_UNDEPLOYING:"#ec5840",
        FAILED_DEPLOYING:"#ec5840",
        SCALING:"#4DBBD3",
        FAILED_SCALING:"#ec5840",
        COOLDOWN:"#4DBBD3",
        DEPLOYING_NETS:"#4DBBD3",
        UNDEPLOYING_NETS:"#4DBBD3",
        FAILED_DEPLOYING_NETS:"#ec5840",
        FAILED_UNDEPLOYING_NETS:"#ec5840"
      },
      VNET:{
        INIT: "#4DBBD3",
        READY: "#3adb76",
        LOCK_CREATE: "lightsalmon",
        LOCK_DELETE: "lightsalmon",
        LOCKED: "lightsalmon",
        DONE: "#ec5840",
        ERROR: "#ec5840"
      }
    };

    /*
      CONSTRUCTOR
     */

    return {
      'state_lock_to_color': _state_lock_to_color
    }

    /*
      FUNCTION DEFINITIONS
     */

    function _state_lock_to_color(resource, state, lock, set_color){
      var color = "transparent";
      var show_lock = "";

      if ( set_color == undefined ) {
        if (state && resource in resource_states){
          var available_states = resource_states[resource];
          if (state in available_states){
            color = available_states[state];
          }
        }
      } else {
        color = set_color;
      }

      if (lock){
        show_lock = "border-left: 3px solid #373537;";
      }
      
      return '<span style="'+show_lock+' float:left; margin-right: 3px; width: 5px; height: 20px; background: '+color+';"></span>'
    }
  })