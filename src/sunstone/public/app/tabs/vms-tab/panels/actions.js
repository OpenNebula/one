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
  var RESOURCE_SCHED_ACTIONS = "vms";
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
    var html = "<div class='row'>\
      <div class='large-12 columns'>\
        <table id='scheduling_vms_actions_table' class='info_table dataTable'>\
         <thead>\
           <tr>\
              <th>" + Locale.tr("ID") + "</th>\
              <th>" + Locale.tr("Action") + "</th>\
              <th>" + Locale.tr("Time") + "</th>\
              <th>" + Locale.tr("Rep") + "</th>\
              <th>" + Locale.tr("End") + "</th>\
              <th>" + Locale.tr("Done") + "</th>\
              <th>" + Locale.tr("Message") + "</th>\
              <th colspan=''> </th>\
              <th><button id='add_scheduling_vms_action' class='button small success right radius' >" + Locale.tr("Add action") + "</button></th>\
              <th>" + Leases.html() + "</th>\
           </tr>\
          </thead>\
          <tbody id='sched_vms_actions_body' class='scheduling_place'>"+
          vmsfromJSONtoActionsTable(that.element.USER_TEMPLATE.SCHED_ACTION) +
         "</tbody>\
         </table>\
        </div>\
      </div>";

    ScheduleActions.htmlTable(RESOURCE_SCHED_ACTIONS); //only charge the resource attribute
    return html;
  }

  function _setup(context) {
    var CREATE = true;
    var that = this;
    that.formContext = context;
    Leases.actions(that,"vm","update");
    var actions = ScheduleActions.defaultActions;

    function renderCreateForm(){
      if(CREATE){
        ScheduleActions.htmlNewAction(actions, context, "vms");
        ScheduleActions.setup(context);
        CREATE = false;
      }
      return false;
    };

    context.off("click", "#add_scheduling_vms_action");
    context.on("click" , "#add_scheduling_vms_action", function(e){
      e.preventDefault();
      renderCreateForm();
      $("#edit_"+RESOURCE_SCHED_ACTIONS+"_action_json").hide();
      $("#add_"+RESOURCE_SCHED_ACTIONS+"_action_json").show();
    });

    context.off("click", "#add_vms_action_json");
    context.on("click" , "#add_vms_action_json", function(){
      var sched_action = ScheduleActions.retrieveNewAction(context);
      if (sched_action != false) {
        $("#no_actions_tr", context).remove();
        $("#sched_vms_actions_body").prepend(ScheduleActions.fromJSONtoActionsTable(sched_action));
      } else {
        return false;
      }
      that.element.USER_TEMPLATE.SCHED_ACTION = ScheduleActions.retrieve(context);
      // Let OpenNebula know
      var template_str = TemplateUtils.templateToString(that.element.USER_TEMPLATE);
      Sunstone.runAction("VM.update_template", that.element.ID, template_str);
      return false;
    });

    context.off("click" , "#edit_vms_action_json").on("click" , "#edit_vms_action_json", function(e){
      e.preventDefault();
      var id = $(this).attr("data_id");
      if(id && id.length){
        $(".wickedpicker").hide();
        var sched_action = ScheduleActions.retrieveNewAction(context);
        if (sched_action != false) {
          sched_action.ID = id;
          var sched_actions = ScheduleActions.retrieve(context);
          if(Array.isArray(sched_actions)){
            sched_actions = sched_actions.map(function(action){
              if(action && action.ID && action.ID===id){
                return sched_action;
              }else{
                return action;
              }
            });
          }
          that.element.USER_TEMPLATE.SCHED_ACTION = sched_actions;
          var template_str = TemplateUtils.templateToString(that.element.USER_TEMPLATE);
          Sunstone.runAction("VM.update_template", that.element.ID, template_str);
        }
        clear();
      }
      return false;
    });

    // Listener for key,value pair remove action
    context.off("click", ".remove_action_x");
    context.on("click", ".remove_action_x", function() {
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
    context.off("click", ".edit_action_x");
    context.on("click", ".edit_action_x", function(e) {
      e.preventDefault();
      var id = $(this).attr("data_id");
      if(id && id.length){
        renderCreateForm();
        $("#edit_"+RESOURCE_SCHED_ACTIONS+"_action_json").show().attr("data_id", id);
        $("#add_"+RESOURCE_SCHED_ACTIONS+"_action_json").hide();
        ScheduleActions.fill($(this),context);
      }
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

    if (!Array.isArray(actions_array)) {
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

  function clear(){
    CREATE = true;
  }

  // Helper for fromJSONtoHTMLTable function
  function vmsfromJSONtoActionRow(scheduling_action) {
    var done_str    = scheduling_action.DONE ? (Humanize.prettyTime(scheduling_action.DONE)) : "";
    var message_str = scheduling_action.MESSAGE ? scheduling_action.MESSAGE : "";
    var action_id = scheduling_action.ID || "";
    var update_sched = "";
    if(action_id){
      update_sched = "<button id='minus_"+scheduling_action.ID+ "' class='small button btn-warning edit_action_x' data_id='"+action_id+"'><i class='fas fa-edit'></i></button>";
    }
    var str = "<td class='done_row'>" + done_str + "</td>\
       <td class='message_row'>" + TemplateUtils.htmlEncode(message_str) + "</td>\
       <td colspan='3' style='text-align: right;'>\
         <div style='display: flex;justify-content: flex-end;'>\
          <div>\
            <button id='minus_" + scheduling_action.ID + "' class='small button btn-danger remove_action_x'><i class='fas fa-trash-alt'></i></button>\
          </div>\
          <div>"+update_sched+"</div>\
       </td>\
     </tr>";

    return str;
  }
});
