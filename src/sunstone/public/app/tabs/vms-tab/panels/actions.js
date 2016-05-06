/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

  var Locale = require('utils/locale');
  var Sunstone = require('sunstone');
  var Humanize = require('utils/humanize');
  var TemplateUtils = require('utils/template-utils');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./actions/panelId');
  var RESOURCE = "VM";
  var XML_ROOT = "VM";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Actions");
    this.icon = "fa-calendar";

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
    var html = '<div class="row">\
      <div class="large-12 columns">\
        <table id="scheduling_actions_table" class="info_table dataTable">\
         <thead>\
           <tr>\
              <th>' + Locale.tr("ID") + '</th>\
              <th>' + Locale.tr("ACTION") + '</th>\
              <th>' + Locale.tr("TIME") + '</th>\
              <th>' + Locale.tr("DONE") + '</th>\
              <th>' + Locale.tr("MESSAGE") + '</th>\
              <th colspan="">' + Locale.tr("Actions") + '</th>\
              <th><button id="add_scheduling_action" class="button small success right radius" >' + Locale.tr("Add action") + '</button></th>\
           </tr>\
          </thead>' +
            fromJSONtoActionsTable(that.element.USER_TEMPLATE.SCHED_ACTION) +
         '</table>\
        </div>\
      </div>';

    return html;
  }

  function _setup(context) {
    var that = this;
    context.off('click', '#add_scheduling_action');
    context.on('click', '#add_scheduling_action', function() {
      $("#add_scheduling_action", context).attr("disabled", "disabled");
      $("#scheduling_actions_table").append('<tr>\
          <td></td>\
          <td>\
            <select id="select_new_action" class="select_new_action" name="select_action">\
              <option value="terminate">' + Locale.tr("terminate") + '</option>\
              <option value="terminate-hard">' + Locale.tr("terminate-hard") + '</option>\
              <option value="hold">' + Locale.tr("hold") + '</option>\
              <option value="release">' + Locale.tr("release") + '</option>\
              <option value="stop">' + Locale.tr("stop") + '</option>\
              <option value="suspend">' + Locale.tr("suspend") + '</option>\
              <option value="resume">' + Locale.tr("resume") + '</option>\
              <option value="reboot">' + Locale.tr("reboot") + '</option>\
              <option value="reboot-hard">' + Locale.tr("reboot-hard") + '</option>\
              <option value="poweroff">' + Locale.tr("poweroff") + '</option>\
              <option value="poweroff-hard">' + Locale.tr("poweroff-hard") + '</option>\
              <option value="undeploy">' + Locale.tr("undeploy") + '</option>\
              <option value="undeploy-hard">' + Locale.tr("undeploy-hard") + '</option>\
              <option value="snapshot-create">' + Locale.tr("snapshot-create") + '</option>\
            </select>\
          </td>\
         <td>\
            <input id="date_input" type="date" placeholder="2013/12/30"/>\
            <input id="time_input" type="time" placeholder="12:30"/>\
         </td>\
         <td>\
            <button id="submit_scheduling_action" class="button small secondary radius" >'              + Locale.tr("Add") + '</button>\
         </td>\
         <td colspan=2></td>\
       </tr>');

      return false;
    });

    context.off("click", "#submit_scheduling_action");
    context.on("click", "#submit_scheduling_action", function() {
      var date_input_value = $("#date_input", context).val();
      var time_input_value = $("#time_input", context).val();

      if (date_input_value == "" || time_input_value == "")
        return false;

      var time_value = date_input_value + ' ' + time_input_value

      // Calculate MAX_ID
      var max_id = -1;

      if (that.element.USER_TEMPLATE.SCHED_ACTION) {
        if (!that.element.USER_TEMPLATE.SCHED_ACTION.length) {
          var tmp_element = that.element.USER_TEMPLATE.SCHED_ACTION;
          that.element.USER_TEMPLATE.SCHED_ACTION = new Array();
          that.element.USER_TEMPLATE.SCHED_ACTION.push(tmp_element);
        }

        $.each(that.element.USER_TEMPLATE.SCHED_ACTION, function(i, element) {
          if (max_id < element.ID)
            max_id = element.ID
        })
      } else {
        that.element.USER_TEMPLATE.SCHED_ACTION = new Array();
      }

      var new_action = {};
      new_action.ID  = parseInt(max_id) + 1;
      new_action.ACTION = $("#select_new_action", context).val();
      var epoch_str   = new Date(time_value);

      new_action.TIME = parseInt(epoch_str.getTime()) / 1000;

      that.element.USER_TEMPLATE.SCHED_ACTION.push(new_action);

      // Let OpenNebula know
      var template_str = TemplateUtils.templateToString(that.element.USER_TEMPLATE);
      Sunstone.runAction("VM.update_template", that.element.ID, template_str);

      $("#add_scheduling_action", context).removeAttr("disabled");
      return false;
    });

    // Listener for key,value pair remove action
    context.off("click", ".remove_action_x");
    context.on("click", ".remove_action_x", function() {
      var index = this.id.substring(6, this.id.length);
      var tmp_tmpl = new Array();

      $.each(that.element.USER_TEMPLATE.SCHED_ACTION, function(i, element) {
        if (element.ID != index)
          tmp_tmpl[i] = element
      })

      that.element.USER_TEMPLATE.SCHED_ACTION = tmp_tmpl;
      var template_str = TemplateUtils.templateToString(that.element.USER_TEMPLATE);

      // Let OpenNebula know
      Sunstone.runAction("VM.update_template", that.element.ID, template_str);
    });

  }

  // Returns an HTML string with the json keys and values
  function fromJSONtoActionsTable(actions_array) {
    var str = ""
    var empty = '\
      <tr id="no_actions_tr">\
          <td colspan="6">' + Locale.tr("No actions to show") + '</td>\
      </tr>'    ;

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
      str += fromJSONtoActionRow(scheduling_action);
    });

    return str;
  }

  // Helper for fromJSONtoHTMLTable function
  function fromJSONtoActionRow(scheduling_action) {
    var done_str    = scheduling_action.DONE ? (Humanize.prettyTime(scheduling_action.DONE)) : "";
    var message_str = scheduling_action.MESSAGE ? scheduling_action.MESSAGE : "";
    var time_str    = Humanize.prettyTime(scheduling_action.TIME);

    var str = "";
    str += '<tr class="tr_action_' + scheduling_action.ID + '">\
       <td class="id_row">' + TemplateUtils.htmlEncode(scheduling_action.ID) + '</td>\
       <td class="action_row">' + TemplateUtils.htmlEncode(scheduling_action.ACTION) + '</td>\
       <td nowrap class="time_row">' + time_str + '</td>\
       <td class="done_row">' + done_str + '</td>\
       <td class="message_row">' + TemplateUtils.htmlEncode(message_str) + '</td>\
       <td>\
         <div>\
           <a id="minus_' + scheduling_action.ID + '" class="remove_action_x" href="#"><i class="fa fa-trash-o"/></a>\
         </div>\
       </td>\
     </tr>';

    return str;
  }
});
