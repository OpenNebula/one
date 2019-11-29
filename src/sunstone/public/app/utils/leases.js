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
      return "<button class='button warning leases'>"+Locale.tr("Lease")+"</button>";
    }
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
      $(".leases").off("click").on("click", function(e){
        e.preventDefault();
        var type = form.constructor.name;
        var resource = null;
        var action = null;
        var template = null;
        var id = null;

        switch (type) {
          case 'FormPanel':
            resource = form.resource || null;
            action = form.action || null;
            template = (form.wizardElement ? WizardFields.retrieve(form.wizardElement) : null);
            id = form.resourceId || null;
          break;
          case 'Panel':
            resource = res || null; // panelForm.action //validate type aciton (create or update)
            action = act || null; //panelForm.resource; //validate resource template or vm
            template = (form.element && form.element.USER_TEMPLATE? form.element.USER_TEMPLATE : null );
            id = (form.element && form.element.ID? form.element.ID : null);
          break;
          default:
          break;
        }
        if(resource && action && template && id){
          switch (resource.toLowerCase()) {
            case "template":
              console.log("Aca se tiene que añadir la scheduled actions al template", resource, action, template);
            break;
            case "vm":
              if(action.toLowerCase() === "update"){
                var newSchedActions = [];
                var index = (
                  template && template.SCHED_ACTION ?
                    (Array.isArray(template.SCHED_ACTION)? template.SCHED_ACTION.length : 1)
                  : 
                    0
                );
                Object.keys(config.system_config.leases).forEach(function(sched_action){
                  newSchedActions.push(
                    {
                      ACTION: sched_action,
                      TIME: config.system_config.leases[sched_action],
                      ID: (index++).toString()
                    }
                  );
                });
                template.SCHED_ACTION = (
                  template.SCHED_ACTION? 
                    (Array.isArray(template.SCHED_ACTION)? template.SCHED_ACTION.concat(newSchedActions) : [template.SCHED_ACTION].concat(newSchedActions)) 
                  : 
                  newSchedActions 
                );
                template = TemplateUtils.templateToString(template);
                Sunstone.runAction("VM.update_template", id, template);
              }else{
                console.log("Se tiene que añadir al template");
              }
            break;
            default:
            break;
          }
        }
        console.log("FORM", form);

      });
    }
  }
});
