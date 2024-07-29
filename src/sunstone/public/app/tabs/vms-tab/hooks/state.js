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
  /*
    DEPENDENCIES
   */

  var FireedgeValidator = require('utils/fireedge-validator');
  var OpenNebulaVM = require('opennebula/vm');
  var StateActions = require('tabs/vms-tab/utils/state-actions');

  /*
    CONSTANTS
   */

  var XML_ROOT = "VM";

  /*
    FUNCTION DEFINITIONS
   */

  function _pre(info) {
    var element = info[XML_ROOT];

    // Enable only action buttons for the current state
    StateActions.disableAllStateActions();
    StateActions.enableStateActions(element.STATE, element.LCM_STATE);

    var isVNCSupported = Boolean(OpenNebulaVM.isVNCSupported(element)),
      isSPICESupported = Boolean(OpenNebulaVM.isSPICESupported(element)),
      isVMRCSupported = Boolean(OpenNebulaVM.isVMRCSupported(element)),
      isWFileSupported = Boolean(OpenNebulaVM.isWFileSupported(element)),
      isRDPSupported = Boolean(OpenNebulaVM.isConnectionSupported(element, 'rdp')),
      isSSHSupported = Boolean(OpenNebulaVM.isConnectionSupported(element, 'ssh'));

    // All remote buttons are disabled
    var allDisabled = (
      !isVNCSupported &&
      !isSPICESupported &&
      !isVMRCSupported &&
      !isWFileSupported &&
      !isRDPSupported &&
      !isSSHSupported
    );

    var vncAndSpiceController = function() {
      if (isVNCSupported) {
        $(".vnc-sunstone-info").show();
        $(".spice-sunstone-info").hide();
  
      }
      else if (isSPICESupported) {
        $(".spice-sunstone-info").show();
        $(".vnc-sunstone-info").hide();
      }
      else {
        $(".spice-sunstone-info").hide();
        $(".vnc-sunstone-info").hide();
      }
    }

    var sshAndRdpController = function(){
      $('.guac-rdp-button').toggle(isRDPSupported);
      $('.guac-ssh-button').toggle(isSSHSupported);
    }

    vncAndSpiceController();
    
    $("#vmsremote_buttons").toggle(!allDisabled);
    
    if (element && element.TEMPLATE && element.TEMPLATE.TM_MAD_SYSTEM && element.TEMPLATE.TM_MAD_SYSTEM === "vcenter"){
      var monitored = element.MONITORING && element.MONITORING.VCENTER_ESX_HOST;
      if (monitored && !allDisabled) {
        $("#vmsremote_buttons").show();
      }
      else{
        $("#vmsremote_buttons").hide();
      }
    }
    
    // Show / hide virt-viewer button
    $(".vv-sunstone-info").toggle(!!isWFileSupported);

    // Show / hide rdp button
    $(".rdp-sunstone-info").toggle(!!isRDPSupported);

    // Show / hide ssh button
    $(".ssh-sunstone-info").toggle(!!isSSHSupported);

    if(config && 
      config["system_config"] && 
      config["system_config"]["allow_vnc_federation"] && 
      config["system_config"]["allow_vnc_federation"] === 'no' &&
      config["id_own_federation"] && 
      config["zone_id"] && 
      config["id_own_federation"] !== config["zone_id"])
    {
      $(".vnc-sunstone-info").hide();
    }

    var show_noVNC_buttons = function() {
      vncAndSpiceController();
      $(".guac-button").hide();
      $(".vmrc-button").hide();
    }

    var show_fireedge_buttons = function() {
      $(".vnc-button").hide();
      $(".vmrc-button").toggle(isVMRCSupported);
      $(".guac-vnc-button").toggle(!isVMRCSupported);
      sshAndRdpController();
    }

    var show_buttons = function(fireedgeToken) {
      if ((fireedgeToken && fireedgeToken != "") || is_fireedge_configured) {
        show_fireedge_buttons();
      }
      else{
        show_noVNC_buttons();
      }
    }

    FireedgeValidator.validateFireedgeToken(show_buttons, show_buttons);
  }

  
  function _post() {}

  return {
    'pre': _pre,
    'post': _post
  };
});