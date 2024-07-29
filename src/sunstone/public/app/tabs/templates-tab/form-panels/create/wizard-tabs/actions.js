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

  var Config = require("sunstone-config");
  var Locale = require("utils/locale");
  var ScheduleActions = require("utils/schedule_action");
  var UniqueId = require("utils/unique-id");
  
  /*
    TEMPLATES
  */

  var TemplateHTML = require("hbs!./actions/html");

  /*
    CONSTANTS
  */

  var WIZARD_TAB_ID = require("./actions/wizardTabId");
  var RESOURCE = "temp";
  var CREATE = true;
  var contextRow;

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
      "table_sched_actions": ScheduleActions.htmlTable(
        resource = RESOURCE,
        leases = true,
        body = ScheduleActions.getScheduleActionTableContent(),
        isVM = false,
        canAdd = true
      )
    });
  }

  function _onShow(_, panelForm) {
  }

  function _setup(context) {
    ScheduleActions.setupButtons(
      RESOURCE,
      context,
      that
    )
  }

  function _retrieve(context) {
    var templateJSON = {};
    templateJSON["SCHED_ACTION"] = ScheduleActions.retrieve(context);
    return templateJSON;
  }

  function _fill(_, templateJSON) {
    var actions = ScheduleActions.getScheduleActionTableContent(templateJSON.SCHED_ACTION)
    $("#sched_temp_actions_body").html(actions);
    delete templateJSON["SCHED_ACTION"];
  }
});
