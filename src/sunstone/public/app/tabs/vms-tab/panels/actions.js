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
  /*
    DEPENDENCIES
   */


  var Locale = require("utils/locale");
  var Sunstone = require("sunstone");
  var Humanize = require("utils/humanize");
  var TemplateUtils = require("utils/template-utils");
  var Config = require("sunstone-config");
  var ScheduleActions = require("utils/schedule_action");
  var Leases = require("utils/leases");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./actions/panelId");
  var RESOURCE = "VM";
  var XML_ROOT = "VM";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Actions");
    this.icon = "fa-calendar-alt";

    this.element = info[XML_ROOT];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var that = this;
    var html = "<div class=\"row\">\
      <div class=\"large-12 columns\">\
        <table id=\"scheduling_vms_actions_table\" class=\"info_table dataTable\">\
         <thead>\
           <tr>\
              <th>" + Locale.tr("ID") + "</th>\
              <th>" + Locale.tr("Action") + "</th>\
              <th>" + Locale.tr("Time") + "</th>\
              <th>" + Locale.tr("Rep") + "</th>\
              <th>" + Locale.tr("End") + "</th>\
              <th>" + Locale.tr("Done") + "</th>\
              <th>" + Locale.tr("Message") + "</th>\
              <th colspan=\"\"> </th>\
              <th><button id=\"add_scheduling_vms_action\" class=\"button small success right radius\" >" + Locale.tr("Add action") + "</button></th>\
              <th>" + Leases.html() + "</th>\
           </tr>\
          </thead>\
          <tbody id=\"sched_vms_actions_body\">"+
          vmsfromJSONtoActionsTable(that.element.USER_TEMPLATE.SCHED_ACTION) +
         "</tbody>\
         </table>\
        </div>\
      </div>";

    ScheduleActions.htmlTable("vms"); //only charge the resource attribute
    return html;
  }

  function _setup(context) {
    var that = this;
    that.formContext = context;
    Leases.actions(that,'vm','update');

    var actions = [
      "terminate", "terminate-hard", "hold", "release", "stop", "suspend", "resume",
      "reboot", "reboot-hard", "poweroff", "poweroff-hard", "undeploy", "undeploy-hard",
      "snapshot-create"
    ];
    
    $("#add_scheduling_vms_action").bind("click", context, function() {
      $(this).attr("disabled", "disabled");
      ScheduleActions.htmlNewAction(actions, context, "vms");
      ScheduleActions.setup(context);
      return false;
    });

    $("#add_vms_action_json").bind("click", context, function(){
      var sched_action = ScheduleActions.retrieveNewAction(context);
      if (sched_action != false) {
        $("#no_actions_tr", context).remove();
        $("#sched_vms_actions_body").append(ScheduleActions.fromJSONtoActionsTable(sched_action));
      } else {
        return false;
      }

      that.element.USER_TEMPLATE.SCHED_ACTION = ScheduleActions.retrieve(context);

      // Let OpenNebula know
      var template_str = TemplateUtils.templateToString(that.element.USER_TEMPLATE);
      Sunstone.runAction("VM.update_template", that.element.ID, template_str);

      $("#add_scheduling_vms_action", context).removeAttr("disabled");
      return false;
    });

    // Listener for key,value pair remove action
    $(".remove_action_x").bind("click", context, function() {
      var index = this.id.substring(6, this.id.length);
      var tmp_tmpl = new Array();

      $.each(that.element.USER_TEMPLATE.SCHED_ACTION, function(i, element) {
        if (element.ID && element.ID != index)
          tmp_tmpl[i] = element;
      });

      that.element.USER_TEMPLATE.SCHED_ACTION = tmp_tmpl;
      var template_str = TemplateUtils.templateToString(that.element.USER_TEMPLATE);

      // Let OpenNebula know
      Sunstone.runAction("VM.update_template", that.element.ID, template_str);
    });
  }

  // Returns an HTML string with the json keys and values
  function vmsfromJSONtoActionsTable(actions_array) {
    var str = "";
    var empty = "\
      <tr id=\"no_actions_tr\">\
          <td colspan=\"6\">" + Locale.tr("No actions to show") + "</td>\
      </tr>"    ;

    if (!actions_array) {
      return empty;
    }

    if (!$.isArray(actions_array)) {
      var tmp_array = new Array();
      tmp_array[0]  = actions_array;
      actions_array = tmp_array;
    }

    if (!actions_array.length) {
      return empty;
    }

    $.each(actions_array, function(index, scheduling_action) {
      str += "<tr class='tr_action_"+scheduling_action.ID+"' data='" + JSON.stringify(scheduling_action) + "'>";
      str += "<td class=\"id_row\">" + TemplateUtils.htmlEncode(scheduling_action.ID) + "</td>";
      var actions = ScheduleActions.fromJSONtoActionsTable([scheduling_action], scheduling_action.ID, true);
      str += actions;
      str += vmsfromJSONtoActionRow(scheduling_action);
    });

    return str;
  }

  // Helper for fromJSONtoHTMLTable function
  function vmsfromJSONtoActionRow(scheduling_action) {
    var done_str    = scheduling_action.DONE ? (Humanize.prettyTime(scheduling_action.DONE)) : "";
    var message_str = scheduling_action.MESSAGE ? scheduling_action.MESSAGE : "";

    var str = "<td class=\"done_row\">" + done_str + "</td>\
       <td class=\"message_row\">" + TemplateUtils.htmlEncode(message_str) + "</td>\
       <td>\
         <div>\
           <a id=\"minus_" + scheduling_action.ID + "\" class=\"remove_action_x\" href=\"#\"><i class=\"fas fa-trash-alt\"/></a>\
         </div>\
       </td>\
     </tr>";

    return str;
  }
});
