/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');
  var UniqueId = require('utils/unique-id');
  var Humanize = require('utils/humanize');
  var TemplateUtils = require('utils/template-utils');
  var Actions = require('utils/actions');

  var TemplateHTML = require('hbs!./actions/html');
  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./actions/wizardTabId');

  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, 'actions')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = "fa-calendar";
    this.title = Locale.tr("Actions");
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;

  return WizardTab;

  function _html() {
    return TemplateHTML();
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context) {
    var that = this;
		var actions = ["terminate", "terminate-hard", "hold", "release", "stop", "suspend", "resume", "reboot", "reboot-hard", "poweroff", "poweroff-hard", "undeploy", "undeploy-hard", "snapshot-create"];
    context.off('click', '#add_scheduling_temp_action');
    context.on('click', '#add_scheduling_temp_action', function() {
      $("#add_scheduling_temp_action", context).attr("disabled", "disabled");
      var html = '<tr>\
      <td></td>\
      <td>\
      <select id="select_new_action" class="select_new_action" name="select_action">';
      $.each(actions, function(key, action){
        var actionAux = action.replace("-", "_");
        if (Config.isTabActionEnabled("vms-tab", "VM." + actionAux)){
          html += '<option value="' + action + '">' + Locale.tr(action) + '</option>';
        }
      });
      html += '</select>\
        </td>\
          <td>\
            <input id="date_input" type="date" placeholder="2013/12/30"/>\
            <input id="time_input" type="time" placeholder="12:30"/>\
          </td>\
        <td>\
          <button id="add_temp_action_json" class="button small secondary radius" >' + Locale.tr("Add") + '</button>\
        </td>\
        <td colspan=2></td>\
      </tr>';
      $("#scheduling_temp_actions_table").append(html);
      return false;
    });

    context.off("click", "#add_temp_action_json");
    context.on("click" , "#add_temp_action_json", function(){
      var date_input_value = $("#date_input", context).val();
      var time_input_value = $("#time_input", context).val();

      if (date_input_value == "" || time_input_value == ""){
        return false;
      }

      var time_value = date_input_value + ' ' + time_input_value;
      var epoch_str = new Date(time_value);
      var time = parseInt(epoch_str.getTime()) / 1000;

      var new_action = $("#select_new_action", context).val();
      var sched_action = {};
      sched_action.ACTION = new_action;
      sched_action.TIME = time;

      $(this).parents('tr').remove();
      $("#add_scheduling_temp_action", context).removeAttr("disabled");

      $("#sched_temp_actions_body").append(Actions.fromJSONtoActionsTable(sched_action));
			
      return false;
    });

    context.on("focusout" , "#time_input", function(){
      $("#time_input").removeAttr("data-invalid");
      $("#time_input").removeAttr("class");
    });

    context.off("click", ".remove_action_x");
    context.on("click", ".remove_action_x", function(){
      $(this).parents('tr').remove();
    });
  }

  function _retrieve(context) {
    var templateJSON = {};
    var actionsJSON = [];

    $("#scheduling_temp_actions_table tbody tr").each(function(index){
      var first = $(this).children("td")[0];
      if(!$('select', first).html()){
        var actionJSON = {};
        actionJSON.ID = index;
        $(this).children("td").each(function(index2){
          if(index2 == 0)
            actionJSON.ACTION = $(this).text();
          else if (index2 == 1){
            var pretty_time = $(this).text();
            pretty_time = pretty_time.split(' ');
            var date = Actions.convertDate(pretty_time[1]);
            var time_value = date + ' ' + pretty_time[0];
            var epoch_str = new Date(time_value);
            var time = parseInt(epoch_str.getTime()) / 1000;
            actionJSON.TIME = time;
          }
        });
      }
      if (!$.isEmptyObject(actionJSON)) {actionsJSON.push(actionJSON)};
    });

    templateJSON['SCHED_ACTION'] = actionsJSON;
    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var actions = Actions.fromJSONtoActionsTable(templateJSON.SCHED_ACTION);
    $("#sched_temp_actions_body").append(actions);
    delete templateJSON['SCHED_ACTION'];
  }
});
