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

define(function (require) {
  var Config = require("sunstone-config");
  var Locale = require("utils/locale");
  var Humanize = require("utils/humanize");
  var TemplateUtils = require("utils/template-utils");
  var Tips = require("utils/tips");
  var Notifier = require("utils/notifier");

  var TemplateHTML = require("hbs!./schedule_action/html");
  var TemplateTableHTML = require("hbs!./schedule_action/table");

  function _html(resource, leases = null) {
    this.res = resource;
    return TemplateTableHTML({
      res: resource,
      leases: leases
    });
  }

  function _htmlNewAction(actions, context, res) {
    var options = "";
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
      now: "12:30"
    };
    var that = this;
    $.each(actions, function (key, action) {
      var actionAux = action.replace("-", "_");
      if (Config.isTabActionEnabled("vms-tab", "VM." + actionAux)) {
        options += "<option value=\"" + action + "\">" + Locale.tr(action) + "</option>";
      }
    });
    var schedule = $("#scheduling_" + res + "_actions_table tbody", context).append(TemplateHTML({
      "actions": options,
      "res": that.res
    }));

    //input periodic scheduled date
    schedule.find("#end_value_date",context).on("click",function(e){e.stopPropagation();$(".wickedpicker").hide();}).on("keypress",function(e){e.preventDefault(); return false;}).datepicker(options_date_picker);

    //input date scheduled
    schedule.find("#date_input",context).on("click",function(e){e.stopPropagation();$(".wickedpicker").hide();}).on("keypress",function(e){e.preventDefault(); return false;}).datepicker(options_date_picker);

    schedule.find("#time_input",context).on("click",function(e){e.stopPropagation();}).wickedpicker(options_hour_picker);

    schedule.find("#relative_time", context).on("click", function (e) {
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
    if (res === "vms") {
      $("#title", context).prop("colspan", "2");
      $("#td_days", context).prop("colspan", "5");
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
    $(".periodic", context).hide();

    $("input#schedule_type", context).on("change", function () {
      var periodic = $(this).prop("checked");

      if (periodic) {
        $(".periodic", context).show();
        $(".non-periodic", context).hide();
      } else {
        $(".periodic", context).hide();
        $(".non-periodic", context).show();
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
                    <input type=\"checkbox\" id=\"mon\" name=\"days\" value=\"0\"><label for=\"mon\">" + Locale.tr("Mo") + "</label>\
                    <input type=\"checkbox\" id=\"tue\" name=\"days\" value=\"1\"><label for=\"tue\">" + Locale.tr("Tu") + "</label>\
                    <input type=\"checkbox\" id=\"wed\" name=\"days\" value=\"2\"><label for=\"wed\">" + Locale.tr("We") + "</label>\
                    <input type=\"checkbox\" id=\"thu\" name=\"days\" value=\"3\"><label for=\"thu\">" + Locale.tr("Th") + "</label>\
                    <input type=\"checkbox\" id=\"fri\" name=\"days\" value=\"4\"><label for=\"fri\">" + Locale.tr("Fr") + "</label>\
                    <input type=\"checkbox\" id=\"sat\" name=\"days\" value=\"5\"><label for=\"sat\">" + Locale.tr("Sa") + "</label>\
                    <input type=\"checkbox\" id=\"sun\" name=\"days\" value=\"6\"><label for=\"sun\">" + Locale.tr("Su") + "</label>\
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

    context.on("focusout", "#time_input", function () {
      $("#time_input").removeAttr("data-invalid");
      $("#time_input").removeAttr("class");
    });

  }

  function _retrieve(context) {
    $("#scheduling_" + this.res + "_actions_table .create", context).remove();
    var actionsJSON = [];
    $("#scheduling_" + this.res + "_actions_table tbody tr").each(function (index) {
      var first = $(this).children("td")[0];
      if (!$("select", first).html()) {
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
      var time = parseInt(epochStr.getTime()) / 1000;
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
    $("#scheduling_" + this.res + "_actions_table .create", context).remove();
    $("#scheduling_" + this.res + "_actions_table #relative_time_form", context).remove();
    $("#scheduling_" + this.res + "_actions_table #no_relative_time_form", context).remove();
    $("#no_relative_time_form", context).addClass("hide");
    $("#add_scheduling_" + this.res + "_action", context).removeAttr("disabled");
    return sched_action;
  }

  function _fromJSONtoActionsTable(actions_array, action_id, minus) {
    var str = "";

    if (!actions_array) {
      return "";
    }

    if (!$.isArray(actions_array)) {
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

    var time = scheduling_action.TIME.toString();
    time = isNaN(time) ? time_str : (time && time.match(/^\+(.*)/gi) ? _time(time) : time_str);

    str += "<td class='action_row'>" + TemplateUtils.htmlEncode(scheduling_action.ACTION) + "</td>\
        <td nowrap class='time_row'>" + time + "</td>\
        <td nowrap class='rep_row'>" + rep_str + "</td>\
        <td nowrap class='end_row'>" + end_str + "</td>";
    if (minus === undefined) {
      str += "<td>\
                <div>\
                <a id='minus' class='remove_action_x' href='#'><i class='fas fa-trash-alt'/></a>\
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

  return {
    "fromJSONtoActionRow": _fromJSONtoActionRow,
    "fromJSONtoActionsTable": _fromJSONtoActionsTable,
    "htmlNewAction": _htmlNewAction,
    "setup": _setup,
    "htmlTable": _html,
    "retrieveNewAction": _retrieveNewAction,
    "retrieve": _retrieve
  };
});