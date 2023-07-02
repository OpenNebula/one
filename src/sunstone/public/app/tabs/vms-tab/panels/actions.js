/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

  var Humanize = require("utils/humanize");
  var Locale = require("utils/locale");
  var ScheduleActions = require("utils/schedule_action");
  var Sunstone = require("sunstone");
  var TemplateUtils = require("utils/template-utils");

  /*
    CONSTANTS
   */

  var PANEL_ID = require("./actions/panelId");
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
    var canAdd = !(
      that &&
      that.element &&
      that.element.USER_TEMPLATE &&
      that.element.USER_TEMPLATE.SERVICE_ID
    );
    var html = ScheduleActions.htmlTable(
      resource = RESOURCE_SCHED_ACTIONS,
      leases = canAdd,
      body = ScheduleActions.getScheduleActionTableContent(
        that.element.TEMPLATE.SCHED_ACTION,
        that.element
      ),
      isVM = true,
      canAdd = canAdd,
    );
    return html;
  }

  function _setup(context) {
    var that = this;
    that.formContext = context;

    ScheduleActions.setupButtons(
      RESOURCE_SCHED_ACTIONS,
      context,
      that
    );    
  }
});
