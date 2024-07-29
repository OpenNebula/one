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
    
    const haveValues = function (object) {
        return Object.values(object).length > 0;
    };


    /*
      Get the status for backupJob.
      @param {object} jsonTemplate
      @returns {string} state.
     */
    var _state = function(jsonTemplate) {
      var errorVms = jsonTemplate.ERROR_VMS
      var outdatedVms = jsonTemplate.OUTDATED_VMS
      var backinUpVms = jsonTemplate.BACKING_UP_VMS
      var lastBackup = jsonTemplate.LAST_BACKUP_TIME
    
      if(haveValues(errorVms)){
        return "Error"
      }

      if(!haveValues(outdatedVms) && !haveValues(backinUpVms)){
        return lastBackup === '0'? "Not started yet" : "Completed"
      }

      if(haveValues(outdatedVms)){
        return "Completed"
      }

      if(haveValues(backinUpVms)){
        return "On Going"
      }
    }
  
    return {
      'state': _state,
    }
});
  