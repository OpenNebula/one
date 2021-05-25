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
  var TemplateUtils = require("utils/template-utils");
  var WizardFields = require("utils/wizard-fields");
  var Sunstone = require("sunstone");
  var ScheduleActions = require("utils/schedule_action");
  var notifier = require("utils/notifier");
  var CONFIRM_DIALOG_LEASES = require("utils/dialogs/leases/dialogId");

  /*
    CONSTANTS
   */

  var classButton = "small button leases right radius";
  var idElementSchedActions = "#sched_temp_actions_body, #sched_inst_actions_body, #sched_service_create_actions_body";

  /*
    CONSTRUCTOR
   */

  return {
    html: _html,
    actions: _actions
  };

  /*
    FUNCTION DEFINITIONS
   */

  function _html(){
    var rtn = "";
    if(
      config &&
      config.system_config &&
      config.system_config.leases &&
      (config.system_config.leases.suspend || config.system_config.leases.terminate)
    ){
      rtn = $("<button />", {class: classButton, type:"button"}).append(
        $("<i/>", {class: "fa fa-clock"})
      ).prop("outerHTML");
    }
    return rtn;
  }

  function parseVarToJqueryClass(constant){
    return "."+constant.replace(/ /g, ".");
  }

  function _actions(form, res, act, callback){
    if(
      form &&
      form.constructor &&
      form.constructor.name &&
      (form.constructor.name === "FormPanel" || form.constructor.name === "Panel") &&
      config &&
      config.system_config &&
      config.system_config.leases
    ){
      form.formContext.off("click", parseVarToJqueryClass(classButton));
      form.formContext.on("click", parseVarToJqueryClass(classButton), function(e){
        e.preventDefault();
        var confLeases = config.system_config.leases;
        var confLeasesKeys = Object.keys(confLeases);

        var type = form.constructor.name;
        var resource = null;
        var action = null;
        var template = null;
        var id = null;

        var showLeaseMessage = function(){
          notifier.notifyCustom(Locale.tr("Added scheduled actions"),"");
        };

        var nowEpoch = function(){
          epochStr = new Date();
          return parseInt(epochStr.getTime(),10) / 1000;
        };

        //render leases for modal
        var renderLeasesForModal = function(template, now) {
          var rtn = "";
          var last = 0;
          if(confLeasesKeys && Array.isArray(confLeasesKeys)){
            rtn = $("<table/>");
            confLeasesKeys.forEach(function(schedAction){
              if(confLeases[schedAction] && confLeases[schedAction].time){
                var schedActionTime = parseInt(confLeases[schedAction].time,10);
                var startTime = Math.round(now) + schedActionTime;
                var time =  "+"+(last === 0? startTime.toString() : startTime+last);
                var nameAction = schedAction;
                rtn = rtn.append(
                  $("<tr/>").append(
                    $("<td/>").text(nameAction).add(
                      $("<td/>").text(ScheduleActions.parseTime(time))
                    )
                  )
                );
                last = schedActionTime;
              }
            });
            rtn = rtn.prop("outerHTML");
          }
          return rtn;
        };

        // confirm modal
        var displayAlertCreateLeases = function(typeSubmit, template){
          var now = template && template.STIME? nowEpoch() - parseInt(template.STIME,10) : 0;
          Sunstone.getDialog(CONFIRM_DIALOG_LEASES).setParams({
            header: Locale.tr("Scheduled actions to add"),
            body : renderLeasesForModal(template, now),
            submit : function(params) {
              addInTemplate(typeSubmit, template, now);
              return false;
            }
          });
          Sunstone.getDialog(CONFIRM_DIALOG_LEASES).reset();
          Sunstone.getDialog(CONFIRM_DIALOG_LEASES).show();
        };

        var addInTemplate = function(typeSubmit, template, now){
          var type = typeSubmit? typeSubmit : "add";
          var last = 0;
          var pass = false;
          var newSchedActions =[];
          var index = (
            template && template.SCHED_ACTION ?
              (Array.isArray(template.SCHED_ACTION)? template.SCHED_ACTION.length : 1)
            :
              0
          );

          confLeasesKeys.forEach(function(schedAction){
            if(confLeases[schedAction] && confLeases[schedAction].time){
              var schedActionTime = parseInt(confLeases[schedAction].time,10);
              var startTime = Math.round(now) + schedActionTime;
              switch (type) {
                case "add":
                  var newAction = {
                    TIME: "+"+(last === 0? startTime.toString() : startTime+last),
                    ACTION: schedAction
                  };
                  $(idElementSchedActions).prepend(ScheduleActions.fromJSONtoActionsTable(newAction));
                break;

                case "submit":
                  var newAction = {
                    ACTION: schedAction,
                    TIME: "+"+(last === 0? startTime.toString() : startTime+last),
                    ID: (index++).toString()
                  };

                  newSchedActions.push(
                    newAction
                  );
                break;

                case "add-service":
                  var newAction = {
                    TIME: "+"+(last === 0? startTime.toString() : startTime+last),
                    ACTION: schedAction
                  };
                  newSchedActions.push(newAction);
                break;

                default:
                break;
              }
              last = schedActionTime;
              pass = true;
            }
          });

          if(type==="submit"){
            template.SCHED_ACTION = (
              template.SCHED_ACTION?
                (Array.isArray(template.SCHED_ACTION)?
                  template.SCHED_ACTION.concat(newSchedActions)
                :
                  [template.SCHED_ACTION].concat(newSchedActions))
              :
              newSchedActions
            );
            template = TemplateUtils.templateToString(template);
            Sunstone.runAction("VM.update_template", id, template);
          }

          if(typeof callback === "function"){
            callback(newSchedActions);
          }

          if(pass){
            showLeaseMessage();
          }
        };

        switch (type) {
          case "FormPanel":
            resource = form.resource || null;
            action = form.action || null;
            template = ( form.jsonTemplate ?
                  form.jsonTemplate
                :
                  (
                    form.wizardElement ?
                      WizardFields.retrieve(form.wizardElement)
                    :
                      null
                  )
            );
            id = form.resourceId || null;
          break;
          case "Panel":
            resource = res || null;
            action = act || null;
            template = (form.element && form.element.USER_TEMPLATE? form.element.USER_TEMPLATE : null );
            id = (form.element && form.element.ID? form.element.ID : null);
            // get history
            if(form.element &&
              form.element.HISTORY_RECORDS &&
              form.element.HISTORY_RECORDS.HISTORY &&
              form.element.HISTORY_RECORDS.HISTORY.STIME && template){
              template.STIME = form.element.HISTORY_RECORDS.HISTORY.STIME;
            }
          break;
          default:
          break;
        }
        if(resource && action){
          switch (resource.toLowerCase()) {
            case "template":
              if(template){
                displayAlertCreateLeases("add", template);
              }
            break;
            case "vm":
              if(template){
                if(action.toLowerCase() === "update" && id){
                  displayAlertCreateLeases("submit", template);
                }else{
                  displayAlertCreateLeases("add", template);
                }
              }
            break;
            case "flow":
              displayAlertCreateLeases("add-service");
            break;
            default:
            break;
          }
        }
      });
    }else{
      $(parseVarToJqueryClass(classButton)).off("click").remove();
    }
  }
});
