/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

  var OpenNebulaVM = require('opennebula/vm');
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var TemplateUtils = require('utils/template-utils');

  var RESOURCE = "VM";
  var XML_ROOT = "VM";

  var _columns = [
    Locale.tr("ID") ,
    Locale.tr("Owner") ,
    Locale.tr("Group"),
    Locale.tr("Name"),
    Locale.tr("Status"),
    Locale.tr("Used CPU"),
    Locale.tr("Used Memory"),
    Locale.tr("Host"),
    Locale.tr("IPs"),
    Locale.tr("Start Time"),
    "",
    Locale.tr("Hidden Template")
  ];

  return {
    'elementArray': _elementArray,
    'emptyElementArray': _emptyElementArray,
    'columns': _columns
  };

  function _elementArray(element_json) {
    var element = element_json[XML_ROOT];

    var state;

    if (element.STATE == OpenNebulaVM.STATES.ACTIVE) {
      state = OpenNebulaVM.shortLcmStateStr(element.LCM_STATE);
    } else {
      state = OpenNebulaVM.stateStr(element.STATE);
    }

    // VNC icon
    var vncIcon;
    if (OpenNebulaVM.isVNCSupported(element)) {
      vncIcon = '<a class="vnc" href="#" vm_id="' + element.ID + '"><i class="fa fa-desktop"/></a>';
    } else if (OpenNebulaVM.isSPICESupported(element)) {
      vncIcon = '<a class="spice" href="#" vm_id="' + element.ID + '"><i class="fa fa-desktop"/></a>';
    } else {
      vncIcon = '';
    }

    var cpuMonitoring = 0;
    var memoryMonitoring = 0;
    if (element.MONITORING) {
      if (element.MONITORING.CPU) {
        cpuMonitoring = element.MONITORING.CPU
      }

      if (element.MONITORING.MEMORY) {
        memoryMonitoring = element.MONITORING.MEMORY
      }
    }
    
    return [
      '<input class="check_item" '+
        'type="checkbox" '+
        'id="' + RESOURCE.toLowerCase() + '_' + element.ID + '" '+
        'name="selected_items" '+
        'value="' + element.ID + '" '+
        'state="'+element.STATE+'" lcm_state="'+element.LCM_STATE+'"/>',
       element.ID,
       element.UNAME,
       element.GNAME,
       element.NAME,
       state,
       cpuMonitoring,
       Humanize.size(memoryMonitoring),
       OpenNebulaVM.hostnameStr(element),
       OpenNebulaVM.ipsStr(element),
       Humanize.prettyTime(element.STIME),
       vncIcon,
       TemplateUtils.templateToString(element)
    ];
  }

  function _emptyElementArray(vmId) {
    return [
      '<input class="check_item" type="checkbox" id="' + RESOURCE.toLowerCase() + '_' +
                             vmId + '" name="selected_items" value="' +
                             vmId + '"/>',
       vmId,
       "",
       "",
       "",
       "",
       "",
       "",
       "",
       "",
       "",
       "",
       ""
    ];
  }
});
