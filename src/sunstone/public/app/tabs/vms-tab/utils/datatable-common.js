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

  var Humanize = require("utils/humanize");
  var LabelsUtils = require("utils/labels/utils");
  var Locale = require("utils/locale");
  var OpenNebulaVM = require("opennebula/vm");
  var ScheduleActions = require("utils/schedule_action");
  var Status = require("utils/status");
  var TemplateUtils = require("utils/template-utils");
  var VMRemoteActions = require("utils/remote-actions");

  var RESOURCE = "VM";
  var XML_ROOT = "VM";
  var TEMPLATE_ATTR = "USER_TEMPLATE";

  var _columns = [
    Locale.tr("ID"),
    Locale.tr("Name"),
    Locale.tr("Owner"),
    Locale.tr("Group"),
    Locale.tr("Status"),
    Locale.tr("Host"),
    Locale.tr("IPs"),
    Locale.tr("Start Time"),
    "",
    Locale.tr("Hidden Template"),
    Locale.tr("Labels"),
    "search_data",
    Locale.tr("Charter") //clock leases
  ];

  return {
    "elementArray": _elementArray,
    "emptyElementArray": _emptyElementArray,
    "tooltipCharters": showCharterInfo,
    "columns": _columns,
    "leasesClock": leasesClock
  };

  function checkTime(startTime, addedEndTime, warningTime, rtnTime){
    var rtn = false;

    if (startTime && addedEndTime) {
      var regexNumber = new RegExp("[0-9]*$","gm");
      var date = parseInt(startTime,10);
      var added = parseInt(addedEndTime.match(regexNumber)[0],10);

      if(!isNaN(date) && !isNaN(added)){
        var operator = addedEndTime.replace(regexNumber, "");
        var finalTime = date;
        switch (operator) {
          case "-":
            finalTime = date - added;
          break;
          default:
            finalTime = date + added;
          break;
        }

        now = new Date();
        var nowGetTime = parseInt(now.getTime(),10);
        var nowInSeconds = Math.round(nowGetTime / 1000);

        if (finalTime >= nowInSeconds && warningTime === undefined) {
          rtn = rtnTime? finalTime - nowInSeconds : true;
        }
        else if(!!warningTime) {
          var warning = parseInt(warningTime.match(regexNumber)[0], 10);

          if(!isNaN(warning)){
            operator = warningTime.replace(regexNumber, "");
            var wtime = date;

            switch (operator) {
              case "-":
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

  function showCharterInfo(){
    var classInfo = "charterInfo";
    var styleTips = {
      "position":"absolute",
      "background":"#d7d0d0",
      "padding":"8px",
      "z-index":"1",
      "min-width":"8rem",
      "font-family": "\"Lato\",\"Helvetica Neue\",Helvetica,Roboto,Arial,sans-serif",
      "color":"#000",
      "font-weight": "bold"
    };
    $(".describeCharter").off("mouseenter").on("mouseenter",function(e){
      $(this).find(".charterInfo").remove();
      var start = $(this).attr("data_start");
      var add = $(this).attr("data_add");
      var action = $(this).attr("data_action");
      if((start && start.length) && (add && add.length) && (action && action.length)){
        var date = checkTime(start, add, undefined, true);
        if(typeof date === "number"){
          $(this).append(
            $("<div/>",{"class":classInfo}).css(styleTips).append(
              $("<div/>").css({"display":"inline"}).text(action).add(
                $("<div/>").css({"display":"inline"}).text(
                  " "+Locale.tr("will run in")+" "+ScheduleActions.parseTime(date)
                )
              )
            )
          );
        }
      }
    });
    $(".describeCharter").off("mouseleave").on("mouseleave", function(e){
      $(this).find("."+classInfo).remove();
    });
  }

  function leasesClock(element){
    var rtn = "";
    if(
      element &&
      element.STIME &&
      element.TEMPLATE &&
      element.TEMPLATE.SCHED_ACTION &&
      config &&
      config.system_config &&
      config.system_config.leases
    ){
      var actionsArray = [];
      var actions = element.TEMPLATE.SCHED_ACTION;
      var leases = config.system_config.leases;
      if(Array.isArray(actions)){
        actionsArray = actions;
      }else{
        actionsArray.push(actions);
      }
      actionsArray.some(function(action){
        if(
          action &&
          action.ACTION &&
          action.TIME &&
          leases &&
          leases[action.ACTION] &&
          leases[action.ACTION].time &&
          !isNaN(parseInt(leases[action.ACTION].time)) &&
          leases[action.ACTION].color
        ){
          var endTime = (action.TIME.startsWith("+")? action.TIME : action.TIME - element.STIME).toString();

          if(checkTime(element.STIME, endTime)){
            rtn = $("<i/>",{class:"describeCharter fa fa-clock",data_start:element.STIME, data_add:endTime, data_action:action.ACTION}).css({"position":"relative","color":leases[action.ACTION].color});
            if(
              leases[action.ACTION].warning &&
              leases[action.ACTION].warning.time &&
              leases[action.ACTION].warning.color
            ){
              if(checkTime(element.STIME, action.TIME, leases[action.ACTION].warning.time)){
                rtn.css("color", leases[action.ACTION].warning.color);
              }
            }
            rtn = rtn.prop("outerHTML");
            return true;
          }
        }
      });
    }
    return rtn;
  }

  function _elementArray(element_json) {
    var element = element_json[XML_ROOT];

    var state = (element.STATE == OpenNebulaVM.STATES.ACTIVE)
      ? OpenNebulaVM.shortLcmStateStr(element.LCM_STATE)
      : OpenNebulaVM.stateStr(element.STATE);

    var actions = VMRemoteActions.renderActionsHtml(element);

    var cpuMonitoring = 0, memoryMonitoring = 0;
    if (element.MONITORING) {
      if (element.MONITORING.CPU) {
        cpuMonitoring = element.MONITORING.CPU;
      }

      if (element.MONITORING.MEMORY) {
        memoryMonitoring = element.MONITORING.MEMORY;
      }
    }

    var hostname = OpenNebulaVM.hostnameStr(element);

    var type = (element && element.TEMPLATE && element.TEMPLATE.VROUTER_ID && element.TEMPLATE.VROUTER_ID != undefined)
      ? "VR"
      : (element && element.USER_TEMPLATE && element.USER_TEMPLATE.SERVICE_ID && element.USER_TEMPLATE.SERVICE_ID != undefined)
        ? "FLOW" : "VM";

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

    var value_state = (OpenNebulaVM.isFailureState(element.LCM_STATE))
      ? "FAILED" : OpenNebulaVM.stateStr(element.STATE);

    var color_html = Status.state_lock_to_color("VM", value_state, element_json[RESOURCE.toUpperCase()]["LOCK"]);

    var vm_name = element.USER_TEMPLATE.ERROR || element.USER_TEMPLATE.SCHED_MESSAGE ?  "<span class='warning-message'><i class='fas fa-exclamation-triangle'></i></span> " + element.NAME : element.NAME;

    return [
      "<input class=\"check_item\" "+
        "style=\"vertical-align: inherit;\""+
        "type=\"checkbox\" "+
        "id=\"" + RESOURCE.toLowerCase() + "_" + element.ID + "\" "+
        "name=\"selected_items\" "+
        "value=\"" + element.ID + "\" "+
        "state=\""+element.STATE+"\" lcm_state=\""+element.LCM_STATE+"\"/>"+color_html,
      element.ID,
      vm_name,
      element.UNAME,
      element.GNAME,
      state,
      hostname,
      OpenNebulaVM.ipsDropdown(element),
      Humanize.prettyTimeDatatable(element.STIME),
      actions,
      TemplateUtils.htmlEncode(TemplateUtils.templateToString(element)),
      (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||""),
      btoa(unescape(encodeURIComponent(JSON.stringify(search)))),
      leasesClock(element)
    ];
  }


  function _emptyElementArray(vmId) {
    return [
      "<input class=\"check_item\" type=\"checkbox\" id=\"" + RESOURCE.toLowerCase() + "_" +
                             vmId + "\" name=\"selected_items\" value=\"" +
                             vmId + "\"/>",
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
