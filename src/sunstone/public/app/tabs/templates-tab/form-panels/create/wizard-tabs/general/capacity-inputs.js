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

//  require('foundation.slider');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');
  var UserInputs = require('utils/user-inputs');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./capacity-inputs/html');

  /*
    CONSTRUCTOR
   */

  return {
    'html': _html,
    'setup': _setup,
    'setCallback': _setCallback,
    'fill': _fill,
    'retrieve': _retrieve,
    'retrieveChanges': _retrieveChanges
  };

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML();
  }

  function _setup(context) {
  }

  /**
   * Fills the capacity inputs
   * @param  {Object} context  JQuery selector
   * @param  {Object} template VM or VMTemplate object
   */
  function _fill(context, element) {
    var fields = $('[wizard_field]', context);

    fields.each(function() {
      var field_name = $(this).attr('wizard_field');
      $(this).data("original_value", element.TEMPLATE[field_name]);
    });

    var userInputs;

    if (element.USER_TEMPLATE != undefined){
      userInputs = element.USER_TEMPLATE.USER_INPUTS;
    } else {
      userInputs = element.TEMPLATE.USER_INPUTS;
    }

    var attr;
    var input;

    if (userInputs != undefined && userInputs.CPU != undefined){
      attr = UserInputs.parse("CPU", userInputs.CPU);
    } else {
      attr = UserInputs.parse("CPU", "M|number-float|||");
    }

    if (element.TEMPLATE.CPU != undefined){
      attr.initial = element.TEMPLATE.CPU;
    }

    attr.step = 0.01;

    input = UserInputs.attributeInput(attr);

    if (attr.type != "range-float"){
      $("div.cpu_input_wrapper", context).addClass("medium-6");
    }

    $("div.cpu_input", context).html(input);

    if (userInputs != undefined && userInputs.VCPU != undefined){
      attr = UserInputs.parse("VCPU", userInputs.VCPU);
    } else {
      attr = UserInputs.parse("VCPU", "O|number|||");
    }

    if (element.TEMPLATE.VCPU != undefined){
      attr.initial = element.TEMPLATE.VCPU;
    }

    input = UserInputs.attributeInput(attr);

    if (attr.type != "range"){
      $("div.vcpu_input_wrapper", context).addClass("medium-6");
    }

    $("div.vcpu_input", context).html(input);

    if (userInputs != undefined && userInputs.MEMORY != undefined){
      attr = UserInputs.parse("MEMORY", userInputs.MEMORY);
    } else {
      attr = UserInputs.parse("MEMORY", "O|number|||");
    }

    if (element.TEMPLATE.MEMORY != undefined){
      attr.initial = element.TEMPLATE.MEMORY;
    }

    if (attr.type != "range"){
      $("div.memory_input_wrapper", context).addClass("large-6").addClass("medium-8");
    }

    UserInputs.insertAttributeInputMB(attr, $("div.memory_input", context));
  }

  /**
   * Sets a callback that will be called when the input values change
   * @param {Object}   context  jQuery selector
   * @param {Function} callback will be called as callback( retrieve(context) )
   */
  function _setCallback(context, callback) {
    context.on("input", function(){
      callback( _retrieve(context) );
    });

    callback( _retrieve(context) );
  }

  /**
   * Retrieves the input values
   * @param  {Object} context  JQuery selector
   * @return {Object}         If the input is not empty, returns:
   *                                  - CPU
   *                                  - MEMORY
   *                                  - VCPU
   */
  function _retrieve(context) {
    return WizardFields.retrieve(context);
  }

  /**
   * Retrieves the input values, but only if the value has changed from the
   * original set in fill()
   * @param  {Object} context  JQuery selector
   * @return {Object}         If the input has changed, returns:
   *                                  - CPU
   *                                  - MEMORY
   *                                  - VCPU
   */
  function _retrieveChanges(context) {
    var templateJSON = WizardFields.retrieve(context);

    var fields = $('[wizard_field]', context);

    fields.each(function() {
      var field_name = $(this).attr('wizard_field');
      if (templateJSON[field_name] == $(this).data("original_value")){
        delete templateJSON[field_name];
      }
    });

    return templateJSON;
  }
});
