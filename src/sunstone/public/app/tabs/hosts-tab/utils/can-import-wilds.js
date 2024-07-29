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

define(function(require){
  /*
    CONSTRUCTOR
   */

  return _canImportWilds;

  /*
    FUNCTION DEFINITIONS
   */

  /* Check if any of the existing VMs in the Host define the IMPORT_TEMPLATE
      attribute to be imported into OpenNebula.
    @param {Object} element Host element as returned by OpenNebula
    @result {Boolean}
  */
  function _canImportWilds(element) {
    var canImportWilds = false;
    if (element.TEMPLATE.VM) {
      var vms = element.TEMPLATE.VM;
      if (!Array.isArray(vms)) { // If only 1 VM convert to array
        vms = [vms];
      }
      $.each(vms, function() {
        if (this.IMPORT_TEMPLATE) {
          canImportWilds = true;
          return false;
        }
      });
    }
    return canImportWilds;
  }
});
