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

define(function(require) {
  /*
    DEPENDENCIES
   */

  var Actions = require("opennebula/action");
  var Locale = require("utils/locale");
  var Notifier = require("utils/notifier");
  var ScheduleActions = require("utils/schedule_action");
  var TemplateUtils = require("utils/template-utils");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./sched-actions/html");


  /*
    CONSTANTS
   */

  var PANEL_ID = require("./sched-actions/panelId");
  var RESOURCE = "Service";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.icon = "fa-calendar-alt";
    this.title = Locale.tr("Actions");
    this.id = (info && info.DOCUMENT && info.DOCUMENT.ID) || "0";
    this.data = (info && info.DOCUMENT && info.DOCUMENT.TEMPLATE && info.DOCUMENT.TEMPLATE.BODY && info.DOCUMENT.TEMPLATE.BODY.roles) || [];
    this.actions = [
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
    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var sched_actions_table = "";
    var optionsActions = this.actions.map(function(ac){
      return "<option value='"+ac+"'>"+ac+"</option>";
    }).join("");

    var optionsRoles = this.data
      .filter(function(role) {
        return role && role.name;
      })
      .map(function(role){
        return "<option value='"+role.name+"'>"+role.name+"</option>";
      });

    optionsRoles.unshift("<option value=''>"+Locale.tr("All Roles")+"</option>");
    optionsRoles = optionsRoles.join("");

    if(this.data && Array.isArray(this.data) && this.data[0] && this.data[0].vm_template_contents) {
      var parseData = TemplateUtils.stringToTemplate(this.data[0].vm_template_contents);
      if(parseData && parseData.SCHED_ACTION){
        var sched_actions = Array.isArray(parseData.SCHED_ACTION)? parseData.SCHED_ACTION : [parseData.SCHED_ACTION];
        sched_actions_table = $("<table/>");
        sched_actions.forEach(function(schedAction){
          if(schedAction && schedAction.TIME && schedAction.ACTION){
            if(schedAction.TIME.startsWith("+")){
              time = ScheduleActions.parseTime(schedAction.TIME);
            }else{
              timeWithMiliSeconds = parseInt(schedAction.TIME,10) * 1000;
              timeDate = new Date(timeWithMiliSeconds);
              time = "on "+timeDate.getHours()+":"+timeDate.getMinutes()+":"+timeDate.getSeconds()+" "+timeDate.getDate() +"/"+(timeDate.getMonth()+1)+"/"+timeDate.getFullYear();
            }
            var nameAction = schedAction.ACTION;
            sched_actions_table = sched_actions_table.append(
              $("<tr/>").append(
                $("<td/>").text(nameAction).add(
                  $("<td/>").text(time)
                )
              )
            );
          }
        });
        sched_actions_table = sched_actions_table.prop("outerHTML");
      }
    }
    return TemplateHTML({
      sched_actions_table: sched_actions_table,
      actions: optionsActions,
      res: RESOURCE,
      roles: optionsRoles
    });
  }

  function _setup(context) {
    var that = this;
    $("select#select_new_action").off("change").on("change",function(){
      var snap_name = $("#snapname");
      var snap_id = $("#snapid");
      var disk_id = $("#diskid");
      switch ($(this).val()) {
        case "snapshot-create":
          snap_name.removeClass("hide");
          snap_id.addClass("hide").val("");
          disk_id.addClass("hide").val("");
        break;
        case "snapshot-revert":
          snap_name.addClass("hide").val("");
          snap_id.removeClass("hide");
          disk_id.addClass("hide").val("");
        break;
        case "snapshot-delete":
          snap_name.addClass("hide").val("");
          snap_id.removeClass("hide");
          disk_id.addClass("hide").val("");
        break;
        case "disk-snapshot-create":
          snap_name.removeClass("hide");
          snap_id.addClass("hide").val("");
          disk_id.removeClass("hide");
        break;
        case "disk-snapshot-revert":
          snap_name.addClass("hide").val("");
          snap_id.removeClass("hide");
          disk_id.removeClass("hide");
        break;
        case "disk-snapshot-delete":
          snap_name.addClass("hide").val("");
          snap_id.removeClass("hide");
          disk_id.removeClass("hide");
        break;
        default:
          snap_name.addClass("hide").val("");
          snap_id.addClass("hide").val("");
          disk_id.addClass("hide").val("");
        break;
      }
    });

    context.off("click", "#add_"+RESOURCE+"_action_json").on("click", "#add_"+RESOURCE+"_action_json", function(){
      var new_action = $("select#select_new_action").val();
      var role = $("select#role_name").val();
      var snap_name = $("#snapname").val();
      var snap_id = $("#snapid").val();
      var disk_id = $("#diskid").val();

      if(new_action){
        var actionJSON = {};
        actionJSON.error = function(e){
          Notifier.notifyError((e && e.error && e.error.message) || Locale.tr("Error"));
        };
        actionJSON.success = function(e){
          Notifier.notifyMessage(Locale.tr("Bulk Action Created"));
        };
        actionJSON.data = {};
        actionJSON.data.id = that.id;
        actionJSON.data.action = {perform: new_action};
        actionJSON.data.action.params = {};
        if(that.actions.includes(new_action)){
          var rawData = [disk_id,snap_id,snap_name];
          var args = rawData.filter(function (e) {return e;}).join();
          if(args){
            actionJSON.data.action.params.args = args;
          }
        }
        if(role!=="" && role!==undefined){
          actionJSON.data.roleName = role;
        }
        Actions.addFlowAction(actionJSON,RESOURCE);
      }
      return false;
    });
  }
});
