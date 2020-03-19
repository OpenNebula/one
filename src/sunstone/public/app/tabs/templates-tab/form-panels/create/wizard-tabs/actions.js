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

  var Config = require("sunstone-config");
  var ScheduleActions = require("utils/schedule_action");
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var WizardFields = require("utils/wizard-fields");
  var UniqueId = require("utils/unique-id");
  var Humanize = require("utils/humanize");
  var TemplateUtils = require("utils/template-utils");
  var Actions = require("utils/actions");
  var Leases = require("utils/leases");

  var TemplateHTML = require("hbs!./actions/html");
  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require("./actions/wizardTabId");

  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, "actions")) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = "fa-calendar-alt";
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
    return TemplateHTML({
      "table_sched_actions": ScheduleActions.htmlTable("temp", Leases.html()),
    });
  }

  function _onShow(context, panelForm) {
    Leases.actions(panelForm);
  }

  function _setup(context) {
    var that = this;
		var actions = ["terminate", "terminate-hard", "hold", "release", "stop", "suspend", "resume", "reboot", "reboot-hard", "poweroff", "poweroff-hard", "undeploy", "undeploy-hard", "snapshot-create"];

    context.off("click", "#add_scheduling_temp_action");
    context.on("click", "#add_scheduling_temp_action", function() {
      $("#add_scheduling_temp_action", context).attr("disabled", "disabled");
      ScheduleActions.htmlNewAction(actions, context, "temp");
      ScheduleActions.setup(context);
      return false;
    });

    context.off("click", "#add_temp_action_json");
    context.on("click" , "#add_temp_action_json", function(){
      $(".wickedpicker").hide();
      var sched_action = ScheduleActions.retrieveNewAction(context);
      if (sched_action != false) {
        $("#sched_temp_actions_body").append(ScheduleActions.fromJSONtoActionsTable(sched_action));
      }
      return false;
    });

    context.off("click", ".remove_action_x");
    context.on("click", ".remove_action_x", function () {
        $(this).parents("tr").remove();
    });

  }

  function _retrieve(context) {
    var templateJSON = {};
    templateJSON["SCHED_ACTION"] = ScheduleActions.retrieve(context);
    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var actions = ScheduleActions.fromJSONtoActionsTable(templateJSON.SCHED_ACTION);
    $("#sched_temp_actions_body").append(actions);
    delete templateJSON["SCHED_ACTION"];
  }
});
