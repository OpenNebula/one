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
  var mapips = require('./mapips');

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
    "search_data",
    Locale.tr("Leases") //clock leases
  ];

  return {
    'elementArray': _elementArray,
    'emptyElementArray': _emptyElementArray,
    'columns': _columns
  };

  function checkTime(startTime, addedEndTime, warningTime){
    var rtn = false;
    if(startTime && addedEndTime){
      var regexNumber = new RegExp('[0-9]*$','gm');
      var date = parseInt(startTime);
      var added = parseInt(addedEndTime.match(regexNumber)[0]);
      if(!isNaN(date) && !isNaN(added)){
        var operator = addedEndTime.replace(regexNumber, "");
        var finalTime = date;
        switch (operator) {
          case '-':
            finalTime = date - added;
          break;
          default:
            finalTime = date + added;
          break;
        }
        now = new Date();
        var nowInSeconds = Math.round(parseInt(now.getTime()) / 1000);
        if(finalTime >= nowInSeconds && warningTime === undefined){
          rtn = true;
        }else if(!!warningTime){
          var warning = parseInt(warningTime.match(regexNumber)[0]);
          if(!isNaN(warning)){
            operator = warningTime.replace(regexNumber, "");
            var wtime = date;
            switch (operator) {
              case '-':
                wtime = finalTime - warning;
              break;
              default:
                wtime = finalTime + warning;
              break;
            }
            if(finalTime >= nowInSeconds && wtime <= nowInSeconds){
              rtn = true;
            }
          }
        }
      }
    }
    return rtn;
  }

  function renderMapIps(element){
    var render = '';
    if(
      element && 
      element.TEMPLATE && 
      element.TEMPLATE.CONTEXT && 
      element.TEMPLATE.CONTEXT.MAP_PRIVATE && 
      element.TEMPLATE.CONTEXT.MAP_PUBLIC && 
      element.TEMPLATE.NIC &&
      config && 
      config.system_config &&
      config.system_config.extended_vm_info && 
      config.system_config.mapped_ips
    ){
      var nics = element.TEMPLATE.NIC;
      var pblc = element.TEMPLATE.CONTEXT.MAP_PUBLIC;
      var prvt = element.TEMPLATE.CONTEXT.MAP_PRIVATE;
      var renderTitle = true;
      if (!$.isArray(nics)){
        nics = [nics];
      }
      var mapp = new mapips(pblc, prvt);
      nics.forEach(function(nic){
        if(nic && nic.IP){
          var foundip = mapp.renderPublicIp(nic.IP);
          if (foundip){
            if(renderTitle){
              render = $('<div/>').append($('<br/>').add($('<b/>').text(Locale.tr('Mapped Networks')))).html();
              renderTitle = false;
            }
            render += $("<div/>").append($("<br/>").add($("<div/>").text(foundip+" ("+nic.IP+")"))).html();
          }
        }
      });
    }
    return render;
  }

  function leasesClock(element){
    var rtn = "";
    if(
      element && 
      element.STIME && 
      element.USER_TEMPLATE && 
      element.USER_TEMPLATE.SCHED_ACTION && 
      config && 
      config.system_config &&
      config.system_config.leases
    ){
      var actionsArray = [];
      var actions = element.USER_TEMPLATE.SCHED_ACTION;
      var leases = config.system_config.leases;
      if(Array.isArray(element.USER_TEMPLATE.SCHED_ACTION)){
        actionsArray = actions;
      }else{
        actionsArray.push(actions);
      }
      actionsArray.some(function(action){
        if(
          action && 
          action.ACTION && 
          leases && 
          leases[action.ACTION] &&
          leases[action.ACTION].time &&
          !isNaN(parseInt(leases[action.ACTION].time)) &&
          leases[action.ACTION].color
        ){
          if(checkTime(element.STIME, leases[action.ACTION].time)){
            rtn = $("<i/>",{class:"fa fa-clock"}).css("color",leases[action.ACTION].color);
            if(leases[action.ACTION].warning && leases[action.ACTION].warning.time && leases[action.ACTION].warning.color){
              if(checkTime(element.STIME, leases[action.ACTION].time, leases[action.ACTION].warning.time)){
                rtn.css("color", leases[action.ACTION].warning.color);
              }
            }
            rtn = rtn.prop('outerHTML');
            return true;
          }
        }
      });
    }
    return rtn;
  }

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
        cpuMonitoring = element.MONITORING.CPU;
      }

      if (element.MONITORING.MEMORY) {
        memoryMonitoring = element.MONITORING.MEMORY;
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
    };

    if (OpenNebulaVM.isFailureState(element.LCM_STATE)){
      value_state = "FAILED";
    } else {
      value_state = OpenNebulaVM.stateStr(element.STATE);
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
      OpenNebulaVM.ipsStr(element)+renderMapIps(element),
      Humanize.prettyTimeDatatable(element.STIME),
      vncIcon,
      TemplateUtils.htmlEncode(TemplateUtils.templateToString(element)),
      (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||''),
      btoa(unescape(encodeURIComponent(JSON.stringify(search)))),
      leasesClock(element)
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
       "",
       ""
    ];
  }
});