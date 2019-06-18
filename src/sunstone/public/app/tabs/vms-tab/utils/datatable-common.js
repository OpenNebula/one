/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
  var LabelsUtils = require('utils/labels/utils');
  var Status = require('utils/status');

  var RESOURCE = "VM";
  var XML_ROOT = "VM";
  var TEMPLATE_ATTR = 'USER_TEMPLATE';

  var _columns = [
    Locale.tr("ID"),
    Locale.tr("Name"),
    Locale.tr("Owner"),
    Locale.tr("Group"),
    Locale.tr("Status"),
    Locale.tr("Used CPU"),
    Locale.tr("Used Memory"),
    Locale.tr("Host"),
    Locale.tr("IPs"),
    Locale.tr("Start Time"),
    "",
    Locale.tr("Hidden Template"),
    Locale.tr("Labels"),
    "search_data"
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
      vncIcon = '<a class="vnc" href="#" vm_id="' + element.ID + '"><i class="fas fa-desktop"/></a>';
    } else if (OpenNebulaVM.isSPICESupported(element)) {
      vncIcon = '<a class="spice" href="#" vm_id="' + element.ID + '"><i class="fas fa-desktop"/></a>';
    } else {
      vncIcon = '';
    }
    if(config && 
      config["system_config"] && 
      config["system_config"]["allow_vnc_federation"] && 
      config["system_config"]["allow_vnc_federation"] === 'no' &&
      config["id_own_federation"] && 
      config["zone_id"] && 
      config["id_own_federation"] !== config["zone_id"])
    {
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

    var hostname = OpenNebulaVM.hostnameStr(element);

    var type;

    if (element.TEMPLATE.VROUTER_ID != undefined){
      type = "VR";
    } else if (element.USER_TEMPLATE.SERVICE_ID != undefined){
      type = "FLOW";
    } else {
      type = "VM";
    }

    var search = {
      NAME:         element.NAME,
      UNAME:        element.UNAME,
      GNAME:        element.GNAME,
      STATUS:       state,
      VM_TYPE:      type,
      HOST:         hostname,
      CLUSTER:      OpenNebulaVM.clusterStr(element),
      STIME_AFTER:  element.STIME,
      STIME_BEFORE: element.STIME
    }
    if (OpenNebulaVM.isFailureState(element.LCM_STATE)){
      value_state = "FAILED"
    } else {
      value_state = OpenNebulaVM.stateStr(element.STATE)
    }
    var color_html = Status.state_lock_to_color("VM", value_state, element_json[RESOURCE.toUpperCase()]["LOCK"]);

    return [
      '<input class="check_item" '+
        'style="vertical-align: inherit;"'+
        'type="checkbox" '+
        'id="' + RESOURCE.toLowerCase() + '_' + element.ID + '" '+
        'name="selected_items" '+
        'value="' + element.ID + '" '+
        'state="'+element.STATE+'" lcm_state="'+element.LCM_STATE+'"/>'+color_html,
      element.ID,
      element.NAME,
      element.UNAME,
      element.GNAME,
      state,
      cpuMonitoring,
      Humanize.size(memoryMonitoring),
      hostname,
      OpenNebulaVM.ipsStr(element),
      Humanize.prettyTimeDatatable(element.STIME),
      vncIcon,
      TemplateUtils.htmlEncode(TemplateUtils.templateToString(element)),
      (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||''),
      btoa(unescape(encodeURIComponent(JSON.stringify(search))))
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
       "",
       "",
       ""
    ];
  }
});