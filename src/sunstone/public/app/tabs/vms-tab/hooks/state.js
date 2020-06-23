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

define(function(require) {
  /*
    DEPENDENCIES
   */

  var OpenNebulaVM = require('opennebula/vm');
  var StateActions = require('../utils/state-actions');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var RESOURCE = "VM";
  var XML_ROOT = "VM";

  /*
    FUNCTION DEFINITIONS
   */

  function _pre(info, contextTabId) {
    var element = info[XML_ROOT];

    // Enable only action buttons for the current state
    StateActions.disableAllStateActions();
    StateActions.enableStateActions(element.STATE, element.LCM_STATE);

    var isVNCSupported = OpenNebulaVM.isVNCSupported(element),
      isSPICESupported = OpenNebulaVM.isSPICESupported(element),
      isWFileSupported = OpenNebulaVM.isWFileSupported(element),
      isRDPSupported = OpenNebulaVM.isRDPSupported(element);

    // All remote buttons are disabled
    var allDisabled = (!isVNCSupported && !isSPICESupported && !isWFileSupported && !isRDPSupported);
    $("#vmsremote_buttons").toggle(!allDisabled);

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
    
    // Show / hide virt-viewer button
    $(".vv-sunstone-info").toggle(isWFileSupported);

    // Show / hide rdp button
    $(".rdp-sunstone-info").toggle(isRDPSupported);

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
  }

  function _post(info, contextTabId) {
  }

  return {
    'pre': _pre,
    'post': _post
  };
});