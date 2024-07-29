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

    CORES_ID = '#CORES_PER_SOCKET';

    /*
        CONSTRUCTOR
    */

    return {
        "generateCores": _generateCores,
        "calculateSockets": _calculateSockets,
        "selectOption": _selectOption,
    };

    /*
        FUNCTIONS
    */

    function _generateCores(vcpu_selector){
      $(CORES_ID).find('option').remove();
      $(CORES_ID).append($('<option>').val("").text("-"));
      var vcpu_count =  parseInt($(vcpu_selector).val()) || 0;
      for (var i = 1; i <= vcpu_count; i++){
          if (vcpu_count%i === 0){
          $(CORES_ID).append($('<option>').val(i).text((i).toString()));
          }
      }
      $(CORES_ID + ' option[value=""]').prop('selected', true);
    }

    function _calculateSockets(vcpu_selector){
      var vcpu = $(vcpu_selector).val();
      var cores_per_socket = $(CORES_ID).val();
  
      if ((vcpu != "") && (cores_per_socket != "")){
        $("div.socket_info").show();
        var number_sockets = vcpu/cores_per_socket;
        $("#SOCKETS")
          .prop("disabled", false)
          .val(number_sockets)
          .prop("disabled", true);
        $("#numa-sockets")
          .prop("disabled", false)
          .val(number_sockets)
          .prop("disabled", true);
      }
      else{
        $("#SOCKETS")
          .prop("disabled", false)
          .val("")
          .prop("disabled", true);
        $("#numa-sockets")
          .prop("disabled", false)
          .val("")
          .prop("disabled", true);
        $("div.socket_info").hide();
      }
    }

    function _selectOption(value){
      $( CORES_ID + " option[value=\"" + value + "\"]")
        .prop("selected", true)
        .change();
    }

});