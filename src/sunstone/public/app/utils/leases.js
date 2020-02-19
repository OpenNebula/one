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
  var Locale = require('utils/locale');
  var TemplateUtils = require("utils/template-utils");
  var WizardFields = require('utils/wizard-fields');
  var Sunstone = require('sunstone');
  var ScheduleActions = require("utils/schedule_action");
  var notifier = require("utils/notifier");
  
  /*
    CONSTANTS
   */

  var classButton = 'button warning leases';
  var idElementSchedActions = '#sched_temp_actions_body, #sched_inst_actions_body';

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
    if(
      config && 
      config.system_config && 
      config.system_config.leases && 
      (config.system_config.leases.suspense || config.system_config.leases.terminate)
    ){
      return $("<button />", {class: classButton}).text(Locale.tr("Add lease")).prop('outerHTML');
    }
  }

  function parseVarToJqueryClass(constant){
    return "."+constant.replace(/ /g, '.');
  }

  function _actions(form, res, act){
    if(
      form &&
      form.constructor &&
      form.constructor.name &&
      (form.constructor.name === 'FormPanel' || form.constructor.name === 'Panel') && 
      config && 
      config.system_config && 
      config.system_config.leases
    ){  
      console.log("-->",form);
      $(parseVarToJqueryClass(classButton)).off("click").on("click", function(e){
        e.preventDefault();
        var confLeases = config.system_config.leases;
        var confLeasesKeys = Object.keys(confLeases);

        var showLeaseMessage = function(){
          notifier.notifyCustom(Locale.tr("Added scheduled actions"),"");
        };

        var addInTemplate = function(){
          var last = 0;
          var pass = false;
          confLeasesKeys.forEach(function(schedAction){
            if(confLeases[schedAction] && confLeases[schedAction].time){
              var schedActionTime = parseInt(confLeases[schedAction].time,10);
              var newAction = {
                TIME: last === 0? confLeases[schedAction].time : "+"+(schedActionTime+last),
                ACTION: schedAction
              };
              last = schedActionTime;
              $(idElementSchedActions).append(ScheduleActions.fromJSONtoActionsTable(newAction));
              pass = true;
            }
          });
          if(pass){
            showLeaseMessage();
          }
        };

        var type = form.constructor.name;
        var resource = null;
        var action = null;
        var template = null;
        var id = null;

        switch (type) {
          case 'FormPanel':
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
          case 'Panel':
            resource = res || null;
            action = act || null;
            template = (form.element && form.element.USER_TEMPLATE? form.element.USER_TEMPLATE : null );
            id = (form.element && form.element.ID? form.element.ID : null);
          break;
          default:
          break;
        }

        if(resource && action && template){
          switch (resource.toLowerCase()) {
            case "template":
              addInTemplate();
            break;
            case "vm":
              if(action.toLowerCase() === "update" && id){
                var newSchedActions = [];
                var index = (
                  template && template.SCHED_ACTION ?
                    (Array.isArray(template.SCHED_ACTION)? template.SCHED_ACTION.length : 1)
                  : 
                    0
                );
                var last = 0;
                confLeasesKeys.forEach(function(schedAction){
                  if(confLeases[schedAction] && confLeases[schedAction].time){
                    var schedActionTime = parseInt(confLeases[schedAction].time,10);
                    newSchedActions.push(
                      {
                        ACTION: schedAction,
                        TIME: last === 0? confLeases[schedAction].time : "+"+(schedActionTime+last),
                        ID: (index++).toString()
                      }
                    );
                    last = schedActionTime;
                  }
                });
                template.SCHED_ACTION = (
                  template.SCHED_ACTION? 
                    (Array.isArray(template.SCHED_ACTION)? template.SCHED_ACTION.concat(newSchedActions) : [template.SCHED_ACTION].concat(newSchedActions)) 
                  : 
                  newSchedActions 
                );
                template = TemplateUtils.templateToString(template);
                Sunstone.runAction("VM.update_template", id, template);
                showLeaseMessage();
              }else{
                addInTemplate();
              }
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
