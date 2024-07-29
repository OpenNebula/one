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

  var TabDataTable = require("utils/tab-datatable");
  var SunstoneConfig = require("sunstone-config");
  var Locale = require("utils/locale");
  var OpenNebulaService = require("opennebula/service");
  var LabelsUtils = require("utils/labels/utils");
  var SearchDropdown = require("hbs!./datatable/search");
  var Status = require("utils/status");
  var Humanize = require("utils/humanize");
  var TemplateUtils = require("utils/template-utils");
  var ScheduleActions = require("utils/schedule_action");

  /*
    CONSTANTS
   */

  var RESOURCE = "Service";
  var XML_ROOT = "DOCUMENT";
  var TAB_NAME = require("./tabId");
  var LABELS_COLUMN = 7;
  var SEARCH_COLUMN = 9;
  var TEMPLATE_ATTR = "TEMPLATE";

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.xmlRoot = XML_ROOT;
    this.labelsColumn = LABELS_COLUMN;

    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check"]},
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ["_all"]},
          {"sType": "num", "aTargets": [1]}
      ]
    };

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Owner"),
      Locale.tr("Group"),
      Locale.tr("Name"),
      Locale.tr("State"),
      Locale.tr("Start time"),
      Locale.tr("Labels"),
      Locale.tr("Charters"),
      "search_data"
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "select_resource": Locale.tr("Please select a Service from the list"),
      "you_selected": Locale.tr("You selected the following Service:"),
      "select_resource_multiple": Locale.tr("Please select one or more Services from the list"),
      "you_selected_multiple": Locale.tr("You selected the following Services:")
    };

    this.conf.searchDropdownHTML = SearchDropdown({tableId: this.dataTableId});
    this.searchColumn = SEARCH_COLUMN;

    TabDataTable.call(this);
  }

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.postUpdateView = _postUpdateView;

  return Table;

  function _postUpdateView() {
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
    $(".describeCharter").on("mouseleave").on("mouseleave", function(e){
      $(this).find("."+classInfo).remove();
    });
  }

  function checkTime(startTime, addedEndTime, warningTime, rtnTime){
    var rtn = false;
    if(startTime && addedEndTime){
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
        if(finalTime >= nowInSeconds && warningTime === undefined){
          rtn = rtnTime? finalTime - nowInSeconds : true;
        }else if(!!warningTime){
          var warning = parseInt(warningTime.match(regexNumber)[0],10);
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

  function leasesClock(element){
    var rtn = "";
    // The charter info is pulled from the schedule action of the first VM of the first role
    // (element.TEMPLATE.BODY.roles[0].vm_template_contents.SCHED_ACTION)
    if(element && element.TEMPLATE && element.TEMPLATE.BODY && element.TEMPLATE.BODY.start_time && element.TEMPLATE.BODY.roles){
      var startTime = element.TEMPLATE.BODY.start_time;
      var roles = Array.isArray(element.TEMPLATE.BODY.roles)? element.TEMPLATE.BODY.roles: [element.TEMPLATE.BODY.roles];
      if(roles[0] && roles[0].vm_template_contents){
        var objTemplate = TemplateUtils.stringToTemplate(roles[0].vm_template_contents);
        if(objTemplate.SCHED_ACTION){
          var sched_actions = Array.isArray(objTemplate.SCHED_ACTION)? objTemplate.SCHED_ACTION : [objTemplate.SCHED_ACTION];
          var leases = config.system_config.leases;
          sched_actions.some(function(action){
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
              var endTime = (action.TIME.startsWith("+")? action.TIME : action.TIME - startTime).toString();

              if(checkTime(startTime, endTime)){
                rtn = $("<i/>",{class:"describeCharter fa fa-clock",data_start:startTime, data_add:endTime, data_action:action.ACTION}).css({"position":"relative","color":leases[action.ACTION].color});
                if(
                  leases[action.ACTION].warning &&
                  leases[action.ACTION].warning.time &&
                  leases[action.ACTION].warning.color
                ){
                  if(checkTime(startTime, action.TIME, leases[action.ACTION].warning.time)){
                    rtn.css("color", leases[action.ACTION].warning.color);
                  }
                }
                rtn = rtn.prop("outerHTML");
                return true;
              }
            }
          });
        }
      }
    }
    return rtn;
  }

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var element = element_json[XML_ROOT];

    var state = OpenNebulaService.stateStr(element.TEMPLATE.BODY.state);

    var search = {
      NAME:  element.NAME,
      UNAME: element.UNAME,
      GNAME: element.GNAME,
      STATE: state
    };

    var color_html = Status.state_lock_to_color("SERVICE",state, element_json[XML_ROOT]["LOCK"]);
    var start_time = element.TEMPLATE.BODY["start_time"] ? Humanize.prettyTime(element.TEMPLATE.BODY["start_time"]) : "-";

    return [
      "<input class=\"check_item\" type=\"checkbox\" "+
                          "style=\"vertical-align: inherit;\" id=\""+this.resource.toLowerCase()+"_" +
                           element.ID + "\" name=\"selected_items\" value=\"" +
                           element.ID + "\"/>"+color_html,
        element.ID,
        element.UNAME,
        element.GNAME,
        element.NAME,
        state,
        start_time,
        (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||""),
        leasesClock(element),
        btoa(unescape(encodeURIComponent(JSON.stringify(search))))
    ];
  }
});
