/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

define(function (require) {
  /*
    IMPORTS
  */
  var Actions = require("opennebula/action");
  var Config = require("sunstone-config");
  var Humanize = require("utils/humanize");
  var Locale = require("utils/locale");
  var Notifier = require("utils/notifier");
  var OpenNebulaVM = require("opennebula/vm");
  var Sunstone = require("sunstone");
  var TemplateUtils = require("utils/template-utils");
  var Tips = require("utils/tips");

  /*
    TEMPLATES
  */
  var TemplateHTML = require("hbs!./schedule_action/html");
  var TemplateTableHTML = require("hbs!./schedule_action/table");
  var TemplatePerformHTML = require("hbs!./schedule_action/perform-action");
  var TemplateTableRowHTML = require("hbs!./schedule_action/table-row");
  var TemplateCharterTableHTML = require("hbs!./schedule_action/charter-table");
  var TemplateCharterTableRowHTML = require("hbs!./schedule_action/charter-table-row");

  /*
    GLOBAL VARIABLES
  */
  var currentSchedID = 0;
  var scheduleActionsArray = [];

  /*
    CONSTANTS
  */
  var CONFIRM_DIALOG_LEASES = require("utils/dialogs/leases/dialogId");
  var currentDate = new Date();
  var newDate = new Date();
  // if you want to add more time to the schedule action modify this
  // variable
  var hours = 1;
  newDate.setTime(currentDate.getTime() + (hours*60*60*1000));
  var defaultHour = newDate.getHours() + ":" + newDate.getMinutes();

  var resourcesWithoutActions = ['BackupJobs', 'create_backupjob']

  var defaultActions = [
    "terminate",
    "terminate-hard",
    "hold",
    "release",
    "stop",
    "suspend",
    "resume",
    "reboot",
    "reboot-hard",
    "poweroff",
    "poweroff-hard",
    "undeploy",
    "undeploy-hard",
    "snapshot-create",
    "snapshot-delete",
    "snapshot-revert",
    "disk-snapshot-create",
    "disk-snapshot-delete",
    "disk-snapshot-revert",
    "backup"
  ];

  var actionsWithARGS = [
    "snapshot-create",
    "snapshot-revert",
    "snapshot-delete",
    "disk-snapshot-create",
    "disk-snapshot-revert",
    "disk-snapshot-delete",
    "backup"
  ];

  var clearEmptySpaces = function(e){
    var value = e.val().replace(/\s/g, "");
    e.val(value);
  };

  var options_date_picker={
    dateFormat: "yy-mm-dd",
    minDate: currentDate,
    showOptions: { direction: "down" }
  };

  var options_hour_picker = {
    title: Locale.tr("Hour"),
    twentyFour: "true",
    timeSeparator: ":",
    beforeShow: clearEmptySpaces,
    now: defaultHour
  };

  /*
    FUNCTIONS
  */

  /**
   * This functions returns the HTML string for the Schedule Action Table.
   *
   * @param {('vms'|'inst'|'temp'|'flow'|'service_create')} resource - Resource.
   * @param {boolean} leases - Can add leases?
   * @param {boolean} header - Should generate the table header?
   * @param {string} body - Body HTML string.
   * @param {boolean} isVM - is it the VM view?
   * @param {boolean} canAdd - Can add schedule actions?
   * @returns - HTML string with the schedule action table.
   */
  function _html(resource, leases = true, body = null, isVM = false, canAdd=true) {
    this.res = resource;
    return TemplateTableHTML({
      res: resource,
      leases: leases,
      body: body,
      isVM: isVM,
      canAdd: canAdd
    });
  }

  function _htmlPerformAction(resource, optionsRoles){
    var optionsActions = defaultActions.map(function(ac){
      return "<option value='"+ac+"'>"+ac+"</option>";
    }).join("");

    return TemplatePerformHTML({
      res: resource,
      actions: optionsActions,
      roles: optionsRoles
    });
  }

  function _setupPerformAction(resource, service_id){
    $("select#select_new_action").off("change").on("change",function(){
      var snap_name = $("#snapname");
      var snap_id = $("#snapid");
      var disk_id = $("#diskid");
      var ds_id = $("#dsid");
      switch ($(this).val()) {
        case "snapshot-create":
          snap_name.removeClass("hide");
          snap_id.addClass("hide").val("");
          disk_id.addClass("hide").val("");
          ds_id.addClass("hide").val("");
        break;
        case "snapshot-revert":
          snap_name.addClass("hide").val("");
          snap_id.removeClass("hide");
          disk_id.addClass("hide").val("");
          ds_id.addClass("hide").val("");
        break;
        case "snapshot-delete":
          snap_name.addClass("hide").val("");
          snap_id.removeClass("hide");
          disk_id.addClass("hide").val("");
          ds_id.addClass("hide").val("");
          break;
        case "disk-snapshot-create":
          snap_name.removeClass("hide");
          snap_id.addClass("hide").val("");
          disk_id.removeClass("hide");
          ds_id.addClass("hide").val("");
          break;
        case "disk-snapshot-revert":
          snap_name.addClass("hide").val("");
          snap_id.removeClass("hide");
          disk_id.removeClass("hide");
          ds_id.addClass("hide").val("");
          break;
        case "disk-snapshot-delete":
          snap_name.addClass("hide").val("");
          snap_id.removeClass("hide");
          disk_id.removeClass("hide");
          ds_id.addClass("hide").val("");
          break;
        case "backup":
          snap_name.addClass("hide").val("");
          snap_id.addClass("hide").val("");
          disk_id.addClass("hide").val("");
          disk_id.addClass("hide").val("");
          ds_id.removeClass("hide");
          break;
        default:
          snap_name.addClass("hide").val("");
          snap_id.addClass("hide").val("");
          disk_id.addClass("hide").val("");
          ds_id.addClass("hide").val("");
          break;
      }
    });

    $("#perform_"+resource+"_action_json").off("click").on("click", function(){
      var new_action = $("select#select_new_action").val();
      var role = $("select#role_name").val();
      var snap_name = $("#snapname").val();
      var snap_id = $("#snapid").val();
      var disk_id = $("#diskid").val();
      var ds_id = $("#dsid").val();
      if(new_action){
        var actionJSON = {};
        actionJSON.error = function(e){
          Notifier.notifyError((e && e.error && e.error.message) || Locale.tr("Error"));
        };
        actionJSON.success = function(e){
          Notifier.notifyMessage(Locale.tr("Bulk Action Created"));
        };
        actionJSON.data = {};
        actionJSON.data.id = service_id;
        actionJSON.data.action = {perform: new_action};
        actionJSON.data.action.params = {};
        if(defaultActions.includes(new_action)){
          var rawData = [disk_id,snap_id,snap_name,ds_id];
          var args = rawData.filter(function (e) {return e;}).join();
          if(args){
            actionJSON.data.action.params.args = args;
          }
        }
        if(role!=="" && role!==undefined){
          actionJSON.data.roleName = role;
        }
        Actions.addFlowAction(actionJSON,resource);
      }
      return false;
    });
  }

  function formatDate( date, type = "full") {
    var d = date? new Date(date): new Date();
    var month = "" + (d.getMonth() + 1);
    var day = "" + d.getDate();
    var year = d.getFullYear();
    var hour = d.getHours();
    var minutes = d.getMinutes();
    if (hour.length < 2)
        hour = "0" + hour;
    if (minutes.length < 2)
        minutes = "0" + minutes;
    if (month.length < 2)
        month = "0" + month;
    if (day.length < 2)
        day = "0" + day;
    var date = [];
    switch (type) {
      case "hour":
        date = [hour+":"+minutes];
      break;
      case "date":
        date = [year, month, day];
      break;
      default:
        date = [year, month, day, hour+":"+minutes];
      break;
    }
    return date.join("-");
  }

  function addPickers(schedule,context){
    if(schedule && context){
      //input periodic scheduled date
      $("#end_value_date").datepicker("disable");
      schedule.find("#end_value_date",context).off("click").on("click",function(e){
        e.stopPropagation();
        $(".wickedpicker").hide();
      }).on("keypress",function(e){
        e.preventDefault();
        return false;
      }).datepicker(options_date_picker);

      //input date scheduled
      $("#date_input").datepicker("disable");
      schedule.find("#date_input",context).off("click").on("click",function(e){
        e.stopPropagation();
        $(".wickedpicker").hide();
      }).on("keypress",function(e){
        e.preventDefault(); return false;
      }).datepicker(options_date_picker);

      //input hour picker
      schedule.find("#time_input",context).off("click").on("click",function(e){
        e.stopPropagation();
      }).wickedpicker(options_hour_picker).removeAttr("onkeypress").on('keypress', function(e) {
        var key = String.fromCharCode(e.which);
        if (!/[\d:]/.test(key) && e.which !== 8) {
          e.preventDefault();
        }
      });

      schedule.find("#relative_time", context).off("click").on("click", function (e) {
        $("#schedule_type", context).prop("checked", false);
        if ($(this).is(":checked")) {
          $("#no_relative_time_form, .periodic", context).addClass("hide");
          $("#schedule_time", context).prop("", false);
          $("#relative_time_form", context).removeClass("hide");
        } else {
          $("#relative_time_form", context).addClass("hide");
          $("#no_relative_time_form", context).removeClass("hide");
        }
      });
    }
  }

  function _htmlNewAction(actions, context, res) {
    $("tr.periodic.create, tr#no_relative_time_form").remove();
    this.res = res;
    var options = "";
    
    if(!resourcesWithoutActions.includes(res)){
      $.each(actions, function (key, action) {
        var actionAux = action.replace(/\-/g, "_");
        if (Config.isTabActionEnabled("vms-tab", "VM." + actionAux)) {
          options += "<option value=\"" + action + "\">" + Locale.tr(action) + "</option>";
        }
      });
    }

    const attrFormNewScheduleActions = {
      "actions": options,
      "resource": this.res,
    }
    if(!resourcesWithoutActions.includes(this.res)){
      attrFormNewScheduleActions.relative = true
    }
    var schedule = $("#sched_" + this.res + "_actions_table tbody", context).append(TemplateHTML(attrFormNewScheduleActions));

    addPickers(schedule,context);

    if (this.res === "vms") {
      $("#title", context).prop("colspan", "10");
      $("#td_days", context).prop("colspan", "8");
    }
    if (this.res === "flow") {
      $("tr.create>td", context).prop("colspan", "8");
    }
  }

  function _setup(context) {
    var dd = newDate.getDate();
    var mm = newDate.getMonth() + 1;
    var yyyy = newDate.getFullYear();
    if (dd < 10) {
      dd = "0" + dd;
    }
    if (mm < 10) {
      mm = "0" + mm;
    }
    $("#date_input", context).attr("value", yyyy + "-" + mm + "-" + dd);
    $(".periodic", context).addClass("hide");
    this.selector = $("select#select_new_action", context);
    $("select#select_new_action").on("change",function(){
      var snap_name = $("#snapname",context);
      var snap_id = $("#snapid",context);
      var disk_id = $("#diskid",context);
      var ds_id = $("#dsid", context);

      switch ($(this).val()) {
        case "snapshot-create":
          snap_name.removeClass("hide");
          snap_id.addClass("hide");
          disk_id.addClass("hide");
          ds_id.addClass("hide");
        break;
        case "snapshot-revert":
          snap_name.addClass("hide");
          snap_id.removeClass("hide");
          disk_id.addClass("hide");
          ds_id.addClass("hide");
        break;
        case "snapshot-delete":
          snap_name.addClass("hide");
          snap_id.removeClass("hide");
          disk_id.addClass("hide");
          ds_id.addClass("hide");
        break;
        case "disk-snapshot-create":
          snap_name.removeClass("hide");
          snap_id.addClass("hide");
          disk_id.removeClass("hide");
          ds_id.addClass("hide");
        break;
        case "disk-snapshot-revert":
          snap_name.addClass("hide");
          snap_id.removeClass("hide");
          disk_id.removeClass("hide");
          ds_id.addClass("hide");
        break;
        case "disk-snapshot-delete":
          snap_name.addClass("hide");
          snap_id.removeClass("hide");
          disk_id.removeClass("hide");
          ds_id.addClass("hide");
        break;
        case "backup":
          snap_name.addClass("hide");
          snap_id.addClass("hide");
          disk_id.addClass("hide");
          ds_id.removeClass("hide");
        break;
        default:
          snap_name.addClass("hide");
          snap_id.addClass("hide");
          disk_id.addClass("hide");
          ds_id.addClass("hide");
        break;
      }
    });
    $("input#schedule_type", context).on("change", function () {
      var periodic = $(this).prop("checked");
      if (periodic) {
        $(".periodic", context).removeClass("hide");
        $(".non-periodic", context).addClass("hide");
      } else {
        $(".periodic", context).addClass("hide");
        $(".non-periodic", context).removeClass("hide");
      }
    });
    var that = this;
    this.repeat = "week";
    this.end_type = "never";
    $("select[name='repeat']", context).change(function () {
      var value = $(this).val();
      that.repeat = value;
      var input_html = "";

      switch (value) {
        case "week":
          input_html = "<div id=\"days_week_value\" style=\"margin: 10px 0 10px 0;\">\
                    <input type=\"checkbox\" id=\"mon\" name=\"days\" value=\"1\"><label for=\"mon\">" + Locale.tr("Mo") + "</label>\
                    <input type=\"checkbox\" id=\"tue\" name=\"days\" value=\"2\"><label for=\"tue\">" + Locale.tr("Tu") + "</label>\
                    <input type=\"checkbox\" id=\"wed\" name=\"days\" value=\"3\"><label for=\"wed\">" + Locale.tr("We") + "</label>\
                    <input type=\"checkbox\" id=\"thu\" name=\"days\" value=\"4\"><label for=\"thu\">" + Locale.tr("Th") + "</label>\
                    <input type=\"checkbox\" id=\"fri\" name=\"days\" value=\"5\"><label for=\"fri\">" + Locale.tr("Fr") + "</label>\
                    <input type=\"checkbox\" id=\"sat\" name=\"days\" value=\"6\"><label for=\"sat\">" + Locale.tr("Sa") + "</label>\
                    <input type=\"checkbox\" id=\"sun\" name=\"days\" value=\"0\"><label for=\"sun\">" + Locale.tr("Su") + "</label>\
                </div>";
          break;
        case "month":
          input_html = "<div style=\"display: -webkit-box;\"><input style=\"margin-right: 4px;\" id=\"days_month_value\" type=\"text\" placeholder=\"1,31\"/>\
					<span class=\"tip\">"+ Locale.tr("Comma separated list of days of the month to repeat the action on. Ex: 1,15,25 repeats the action every first, 15th and 25th day of the month") + " </span></div>";
          break;
        case "year":
          input_html = "<div style=\"display: -webkit-box;\"><input style=\"margin-right: 4px;\" id=\"days_year_value\" type=\"text\" placeholder=\"1,365\"/>\
					<span class=\"tip\">"+ Locale.tr("Comma separated list of days of the year to repeat the action on. Ex: 1,30,330 repeats the action every first, 30th and 330th day of the year") + " </span></div>";
          break;
        case "hour":
          input_html = "<div style=\"display: -webkit-box;\">\
									<label style=\"margin-right: 5px;\">"+ Locale.tr("Each") + "</label>\
									<input style=\"margin-right: 4px;\" id=\"days_hour_value\" min=\"0\" max=\"168\" type=\"number\" placeholder=\"5\"/>\
									<label> "+ Locale.tr("hours") + "</label>\
								</div>";
          break;
      }
      $("#td_days").html(input_html);
      Tips.setup(context);
    });

    $("input[name='end_type']", context).change(function () {
      var value = $(this).val();
      var min;
      that.end_type = value;

      $(".end_input", context).prop("disabled", true);
      switch (value) {
        case "n_rep":
          min = 1;
          break;
        case "date":
          var today = new Date();
          var dd = today.getDate();
          var mm = today.getMonth() + 1;
          var yyyy = today.getFullYear();
          if (dd < 10) {
            dd = "0" + dd;
          }
          if (mm < 10) {
            mm = "0" + mm;
          }
          min = yyyy + "-" + mm + "-" + dd ;
          break;
      }
      $("#end_value_" + value, context).attr("value", min);
      $("#end_value_" + value, context).prop("disabled", false);
    });
    try {
      context.on("focusout", "#time_input", function () {
        $("#time_input").removeAttr("data-invalid");
        $("#time_input").removeAttr("class");
      });
    } catch (error) {}
  }

  function _fill(element, context){
    _reset();

    if(
      element &&
      element.closest &&
      element.closest("tr") &&
      element.closest("tr").attr &&
      element.closest("tr").attr("data") &&
      context
    ){
      var data = element.closest("tr").attr("data");
      var dataJSON = JSON.parse(data);
      if (dataJSON) {
        var relative = true;

        Object.keys(dataJSON).forEach(function(key){
          valuesForRelative = ["ACTION","ID","TIME"];
          if(key!=="ARGS" && !valuesForRelative.includes(key)){
            relative = false;
          }
        });

        if(dataJSON.ACTION){
          $("#select_new_action").val(dataJSON.ACTION).change();

          if(dataJSON.ARGS && typeof dataJSON.ARGS === 'string'){
            var args = dataJSON.ARGS.split(",");
            var disk_id = $("#diskid",context);
            var snap_id = $("#snapid",context);
            var snap_name = $("#snapname",context);
            var ds_id = $("#dsid", context);
            if(args && Array.isArray(args)){
              switch (dataJSON.ACTION) {
                case "snapshot-create":
                  disk_id.val("");
                  snap_id.val("");
                  snap_name.val(args[0]||"");
                  ds_id.val("");
                break;
                case "snapshot-revert":
                  disk_id.val("");
                  snap_id.val(args[0]||"");
                  snap_name.val("");
                  ds_id.val("");
                break;
                case "snapshot-delete":
                  disk_id.val("");
                  snap_id.val(args[0]||"");
                  snap_name.val("");
                  ds_id.val("");
                break;
                case "disk-snapshot-create":
                  disk_id.val(args[0]||"");
                  snap_id.val("");
                  snap_name.val(args[1]||"");
                  ds_id.val("");
                break;
                case "disk-snapshot-revert":
                  disk_id.val(args[0]||"");
                  snap_id.val(args[1]||"");
                  snap_name.val("");
                  ds_id.val("");
                break;
                case "disk-snapshot-delete":
                  disk_id.val(args[0]||"");
                  snap_id.val(args[1]||"");
                  snap_name.val("");
                  ds_id.val("");
                break;
                case "backup":
                  ds_id.val(args[0]||"");
                  snap_name.val("");
                  snap_id.val("");
                  disk_id.val("");
                break;
                default:
                  snap_name.val("");
                  snap_id.val("");
                  disk_id.val("");
                  ds_id.val("");
                break;
              }
            }else{
              snap_name.val("");
              snap_id.val("");
              disk_id.val("");
              ds_id.val("");
            }
          }
        }
        //relative check
        if(relative){
          $("#relative_time").prop("checked", true);
          $("#relative_time_form").removeClass("hide");
          $("#no_relative_time_form").addClass("hide");
          if(dataJSON.TIME){
            var relativeTime = _time(parseInt(dataJSON.TIME,10));
            if(relativeTime && relativeTime.split && relativeTime.split(" ")){
              relativeDate = relativeTime.trim().split(" ");
              if(relativeDate[0]){
                $("#time_number").val(relativeDate[0]);
              }
              if(relativeDate[1]){
                $("#time_unit").val(relativeDate[1].toLowerCase());
              }
            }
          }
        }else{
          $("#relative_time").prop("checked", false);
          $("#relative_time_form").addClass("hide");
          $("#no_relative_time_form").removeClass("hide");
          //periodic check
          if(dataJSON.DAYS || dataJSON.REPEAT){
            $("#schedule_type").click().attr("checked", true);
          }
          if(dataJSON.TIME && dataJSON.TIME > 1){
            var end_value = parseInt(dataJSON.TIME,10) * 1000;
            $("#date_input").val(
              formatDate(end_value,"date")
            );
            $("#time_input").val(
              formatDate(end_value, "hour")
            );
          }else{
            _resetInputs();
          }
          if(dataJSON.REPEAT && dataJSON.REPEAT.length){
            _resetRepeatValues();
            switch (dataJSON.REPEAT) {
              case "0":
                $("#repeat").val("week").change();
                if(dataJSON.DAYS && dataJSON.DAYS.length){
                  var days = $("#days_week_value input[name=days]");
                  var dataDays = dataJSON.DAYS.split(",");
                  dataDays.forEach(function(dataValue){
                    if(days[dataValue]){
                      if (dataValue > 0){
                        $(days[dataValue - 1]).prop("checked", true);
                      } else if (dataValue == 0){
                        $(days[6]).prop("checked", true);
                      }
                    }
                  });
                }
              break;
              case "1":
                $("#repeat").val("month").change();
                if(dataJSON.DAYS && dataJSON.DAYS.length){
                  $("#days_month_value").val(dataJSON.DAYS);
                }
              break;
              case "2":
                $("#repeat").val("year").change();
                if(dataJSON.DAYS && dataJSON.DAYS.length){
                  $("#days_year_value").val(dataJSON.DAYS);
                }
              break;
              case "3":
                $("#repeat").val("hour").change();
                if(dataJSON.DAYS && dataJSON.DAYS.length){
                  $("#days_hour_value").val(dataJSON.DAYS);
                }
              break;
              default:
              break;
            }
          }else{
            _resetRepeat();
          }
          if(dataJSON.END_TYPE && dataJSON.END_TYPE.length){
            switch (dataJSON.END_TYPE) {
              case "0":
                $("#end_type_ever").prop("checked",true).click();
              break;
              case "1":
                $("#end_type_date[value=n_rep]").click();
                if(dataJSON.END_VALUE && dataJSON.END_VALUE.length){
                  $("#end_value_n_rep").val(dataJSON.END_VALUE);
                }
              break;
              case "2":
                $("#end_type_n_rep[value=date]").click();
                if(dataJSON.END_VALUE && dataJSON.END_VALUE.length){
                  var end_value = parseInt(dataJSON.END_VALUE,10) * 1000;
                  $("#end_value_date").val(
                    formatDate(end_value,"date")
                  );
                }
              break;
              default:
              break;
            }
          }
        }
      }
    }
  }

  function _reset(){
    $("#relative_time").prop("checked",false);
    $("#schedule_type").prop("checked",false);
    $("#time_number").val("");
    $("#end_value_date").val("").prop("disabled", true);
    $("#end_value_n_rep").val("").prop("disabled", true);
    $("#end_type_ever").click();
    _resetInputs();
    _resetRepeat();
    _resetRepeatValues();
    $(".periodic").addClass("hide");
    $(".non-periodic").removeClass("hide");
    $("#relative_time_form").addClass("hide");
    $("#no_relative_time_form").removeClass("hide");

  }

  function _resetRepeatValues(){
    $("#days_week_value input[name=days]").prop("checked", false);
    $("#days_month_value").val("");
    $("#days_year_value").val("");
    $("#days_hour_value").val("");
  }

  function _resetRepeat(){
    $("#repeat").val("week").change();
  }

  function _resetInputs(){
    $("#date_input").val(
      formatDate(false, "date")
    );
    $("#time_input").val(defaultHour);
  }

  function _retrieve(context, isService=false, resource) {
    var res = resource || this.res
  
    $("#sched_" + res + "_actions_table .create", context).remove();
    var actionsJSON = [];

    $("#sched_" + res + "_actions_table tbody tr", context).each(function (index) {
      var first = $(this).children("td")[0];
      if (!$("select", first).html()) { //table header
        var actionJSON = {};
        
        if ($(this).attr("data")) {
          actionJSON = JSON.parse($(this).attr("data"));
          actionJSON.ID = String(index);
        }
      }
      if (!$.isEmptyObject(actionJSON)) {
        var sched_action = isService ?
          { SCHED_ACTION: actionJSON}
        :
          actionJSON;

        actionsJSON.push(sched_action);
      };
    });
    return actionsJSON;
  }

  function _retrieveNewAction(context, resource) {
    var relative_time = $("#relative_time", context).prop("checked");
    var new_action = $("#select_new_action", context).val();
    var sched_action = {};
    if (relative_time) {
      var time_number = $("#time_number", context).val();
      var time_unit = $("#time_unit", context).val();
      var send_time = 0;
      if (time_number === "" || time_number <= 0) {
        Notifier.notifyError("Time Number not defined.");
        return false;
      }
      switch (time_unit) {
        case "years":
          send_time = time_number * 365 * 24 * 3600;
          break;
        case "months":
          send_time = time_number * 30 * 24 * 3600;
          break;
        case "weeks":
          send_time = time_number * 7 * 24 * 3600;
          break;
        case "days":
          send_time = time_number * 24 * 3600;
          break;
        case "hours":
          send_time = time_number * 3600;
          break;
        case "minutes":
          send_time = time_number * 60;
          break;
        default:
          Notifier.notifyError("Error in unit time");
          return false;
      }
      sched_action.TIME = "+" + send_time;
    } else {
      var periodic = $("input#schedule_type", context).prop("checked");
      var time_input_value = $("#time_input", context).val();
      var date_input_value = $("#date_input", context).val();
      var rep = 0;
      var end_type = 1;
      var days = "";
      var end_value = 1;
      if (date_input_value === "") {
        Notifier.notifyError("Date not defined.");
        return false;
      }
      if (time_input_value === "") {
        Notifier.notifyError("Time not defined.");
        return false;
      }
      end_type = 2;
      var timeCal = date_input_value + " " + time_input_value;
      var time = dateToEpoch(new Date(timeCal));
      sched_action.END_TYPE = end_type;
      sched_action.END_VALUE = time;
      sched_action.TIME = time;
      if (periodic) {
        end_type = 1;
        if (!this.repeat || !this.end_type) {
          return false;
        }
        if (this.repeat === "week") {
          $("input[name='days']:checked").each(function () {
            days = days + (this).value + ",";
          });
          days = days.slice(0, -1);
        } else if (this.repeat === "month") {
          rep = 1;
          days = $("#days_month_value", context).val();
        } else if (this.repeat === "year") {
          rep = 2;
          days = $("#days_year_value", context).val();
        } else {
          rep = 3;
          days = $("#days_hour_value", context).val();
        }
        if (days === "") {
          Notifier.notifyError("Hours or days not defined.");
          return false;
        }
        if (this.end_type === "never") {
          end_type = 0;
        } else if (this.end_type === "n_rep") {
          end_value = $("#end_value_n_rep", context).val();
          if (end_value === "") {
            Notifier.notifyError("Repetition number not defined.");
            return false;
          }
        } else if (this.end_type === "date") {
          end_type = 2;
          end_date = $("#end_value_date", context).val();
          if (end_date === "") {
            Notifier.notifyError("End date not defined.");
            return false;
          }
          var time_value = end_date + " 12:00";
          end_value = dateToEpoch(new Date(time_value));
        }
        sched_action.DAYS = String(days);
        sched_action.REPEAT = String(rep);
        sched_action.END_VALUE = String(end_value);
      }
      sched_action.END_TYPE = String(end_type);
    }
    sched_action.ACTION = String(new_action);
    if(sched_action.ACTION && actionsWithARGS.includes(sched_action.ACTION)){
      var snap_name = $("#snapname",context);
      var snap_id = $("#snapid",context);
      var disk_id = $("#diskid",context);
      var ds_id = $("#dsid",context);
      var snap_name_val = snap_name.val();
      var snap_id_val = snap_id.val();
      var disk_id_val = disk_id.val();
      var ds_id_val = ds_id.val();
      if(validateScheduleInputsEmpty(sched_action.ACTION, snap_name_val, snap_id_val, disk_id_val, ds_id_val)){
        Notifier.notifyError("Check arguments for schedule action");
        return false;
      }
      var rawData = [disk_id_val,snap_id_val,snap_name_val,ds_id_val];
      sched_action.ARGS = rawData.filter(function (e) {return e;}).join();
    }
    
    if(resourcesWithoutActions.includes(resource)) {
      sched_action.ACTION = 'backup'
    }

    $("#sched_" + this.res + "_actions_table .create", context).remove();
    $("#sched_" + this.res + "_actions_table #relative_time_form", context).remove();
    $("#sched_" + this.res + "_actions_table #no_relative_time_form", context).remove();
    $("#no_relative_time_form", context).addClass("hide");
    $("#add_sched_" + this.res + "_action", context).removeAttr("disabled");
    return sched_action;
  }

  function validateScheduleInputsEmpty(action, snap_name, snap_id, disk_id, ds_id){
    switch (action) {
      case "snapshot-create":
        rtn = snap_name.length<=0;
      break;
      case "snapshot-revert":
        rtn = snap_id.length<=0;
      break;
      case "snapshot-delete":
        rtn = snap_id.length<=0;
      break;
      case "disk-snapshot-create":
        rtn = snap_name.length<=0 || disk_id.length<=0;
      break;
      case "disk-snapshot-revert":
        rtn = snap_id.length<=0 || disk_id.length<=0;
      break;
      case "disk-snapshot-delete":
        rtn = snap_id.length<=0 || disk_id.length<=0;
      break;
      case "backup":
        rtn = ds_id.length<=0;
      break;
      default:
        rtn = false;
      break;
    }
    return rtn;
  }

  function _fromJSONtoActionsTable(actions_array, canEdit=true, canDelete=true, template={}) {
    currentSchedID = 0;
    var str = "";

    if (!actions_array) {
      return "";
    }

    if (!Array.isArray(actions_array)) {
      var tmp_array = new Array();
      tmp_array[0] = actions_array;
      actions_array = tmp_array;
    }

    if (!actions_array.length) {
      return "";
    }

    $.each(actions_array, function (_, schedule_action) {
      str += _fromJSONtoActionRow(schedule_action, canEdit, canDelete, parseInt(template.STIME,10));
    });

    return str;
  }

  function _parseTime(time = 0) {
    r = time;
    if (Math.round(time) !== time) {
      r = time.toFixed(2);
    }
    return r;
  }

  function _time(unit = undefined) {
    if (unit && unit > 0) {
      years = unit / 365 / 24 / 3600;
      months = unit / 30 / 24 / 3600;
      weeks = unit / 7 / 24 / 3600;
      days = unit / 24 / 3600;
      hours = unit / 3600;
      minutes = unit / 60;
      if (years >= 1) {
        return _parseTime(years) + " " + Locale.tr("Years");
      }
      if (months >= 1) {
        return _parseTime(months) + " " + Locale.tr("Months");
      }
      if (weeks >= 1) {
        return _parseTime(weeks) + " " + Locale.tr("Weeks");
      }
      if (days >= 1) {
        return _parseTime(days) + " " + Locale.tr("Days");
      }
      if (hours >= 1) {
        return _parseTime(hours) + " " + Locale.tr("Hours");
      }
      if (minutes >= 1) {
        return _parseTime(minutes) + " " + Locale.tr("Minutes");
      }
    }
  }

  /**
   * This functions creates the HTML for the schedule actions rows.
   *
   * @param {object} schedule_action - Schedule action object.
   * @param {boolean} canEdit - Is edit allowed?
   * @param {bool ean} canDelete - Is delete allowed?
   * @returns {string} - Row HTML for the given schedule action.
   */
  function _fromJSONtoActionRow(schedule_action, canEdit=true, canDelete=true, stime=0) {
    var sched_obj = {};
    if(schedule_action){
      var time_str = Humanize.prettyTime(schedule_action.TIME);

      switch (schedule_action.REPEAT) {
        case "0":
          sched_obj.rep_str = Locale.tr("Weekly") +
            " " +
            Humanize.week_days(schedule_action.DAYS);
          break;
        case "1":
          sched_obj.rep_str = Locale.tr("Monthly") +
            " " +
            schedule_action.DAYS;
          break;
        case "2":
          sched_obj.rep_str = Locale.tr("Yearly") +
            " " +
            Humanize.week_days(schedule_action.DAYS);
          break;
        case "3":
          sched_obj.rep_str = Locale.tr("Each") +
            " " +
            schedule_action.DAYS +
            " " +
            Locale.tr("hours");
          break;
        default:
          break;
      }

      switch (schedule_action.END_TYPE) {
        case "0":
          sched_obj.end_str = Locale.tr("None");
          break;
        case "1":
          sched_obj.end_str = Locale.tr("After") +
            " " +
            schedule_action.END_VALUE +
            " " +
            Locale.tr("times");
          break;
        case "2":
          sched_obj.end_str = Locale.tr("On") +
            " " +
            Humanize.prettyTime(schedule_action.END_VALUE);
          break;
        default:
          break;
      }

      if (schedule_action.ID){
        sched_obj.id = schedule_action.ID;
      } else{
        sched_obj.id = currentSchedID.toString();
      }
      currentSchedID++;

      var time = String(schedule_action.TIME);
      sched_obj.time = isNaN(time) ? time_str : (time && time.match(/^\+(.*)/gi) ? _time(time) : time_str);
      sched_obj.done_str   = schedule_action.DONE ? 
      schedule_action.DONE === '-1' ? Locale.tr("Never") :
      (Humanize.prettyTime(schedule_action.DONE)) : 
      "";
      sched_obj.message_str = schedule_action.MESSAGE && typeof schedule_action.MESSAGE === "string" ? schedule_action.MESSAGE : "";
      sched_obj.action = JSON.stringify(schedule_action);
      sched_obj.name = schedule_action.ACTION;
      sched_obj.canEdit = canEdit && sched_obj.id;
      sched_obj.canDelete = canDelete && sched_obj.id;
      sched_obj.canEditOrDelete = (canEdit || canDelete) && sched_obj.id;
    }
    return TemplateTableRowHTML(sched_obj);
  }

  /**
   * This function gets the function
   *
   * @param {object} data - Schedule action information.
   * @returns {string} - Schedule action string.
   */
  function parseToRequestString(data) {
    return data ? TemplateUtils.templateToString({ SCHED_ACTION: data }) : "";
  }

  /**
   * This function send the schedule action to each role.
   *
   * @param {Array} roles - Service Roles.
   * @param {string} action - Action name.
   * @param {object} sched_obj -  Schedule action object.
   * @param {{
   * sched_id: string,
   * callback: Function
   * }} extraParams - Extra parameters with functions to execute after
   * runAction and schedule action id.
   */
  function sendSchedActionToServiceRoles(roles, action, sched_obj, extraParams={}) {
    var {sched_id, callback} = extraParams;
    roles.forEach(function(role){
      var nodes = Array.isArray(role.nodes)? role.nodes : [role.nodes];
      nodes.forEach(function(node) {
        if (node && node.vm_info && node.vm_info.VM && node.vm_info.VM.ID){
          switch (action) {
            case "VM.sched_action_add":
            case "VM.sched_action_update":
              Sunstone.runAction(action, node.vm_info.VM.ID , sched_obj, callback);
              break;
            case "VM.sched_action_delete":
              Sunstone.runAction(action, node.vm_info.VM.ID, sched_id, callback);
              break;
            default:
              break;
          }
        }
      });
    });
  }

  /**
   * This function updates the Service vm_template_contents with the scheduled
   * actions of the first service vm.
   *
   * @param {object} service - Service object.
   */
  function _updateVmTemplateContents(service){
    if (
      service &&
      service.data &&
      service.data[0] &&
      service.data[0].nodes &&
      service.data[0].nodes[0] &&
      service.data[0].nodes[0].deploy_id >= 0){
        OpenNebulaVM.show({
          data : {
              id: service.data[0].nodes[0].deploy_id
          },
          success: function(_, vmTemplate){
            var sched_action = { SCHED_ACTION: vmTemplate.VM.TEMPLATE.SCHED_ACTION };
            var sched_template = TemplateUtils.templateToString(sched_action);
            service.body.roles.forEach(role => {
              role.vm_template_contents = sched_template;
            });
            Sunstone.runAction("Service.update",service.id, JSON.stringify(service.body));
          },
          error: function(error){
            Notifier.onError("VM: " +error);
          }
        });
    }
  }

  /**
   * This function updates the Service datatable with the services information
   * of the first service vm.
   *
   * @param {object} that - Service object.
   * @param {string} selector - JQuery selector text.
   * @param {Function} htmlFunction - Function to execute to get the HTML.
   */
  function _updateServiceHTMLTable(that, selector, htmlFunction){
    if (that.data &&
      that.data[0] &&
      that.data[0].nodes &&
      that.data[0].nodes[0] &&
      that.data[0].nodes[0].deploy_id >= 0){
        OpenNebulaVM.show({
          data : {
              id: that.data[0].nodes[0].deploy_id
          },
          success: function(_, vmTemplate){
            $(selector).html(
              htmlFunction(vmTemplate.VM.TEMPLATE.SCHED_ACTION)
            );
          },
          error: function(error){
            Notifier.onError("VM: " +error);
          }
        });
    }
  }

  /**
   * This function setup the buttons in the Actions view.
   *
   * @param {('vms'|'inst'|'temp'|'flow'|'service_create')} resource - Resource.
   * @param {object} context - Context object.
   * @param {object} that - Object.
   */
  function _setupButtons(resource, context, that){
    scheduleActionsArray = [];
    var CREATE = true;

    function deleteInputsEdit(context){
      context.find("tr.create,tr#schedule_base,tr#input_sched_action_form,tr#relative_time_form,tr#no_relative_time_form").remove();
    }

    function clear(context){
      CREATE = true;
    }

    function renderCreateForm(){
      if(CREATE){
        _htmlNewAction(defaultActions, context, resource);
        _setup(context);
        CREATE = false;
      }
      return false;
    };

    // Show options to add a new Schedule Action
    context.off("click", "#add_sched_"+resource+"_action");
    context.on("click" , "#add_sched_"+resource+"_action", function(e){
      e.preventDefault();
      renderCreateForm();
      $("#edit_"+resource+"_action_json").hide();
      $("#add_"+resource+"_action_json").show();
    });

    // Add new Schedule action
    context.off("click", "#add_"+resource+"_action_json");
    context.on("click" , "#add_"+resource+"_action_json", function(e) {
      e.preventDefault();
      var sched_action = { SCHED_ACTION: _retrieveNewAction(context, resource) };

      if (sched_action["SCHED_ACTION"] == false) {
        return false;
      }

      var sched_template = TemplateUtils.templateToString(sched_action);
      switch (resource) {
        case "vms":
          Sunstone.runAction("VM.sched_action_add", that.element.ID, sched_template);
          break;
        case "BackupJobs":
          Sunstone.runAction("BackupJob.sched_action_add", that.element.ID, sched_template);
          break;
        case "inst":
        case "inst_flow":
        case "service_create":
        case "create_backupjob":
        case "temp":
          validateAndInitVariables(resource);
          scheduleActionsArray.push(sched_action["SCHED_ACTION"]);
          $("#sched_" + resource + "_actions_body").html(
            _getScheduleActionTableContent(scheduleActionsArray)
          );
          break;
        case "flow":
          var roles = Array.isArray(that.data)? that.data : [that.data];
          var extraParams = {
            callback: function() {
              var selector = "#sched_" + resource + "_actions_body";
              _updateServiceHTMLTable(that, selector, _getScheduleActionTableContent);
              _updateVmTemplateContents(that);
            }
          };
          sendSchedActionToServiceRoles(roles, "VM.sched_action_add", sched_template, extraParams);
          break;
        default:
          break;
      }
      clear();
    });

    // Show options to edit a Schedule Action
    context.off("click", ".edit_action_x");
    context.on("click", ".edit_action_x", function(e) {
      e.preventDefault();
      var id = $(this).attr("data_id");
      if(id && id.length){
        renderCreateForm();
        $("#edit_"+resource+"_action_json").show().attr("data_id", id);
        $("#add_"+resource+"_action_json").hide();
        _fill($(this),context);
      }
    });

    // Edit Schedule action
    context.off("click" , "#edit_"+ resource +"_action_json");
    context.on("click" , "#edit_"+ resource +"_action_json", function(e){
      e.preventDefault();
      var id = $(this).attr("data_id");
      if(id && id.length){
        $(".wickedpicker").hide();
        var sched_action = { SCHED_ACTION: _retrieveNewAction(context, resource) };
        if (sched_action["SCHED_ACTION"] != false) {
          sched_action.SCHED_ACTION.ID = id;
          var obj = {
            "sched_id" : id,
            "sched_template" : TemplateUtils.templateToString(sched_action)
          };
          switch (resource) {
            case "vms":
              Sunstone.runAction("VM.sched_action_update", that.element.ID, obj);
              break;
            case "inst":
            case "inst_flow":
            case "service_create":
            case "create_backupjob":
            case "temp":
              validateAndInitVariables(resource);
              delete sched_action.SCHED_ACTION.ID;
              scheduleActionsArray[id] = sched_action["SCHED_ACTION"];
              $("#sched_" + resource + "_actions_body").html(
                _getScheduleActionTableContent(scheduleActionsArray)
              );
              break;
            case "flow":
              var roles = Array.isArray(that.data)? that.data : [that.data];
              var extraParams = {
                callback: function() {
                  var selector = "#sched_" + resource + "_actions_body";
                  _updateServiceHTMLTable(that, selector, _getScheduleActionTableContent);
                  _updateVmTemplateContents(that);
                }
              };
              sendSchedActionToServiceRoles(roles, "VM.sched_action_update", obj, extraParams);
              break;
            case "BackupJobs":
              Sunstone.runAction("BackupJob.sched_action_update", that.element.ID, obj);
              break;
            default:
              break;
          }
          deleteInputsEdit(context)
        }
        clear();
      }
      return false;
    });

    // Remove Schedule Action
    context.off("click", ".remove_action_x");
    context.on("click", ".remove_action_x", function(e) {
      e.preventDefault();
      var id = $(this).attr("data_id");
      switch (resource) {
        case "vms":
          Sunstone.runAction("VM.sched_action_delete", that.element.ID, id);
          break;
        case "inst":
        case "inst_flow":
        case "service_create":
        case "create_backupjob":
        case "temp":
          validateAndInitVariables(resource);
          scheduleActionsArray.splice(id, 1);
          $("#sched_" + resource + "_actions_body").html(
            _getScheduleActionTableContent(scheduleActionsArray)
          );
          break;
        case "flow":
          var roles = Array.isArray(that.data)? that.data : [that.data];
          var extraParams = {
            sched_id: id,
            callback: function() {
              var selector = "#sched_" + resource + "_actions_body";
              _updateServiceHTMLTable(that, selector, _getScheduleActionTableContent);
              _updateVmTemplateContents(that);
            }
          };
          sendSchedActionToServiceRoles(roles, "VM.sched_action_delete", null, extraParams);
          break;
        case "BackupJobs":
          Sunstone.runAction("BackupJob.sched_action_delete", that.element.ID, id);
          break;
        default:
          break;
      }
    });

    context.off("click", "#leases_btn");
    context.on("click", "#leases_btn", function(e) {
      var confLeases = config.system_config.leases;
      displayAlertCreateLeases(resource, that, confLeases);
    });
  }

  /**
   * Returns an HTML string with the json keys and values
   *
   * @param {Object[]} actions_array - Schedule action array.
   * @returns {string} - HTML string with the json keys and values
   */
  function _getScheduleActionTableContent(actions_array, template={}) {
    var sched_actions = Array.isArray(actions_array) ? actions_array : [actions_array];
    scheduleActionsArray = sched_actions ? sched_actions : [];
    var empty = "\
      <tr id=\"no_actions_tr\">\
          <td colspan=\"6\">" + Locale.tr("No actions to show") + "</td>\
      </tr>";

    if (!actions_array) {
      return empty;
    }

    if (!sched_actions.length) {
      return empty;
    }

    var canEditOrDelete = !(
      template &&
      template.USER_TEMPLATE &&
      template.USER_TEMPLATE.SERVICE_ID
    );

    return _fromJSONtoActionsTable(sched_actions, canEditOrDelete, canEditOrDelete, template);
  }

  /*
   * LEASES FUNCTIONS
   * This functions are here because in the end they add schedule actions
   * to elements.
   */


  /**
   * This function adds the leases to an instantiated VM.
   *
   * @param {object[]} leasesArray - Array with all the actions to be added.
   * @param {string} vm_id - ID from the VM to send the action.
   */
   function addLeasesToVM(leasesArray, vm_id){
    $.each(leasesArray, function(_, sched_action){
      var sched_template = TemplateUtils.templateToString(sched_action);
      Sunstone.runAction("VM.sched_action_add", vm_id, sched_template);
    });
  }

  /**
   * This function adds the leases to an instantiated Service.
   *
   * @param {Object[]} leassesArray - Array with all the actions to be added.
   * @param {Object[]} roles - Service roles.
   */
  function addLeasesToService(leassesArray, roles){
    $.each(leassesArray, function(_, sched_action){
      var sched_template = TemplateUtils.templateToString(sched_action);
      var extraParams = {
        callback: function() {
          Sunstone.runAction("Service.refresh");
        }
      };
      sendSchedActionToServiceRoles(
        roles,
        "VM.sched_action_add",
        sched_template,
        extraParams
      );
    });
  }

  /**
   * This function converts the given date to epoch.
   *
   * @returns - Current date and hour in epoch format.
   */
  function dateToEpoch(date){
    return parseInt(date.getTime(),10) / 1000;
  };

  function _leasesToScheduleActions(confLeases, now){
    var newSchedActions =[];
    if(confLeases){
      var confLeasesKeys = Object.keys(confLeases);
      confLeasesKeys.forEach(function(schedAction){
        if(confLeases[schedAction].time){
          var schedActionTime = parseInt(confLeases[schedAction].time,10);
          var startTime = Math.round(now) + schedActionTime;
          var newAction = {
            SCHED_ACTION : {
              TIME: "+"+ startTime.toString(),
              ACTION: schedAction
            }
          };
          newSchedActions.push(newAction);
        }
      });
    }
    return newSchedActions;
  }

  function addSchedActionTable(leasesArray, resource){
    $.each(leasesArray, function(_, sched_action){
      scheduleActionsArray.push(sched_action["SCHED_ACTION"]);
    });

    $("#sched_" + resource + "_actions_body").html(
      _getScheduleActionTableContent(scheduleActionsArray)
    );
  }

  /**
   * This function shows the modal to confirm the leases creation.
   *
   * @param {('vms'|'inst'|'temp'|'flow'|'service_create')} resource - Resource.
   * @param {object} template - Resource template.
   */
   function displayAlertCreateLeases(resource, that, confLeases){
    var template = that.element;
    var now = 0;
    var stime = 0;
    var confLeasesCopy = JSON.parse(JSON.stringify(confLeases));
    if (template && template.STIME){
      stime = parseInt(template.STIME,10);
      date = new Date();
      now = dateToEpoch(date) - stime;
    }
    if (resource === "inst" ||
      resource === "inst_flow" ||
      resource === "service_create" ||
      resource === "temp"
    ){
      validateAndInitVariables(resource);
      addSchedActionTable(
        _leasesToScheduleActions(confLeasesCopy, now),
        resource
      );
    }
    else{
      Sunstone.getDialog(CONFIRM_DIALOG_LEASES).setParams({
        header: Locale.tr("Scheduled actions to add"),
        body : renderLeasesForModal(now, confLeases, stime),
        submit : function(params) {
          $(".charter_action").each(function(){
            var actionName = $(this).find(".action_name").text();
            var actionDate = $(this).find(".action_date").val();
            var actionHour = $(this).find(".action_hour").val();
            var date = new Date(actionDate + "T" + actionHour);
            var epochDate = dateToEpoch(date);
            confLeasesCopy[actionName].time = "+" + (epochDate - stime);
          });
          switch (resource) {
            case "vms":
              addLeasesToVM(
                _leasesToScheduleActions(confLeasesCopy, now),
                template.ID
              );
              break;
            case "flow":
              var roles = Array.isArray(that.data)? that.data : [that.data];
              addLeasesToService(
                _leasesToScheduleActions(confLeasesCopy, now),
                roles
              );
              break;
            default:
              break;
          }
          return false;
        }
      });
      Sunstone.getDialog(CONFIRM_DIALOG_LEASES).reset();
      Sunstone.getDialog(CONFIRM_DIALOG_LEASES).show();
    }
  }

  /**
   * This function generates the content for the confirm dialog body.
   *
   * @param {number} now - Now time.
   * @param {Object} confLeases - Object with the configured leases.
   * @param {number} stime - Template start time.
   * @returns - HTML content for the modal.
   */
   function renderLeasesForModal(now, confLeases, stime) {
    var body = "";
    var last = 0;
    if(confLeases){
      var confLeasesKeys = Object.keys(confLeases);

      if(confLeasesKeys && Array.isArray(confLeasesKeys)){
        confLeasesKeys.forEach(function(actionName){
          if(confLeases[actionName] && confLeases[actionName].time){
            var schedActionTime = parseInt(confLeases[actionName].time,10);
            var startTime = Math.round(now) + schedActionTime;
            var time = startTime + last;
            // Pretty time return an string with the following format:
            // HH:MM:SS DD/MM/YYYY
            var datetime = Humanize.prettyTime(time + stime);
            // This variable have [Hours, Minutes, Seconds]
            var hour = (datetime.split(" ")[0]).split(":");
            // This variable have [Day, Month, Year]
            var date = (datetime.split(" ")[1]).split("/");

            var dateValue = date[2] + "-" + date[1] + "-" + date[0];
            var hourValue = hour[0] + ":" + hour[1];

            body += TemplateCharterTableRowHTML({
              "actionName": actionName,
              "dateValue": dateValue,
              "hourValue": hourValue
            });

            last = schedActionTime;
          }
        });
      }
    }


    return TemplateCharterTableHTML({
      "res": resource,
      "body": body
    });
  }

  /**
   * This functions initializes the global variables with the current
   * schedule actions.
   *
   * @param {('vms'|'inst'|'temp'|'flow'|'service_create')} resource - Resource.
   */
  function validateAndInitVariables(resource){
    if (!scheduleActionsArray.length){
      $("#sched_" + resource + "_actions_body tr").each(function(_, sched_action){
        data = sched_action.getAttribute("data");
        if (data){
          scheduleActionsArray.push(
            JSON.parse(data)
          );
        }
      });
    }
  }

  return {
    "fromJSONtoActionRow": _fromJSONtoActionRow,
    "fromJSONtoActionsTable": _fromJSONtoActionsTable,
    "htmlNewAction": _htmlNewAction,
    "setup": _setup,
    "htmlTable": _html,
    "retrieveNewAction": _retrieveNewAction,
    "retrieve": _retrieve,
    "fill": _fill,
    "parseTime": _time,
    "parseToRequestString": parseToRequestString,
    "reset": _reset,
    "defaultActions": defaultActions,
    "setupButtons": _setupButtons,
    "updateServiceHTMLTable": _updateServiceHTMLTable,
    "getScheduleActionTableContent": _getScheduleActionTableContent,
    "sendSchedActionToServiceRoles": sendSchedActionToServiceRoles,
    "htmlPerformAction": _htmlPerformAction,
    "setupPerformAction": _setupPerformAction
  };
});
