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

  var Config = require("sunstone-config");
  var Leases = require("utils/leases");
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
      "table_sched_actions": ScheduleActions.htmlTable(RESOURCE, Leases.html()),
    });
  }

  function _onShow(_, panelForm) {
    Leases.actions(panelForm);
  }

  function _setup(context) {
    if(!CREATE){
      CREATE = true;
    }

    var actions = ScheduleActions.defaultActions;

    function renderCreateForm() {
      if(CREATE){
        ScheduleActions.htmlNewAction(actions, context, "temp");
        ScheduleActions.setup(context);
        CREATE = false;
      }
      return false;
    }
    context.off("click", "#add_scheduling_temp_action");
    context.on("click", "#add_scheduling_temp_action", function(e){
      renderCreateForm();
      e.preventDefault();
      ScheduleActions.reset();
      $("#edit_"+RESOURCE+"_action_json").hide();
      $("#add_"+RESOURCE+"_action_json").show();
    });

    context.off("click", "#add_temp_action_json");
    context.on("click" , "#add_temp_action_json", function(){
      $(".wickedpicker").hide();
      var sched_action = ScheduleActions.retrieveNewAction(context);
      if (sched_action != false) {
        $("#sched_temp_actions_body").prepend(ScheduleActions.fromJSONtoActionsTable(sched_action));
      }
      $("#input_sched_action_form").remove();
      clear();
      return false;
    });

    context.off("click" , "#edit_temp_action_json").on("click" , "#edit_temp_action_json", function(e){
      e.preventDefault();
      var id = $(this).attr("data_id");
      if(id && id.length && contextRow){
        $(".wickedpicker").hide();
        var sched_action = ScheduleActions.retrieveNewAction(context);
        if (sched_action != false) {
          sched_action.ID = id;
          contextRow.replaceWith(ScheduleActions.fromJSONtoActionsTable(sched_action));
          contextRow = undefined;
          $("#input_sched_action_form").remove();
        }
        clear();
      }
      return false;
    });

    context.off("click", ".remove_action_x");
    context.on("click", ".remove_action_x", function () {
        $(this).parents("tr").remove();
    });

    context.off("click", ".edit_action_x");
    context.on("click", ".edit_action_x", function (e) {
      e.preventDefault();
      var id = $(this).attr("data_id");
      if(id && id.length){
        contextRow = $(this).closest("tr.tr_action");
        renderCreateForm();
        $("#edit_"+RESOURCE+"_action_json").show().attr("data_id", id);
        $("#add_"+RESOURCE+"_action_json").hide();
        ScheduleActions.fill($(this),context);
      }
    });
  }

  function _retrieve(context) {
    var templateJSON = {};
    templateJSON["SCHED_ACTION"] = ScheduleActions.retrieve(context);
    return templateJSON;
  }

  function clear(){
    CREATE = true;
  }

  function _fill(_, templateJSON) {
    var actions = ScheduleActions.fromJSONtoActionsTable(templateJSON.SCHED_ACTION);
    $("#sched_temp_actions_body").prepend(actions);
    delete templateJSON["SCHED_ACTION"];
  }
});
