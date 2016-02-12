/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

  require('foundation.slider');
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
    // MB to GB
    context.on("input", "div.memory_input input", function(){
      if (this.value && this.value >= 0) {
        $("div.memory_gb_input input", context).val( this.value / 1024 );
      } else {
        $("div.memory_gb_input input", context).val("");
      }
    });

    // GB to MB
    context.on("input", "div.memory_gb_input input", function(){
      if (this.value && this.value >= 0) {
        $("div.memory_input input", context).val( Math.floor(this.value * 1024) );
      } else {
        $("div.memory_input input", context).val("");
      }
    });

    // Unit select
    $("#memory_unit", context).on('change', function() {
      var memory_unit_val = $('#memory_unit :selected', context).val();

      if (memory_unit_val == 'GB') {
        $("div.memory_input", context).hide();
        $("div.memory_gb_input", context).show();
      } else {
        $("div.memory_input", context).show();
        $("div.memory_gb_input", context).hide();
      }
    });

    $("#memory_unit", context).change();
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

    WizardFields.fill(context, element.TEMPLATE);

    var userInputs = element.TEMPLATE.USER_INPUTS;
    if (userInputs != undefined){

      if (userInputs.CPU != undefined){
        var input = UserInputs.generateInputElement("CPU", userInputs.CPU);

        $("div.cpu_input", context).html(input);
      }

      if (userInputs.VCPU != undefined){
        var input = UserInputs.generateInputElement("VCPU", userInputs.VCPU);

        $("div.vcpu_input", context).html(input);
      }

      if (userInputs.MEMORY != undefined){
        // Normal input for MB
        var attr = UserInputs.parse("MEMORY", userInputs.MEMORY);
        attr.step = 256;
        var input = UserInputs.attributeInput(attr);

        $("div.memory_input", context).html(input);

        // Modified input for GB
        var attr_gb = UserInputs.parse("MEMORY", userInputs.MEMORY);

        if (attr_gb.type == "range"){
          attr_gb.type = "range-float";
          attr_gb.min = (attr_gb.min / 1024);
          attr_gb.max = (attr_gb.max / 1024);
          attr_gb.initial = (attr_gb.initial / 1024);
          attr_gb.step = (0.25);
        } else if (attr_gb.type == "list"){
          attr_gb.options = attr_gb.options.map(function(e){
                              return e / 1024;
                            });

          attr_gb.initial = attr_gb.initial / 1024;
        } else {
          // TODO: error?
        }

        input = UserInputs.attributeInput(attr_gb);
        $("div.memory_gb_input", context).html(input);
        $("div.memory_gb_input input", context).removeAttr("wizard_field");
      }
    }

    // Update memory_gb with the value set in memory
    $("div.memory_input input", context).trigger("input");

    if ($("div.memory_input input", context).val() >= 1024){
      $("#memory_unit", context).val("GB").change();
    }
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
