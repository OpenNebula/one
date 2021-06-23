/* eslint-disable quotes */
/* -------------------------------------------------------------------------- */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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
  var Config = require("sunstone-config");
  var Locale = require("utils/locale");
  var Humanize = require("utils/humanize");
  var TemplateUtils = require("utils/template-utils");
  var Tips = require("utils/tips");
  var Notifier = require("utils/notifier");

  var TemplateHTML = require("hbs!./schedule_action/html");
  var TemplateTableHTML = require("hbs!./schedule_action/table");

  var selector = '';
  var defaultHour = "12:30";
  var actionsWithARGS = [
    'snapshot-create',
    'snapshot-revert',
    'snapshot-delete',
    'disk-snapshot-create',
    'disk-snapshot-revert',
    'disk-snapshot-delete'
  ];

  function _html(resource, leases = null, header = true) {
    this.res = resource;
    return TemplateTableHTML({
      header: header,
      res: resource,
      leases: leases
    });
  }

  function formatDate( date, type = 'full') {
    var d = date? new Date(date): new Date();
    var month = '' + (d.getMonth() + 1);
    var day = '' + d.getDate();
    var year = d.getFullYear();
    var hour = d.getHours();
    var minutes = d.getMinutes();
    if (hour.length < 2)
        hour = '0' + hour;
    if (minutes.length < 2)
        minutes = '0' + minutes;
    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;
    var date = [];
    switch (type) {
      case 'hour':
        date = [hour+":"+minutes];
      break;
      case 'date':
        date = [year, month, day];
      break;
      default:
        date = [year, month, day, hour+":"+minutes];
      break;
    }
    return date.join('-');
  }

  var clearEmpySpaces = function(e){
    var value = e.val().replace(/\s/g, "");
    e.val(value);
  };

  var options_date_picker={
    dateFormat: "yy-mm-dd",
    minDate: new Date(),
    showOptions: { direction: "down" }
  };
  var options_hour_picker = {
    title: Locale.tr("Hour"),
    twentyFour: "true",
    timeSeparator: ":",
    beforeShow: clearEmpySpaces,
    now: defaultHour
  };

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
      }).wickedpicker(options_hour_picker);

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
    var that = this;
    $.each(actions, function (key, action) {
      var actionAux = action.replace(/\-/g, "_");
      if (Config.isTabActionEnabled("vms-tab", "VM." + actionAux)) {
        options += "<option value=\"" + action + "\">" + Locale.tr(action) + "</option>";
      }
    });
    var schedule = $("#scheduling_" + this.res + "_actions_table tbody", context).append(TemplateHTML({
      "actions": options,
      "res": this.res
    }));
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
    $("#date_input", context).attr("value", yyyy + "-" + mm + "-" + dd);
    $(".periodic", context).addClass("hide");
    this.selector = $("select#select_new_action", context);
    $("select#select_new_action").on("change",function(){
      var snap_name = $("#snapname",context);
      var snap_id = $("#snapid",context);
      var disk_id = $("#diskid",context);

      switch ($(this).val()) {
        case "snapshot-create":
          snap_name.removeClass("hide");
          snap_id.addClass("hide");
          disk_id.addClass("hide");
        break;
        case "snapshot-revert":
          snap_name.addClass("hide");
          snap_id.removeClass("hide");
          disk_id.addClass("hide");
        break;
        case "snapshot-delete":
          snap_name.addClass("hide");
          snap_id.removeClass("hide");
          disk_id.addClass("hide");
        break;
        case "disk-snapshot-create":
          snap_name.removeClass("hide");
          snap_id.addClass("hide");
          disk_id.removeClass("hide");
        break;
        case "disk-snapshot-revert":
          snap_name.addClass("hide");
          snap_id.removeClass("hide");
          disk_id.removeClass("hide");
        break;
        case "disk-snapshot-delete":
          snap_name.addClass("hide");
          snap_id.removeClass("hide");
          disk_id.removeClass("hide");
        break;
        default:
          snap_name.addClass("hide");
          snap_id.addClass("hide");
          disk_id.addClass("hide");
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
                    <input type=\"checkbox\" id=\"sun\" name=\"days\" value=\"7\"><label for=\"sun\">" + Locale.tr("Su") + "</label>\
                </div>";
          break;
        case "month":
          input_html = "<div style=\"display: -webkit-box;\"><input style=\"margin-right: 4px;\" id=\"days_month_value\" type=\"text\" placeholder=\"1,31\"/>\
					<span class=\"tip\">"+ Locale.tr("Comma separated list of days of the month to repeat the action on. Ex: 1,15,25 repeats the action every first, 15th and 25th day of the month") + " </span></div>";
          break;
        case "year":
          input_html = "<div style=\"display: -webkit-box;\"><input style=\"margin-right: 4px;\" id=\"days_year_value\" type=\"text\" placeholder=\"0,365\"/>\
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
      that.end_type = value;
      var input_html = "";
      var min;
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
    } catch (error) {

    }
  }

  function _fill(element, context){
    _reset();
    if(element && element.closest && element.closest("tr") && element.closest("tr").attr && element.closest("tr").attr("data") && context){
      var data = element.closest("tr").attr("data");
      var dataJSON = JSON.parse(data);
      if(dataJSON){
        var relative = true;

        Object.keys(dataJSON).forEach(function(key){
          valuesForRelative = ['ACTION','ID','TIME'];
          if(key!=='ARGS' && !valuesForRelative.includes(key)){
            relative = false;
          }
        });

        if(dataJSON.ACTION){
          $("#select_new_action").val(dataJSON.ACTION).change();
          if(dataJSON.ARGS){
            var args = dataJSON.ARGS.split(",");
            var disk_id = $("#diskid",context);
            var snap_id = $("#snapid",context);
            var snap_name = $("#snapname",context);
            if(args && Array.isArray(args)){
              switch (dataJSON.ACTION) {
                case "snapshot-create":
                  disk_id.val("");
                  snap_id.val("");
                  snap_name.val(args[0]||"");
                break;
                case "snapshot-revert":
                  disk_id.val("");
                  snap_id.val(args[0]||"");
                  snap_name.val("");
                break;
                case "snapshot-delete":
                  disk_id.val("");
                  snap_id.val(args[0]||"");
                  snap_name.val("");
                break;
                case "disk-snapshot-create":
                  disk_id.val(args[0]||"");
                  snap_id.val("");
                  snap_name.val(args[1]||"");
                break;
                case "disk-snapshot-revert":
                  disk_id.val(args[0]||"");
                  snap_id.val(args[1]||"");
                  snap_name.val("");
                break;
                case "disk-snapshot-delete":
                  disk_id.val(args[0]||"");
                  snap_id.val(args[1]||"");
                  snap_name.val("");
                break;
                default:
                  snap_name.val("");
                  snap_id.val("");
                  disk_id.val("");
                break;
              }
            }else{
              snap_name.val("");
              snap_id.val("");
              disk_id.val("");
            }
          }
        }
        //relative check
        if(relative){
          $('#relative_time').prop('checked', true);
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
                $('#time_unit').val(relativeDate[1].toLowerCase());
              }
            }
          }
        }else{
          $('#relative_time').prop('checked', false);
          $("#relative_time_form").addClass("hide");
          $("#no_relative_time_form").removeClass("hide");
          //periodic check
          if(dataJSON.DAYS || dataJSON.REPEAT){
            $('#schedule_type').click().attr('checked', true);
          }
          if(dataJSON.TIME && dataJSON.TIME > 1){
            var end_value = parseInt(dataJSON.TIME,10) * 1000;
            $("#date_input").val(
              formatDate(end_value,'date')
            );
            $("#time_input").val(
              formatDate(end_value, 'hour')
            );
          }else{
            _resetInputs();
          }
          if(dataJSON.REPEAT && dataJSON.REPEAT.length){
            _resetRepeatValues();
            switch (dataJSON.REPEAT) {
              case '0':
                $("#repeat").val('week').change();
                if(dataJSON.DAYS && dataJSON.DAYS.length){
                  var days = $("#days_week_value input[name=days]");
                  var dataDays = dataJSON.DAYS.split(",");
                  dataDays.forEach(function(dataValue){
                    if(days[dataValue]){
                      $(days[dataValue]).prop("checked", true);
                    }
                  });
                }
              break;
              case '1':
                $("#repeat").val('month').change();
                if(dataJSON.DAYS && dataJSON.DAYS.length){
                  $("#days_month_value").val(dataJSON.DAYS);
                }
              break;
              case '2':
                $("#repeat").val('year').change();
                if(dataJSON.DAYS && dataJSON.DAYS.length){
                  $("#days_year_value").val(dataJSON.DAYS);
                }
              break;
              case '3':
                $("#repeat").val('hour').change();
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
                $("#end_type_n_rep[value=n_rep]").click();
                if(dataJSON.END_VALUE && dataJSON.END_VALUE.length){
                  $("#end_value_n_rep").val(dataJSON.END_VALUE);
                }
              break;
              case "2":
                $("#end_type_n_rep[value=date]").click();
                if(dataJSON.END_VALUE && dataJSON.END_VALUE.length){
                  var end_value = parseInt(dataJSON.END_VALUE,10) * 1000;
                  $("#end_value_date").val(
                    formatDate(end_value,'date')
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
    $("#repeat").val('week').change();
  }

  function _resetInputs(){
    $("#date_input").val(
      formatDate(false, 'date')
    );
    $("#time_input").val(defaultHour);
  }

  function _retrieve(context) {
    $("#scheduling_" + this.res + "_actions_table .create", context).remove();
    var actionsJSON = [];
    var that = this;
    $("#scheduling_" + this.res + "_actions_table tbody tr").each(function (index) {
      var first = $(this).children("td")[0];
      if (!$("select", first).html()) { //table header
        var actionJSON = {};
        if ($(this).attr("data")) {
          actionJSON = JSON.parse($(this).attr("data"));
          actionJSON.ID = String(index);
        }
      }
      if (!$.isEmptyObject(actionJSON)) { actionsJSON.push(actionJSON); };
    });
    return actionsJSON;
  }

  function _retrieveNewAction(context) {
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
          break;
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
      epochStr = new Date(timeCal);
      var time = parseInt(epochStr.getTime(),10) / 1000;
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
          var epoch_str = new Date(time_value);
          end_value = parseInt(epoch_str.getTime()) / 1000;
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
      var snap_name_val = snap_name.val();
      var snap_id_val = snap_id.val();
      var disk_id_val = disk_id.val();
      if(validateScheduleInputsEmpty(sched_action.ACTION, snap_name_val, snap_id_val, disk_id)){
        Notifier.notifyError("Check arguments for schedule action");
        return false;
      }
      var rawData = [disk_id_val,snap_id_val,snap_name_val];
      sched_action.ARGS = rawData.filter(function (e) {return e;}).join();
    }
    $("#scheduling_" + this.res + "_actions_table .create", context).remove();
    $("#scheduling_" + this.res + "_actions_table #relative_time_form", context).remove();
    $("#scheduling_" + this.res + "_actions_table #no_relative_time_form", context).remove();
    $("#no_relative_time_form", context).addClass("hide");
    $("#add_scheduling_" + this.res + "_action", context).removeAttr("disabled");
    return sched_action;
  }

  function validateScheduleInputsEmpty(action, snap_name, snap_id, disk_id){
    switch (action) {
      case 'snapshot-create':
        rtn = snap_name.length<=0;
      break;
      case 'snapshot-revert':
        rtn = snap_id.length<=0;
      break;
      case 'snapshot-delete':
        rtn = snap_id.length<=0;
      break;
      case 'disk-snapshot-create':
        rtn = snap_name.length<=0 || disk_id.length<=0;
      break;
      case 'disk-snapshot-revert':
        rtn = snap_id.length<=0 || disk_id.length<=0;
      break;
      case 'disk-snapshot-delete':
        rtn = snap_id.length<=0 || disk_id.length<=0;
      break;
      default:
        rtn = false;
      break;
    }
    return rtn;
  }

  function _fromJSONtoActionsTable(actions_array, action_id, minus) {
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

    $.each(actions_array, function (index, scheduling_action) {
      str += _fromJSONtoActionRow(scheduling_action, action_id, minus);
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

  function _fromJSONtoActionRow(scheduling_action, action_id, minus) {
    var time_str = Humanize.prettyTime(scheduling_action.TIME);
    var rep_str = "";
    var end_str = "";

    if (scheduling_action.REPEAT !== undefined) {
      if (scheduling_action.REPEAT == 0) {
        rep_str = "Weekly ";
      } else if (scheduling_action.REPEAT == 1) {
        rep_str = "Monthly ";
      } else if (scheduling_action.REPEAT == 2) {
        rep_str = "Yearly ";
      } else if (scheduling_action.REPEAT == 3) {
        rep_str = "Each " + scheduling_action.DAYS + " hours";
      }

      if (scheduling_action.REPEAT != 3) {
        if (scheduling_action.REPEAT != 0) {
          rep_str += scheduling_action.DAYS;
        } else {
          rep_str += Humanize.week_days(scheduling_action.DAYS);
        }
      }
    }

    if (scheduling_action.END_TYPE !== undefined) {
      if (scheduling_action.END_TYPE == 0) {
        end_str = "None";
      } else if (scheduling_action.END_TYPE == 1) {
        end_str = "After " + scheduling_action.END_VALUE + " times";
      } else if (scheduling_action.END_TYPE == 2) {
        end_str = "on " + Humanize.prettyTime(scheduling_action.END_VALUE);
      }
    }

    var str = "";
    if (action_id === undefined) {
      str += "<tr class='tr_action' data='" + JSON.stringify(scheduling_action) + "'>";
    }

    var time = String(scheduling_action.TIME);
    time = isNaN(time) ? time_str : (time && time.match(/^\+(.*)/gi) ? _time(time) : time_str);

    str += "<td class='action_row'>" + TemplateUtils.htmlEncode(scheduling_action.ACTION) + "</td>\
        <td nowrap class='time_row'>" + time + "</td>\
        <td nowrap class='rep_row'>" + rep_str + "</td>\
        <td nowrap class='end_row'>" + end_str + "</td>";
    if (minus === undefined) {
      var action_id = scheduling_action.ID || '';
      var update_sched = '';
      if(action_id){
        update_sched = "<button id='edit' class='small button btn-warning edit_action_x' data_id='"+action_id+"'><i class='fas fa-edit'></i></button>";
      }
      str += "<td colspan='3' style='text-align: right;'>\
              <div style='display: flex;justify-content: flex-end;'>\
                <div>\
                  <button id='minus' class='small button btn-danger remove_action_x'><i class='fas fa-trash-alt'></i></button>\
                </div>\
                <div>\
                  "+update_sched+"\
                </div>\
              </div>\
            </td>\
            </tr>";
    }

    return str;
  }

  function convertDate(date_string) {
    date_string = date_string.split("/");
    return date_string[2] + "-" + date_string[1] + "-" + date_string[0];
  }

  function parseToRequestString(data){
    var rtn = "";
    if(data){
      rtn = TemplateUtils.templateToString({SCHED_ACTION: data});
    }
    return rtn;
  }

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
    "disk-snapshot-revert"
  ];

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
    "defaultActions": defaultActions
  };
});