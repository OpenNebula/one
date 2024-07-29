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
  var Sunstone = require("sunstone");
  var Actions = require("opennebula/action");
  var Service = require("opennebula/service");
  var Locale = require("utils/locale");
  var Notifier = require("utils/notifier");
  var ScheduleActions = require("utils/schedule_action");
  var TemplateUtils = require("utils/template-utils");
  var OpenNebulaAction = require("../../../opennebula/action");
  var Humanize = require("utils/humanize");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./sched-actions/html");


  /*
    CONSTANTS
   */

  var PANEL_ID = require("./sched-actions/panelId");
  var RESOURCE = "Service";
  var RESOURCE_SCHED_ACTIONS = "flow";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.icon = "fa-calendar-alt";
    this.title = Locale.tr("Actions");
    this.id = (info && info.DOCUMENT && info.DOCUMENT.ID) || "0";
    this.body = (info && info.DOCUMENT && info.DOCUMENT.TEMPLATE && info.DOCUMENT.TEMPLATE.BODY) || {};
    this.data = (this.body && this.body.roles) || [];
    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlSchedActions(sched_actions_array){
    return ScheduleActions.htmlTable(
      resource = RESOURCE_SCHED_ACTIONS,
      leases = true,
      body = ScheduleActions.getScheduleActionTableContent(
        sched_actions_array
      ),
      isVM = false,
      canAdd = true
    );
  }

  function _htmlPerformAction(optionsRoles){
    return ScheduleActions.htmlPerformAction(
      RESOURCE,
      optionsRoles
    );
  }

  function _html() {
    var optionsRoles = this.data
      .filter(function(role) {
        return role && role.name;
      })
      .map(function(role){
        return "<option value='"+role.name+"'>"+role.name+"</option>";
      });

    optionsRoles.unshift("<option value=''>"+Locale.tr("All Roles")+"</option>");
    optionsRoles = optionsRoles.join("");

    var that = this;
    var selector = "#service_sched_action_tab .sched_place";
    ScheduleActions.updateServiceHTMLTable(
      that,
      selector,
      _htmlSchedActions
    );

    return TemplateHTML({
      sched_actions_table: _htmlSchedActions(),
      perform_action: _htmlPerformAction(optionsRoles)
    });
  }
  
  function _setup(context) {
    var that = this;
    that.formContext = context;

    ScheduleActions.setupButtons(
      RESOURCE_SCHED_ACTIONS,
      context,
      that
    );

    ScheduleActions.setupPerformAction(
      RESOURCE,
      that.id //service ID
    );
  }
});
