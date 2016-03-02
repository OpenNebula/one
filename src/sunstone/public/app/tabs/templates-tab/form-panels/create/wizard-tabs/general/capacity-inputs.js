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
    $("div.memory_input", context).on("input", "input, select", function(){
      var val = "";

      if (this.value && this.value >= 0) {
        val = this.value / 1024;
      }

      $("input, select", $("div.memory_gb_input", context)).val(val);
    });

    // GB to MB
    $("div.memory_gb_input", context).on("input", "input, select", function(){
      var val = "";

      if (this.value && this.value >= 0) {
        val = Math.floor(this.value * 1024);
      }

      $("input, select", $("div.memory_input", context)).val(val);
    });

    var gb_inputs = $("div.memory_gb_input", context).detach();

    // Unit select
    $("#memory_unit", context).on('change', function() {
      var memory_unit_val = $('#memory_unit :selected', context).val();

      if (memory_unit_val == 'GB') {
        $("div.memory_input", context).hide();
        gb_inputs.appendTo($("div.memory_input_wrapper", context));

        $("div.memory_input input,select",context).trigger("input");
      } else {
        $("div.memory_input", context).show();
        gb_inputs = $("div.memory_gb_input", context).detach();
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

    var userInputs;

    if (element.USER_TEMPLATE != undefined){
      userInputs = element.USER_TEMPLATE.USER_INPUTS;
    } else {
      userInputs = element.TEMPLATE.USER_INPUTS;
    }

    if (userInputs != undefined){

      if (userInputs.CPU != undefined){
        var attr = UserInputs.parse("CPU", userInputs.CPU);

        if (element.TEMPLATE.CPU != undefined){
          attr.initial = element.TEMPLATE.CPU;
        }

        var input = UserInputs.attributeInput(attr);

        $("div.cpu_input", context).html(input);
      }

      if (userInputs.VCPU != undefined){
        var attr = UserInputs.parse("VCPU", userInputs.VCPU);

        if (element.TEMPLATE.VCPU != undefined){
          attr.initial = element.TEMPLATE.VCPU;
        }

        var input = UserInputs.attributeInput(attr);

        $("div.vcpu_input", context).html(input);
      }

      if (userInputs.MEMORY != undefined){
        // Normal input for MB
        var attr = UserInputs.parse("MEMORY", userInputs.MEMORY);

        if (attr.type == "range"){
          attr.tick_size = 1024;
        }

        var input = UserInputs.attributeInput(attr);

        $("div.memory_input", context).html(input);

        // Modified input for GB
        var attr_gb = UserInputs.parse("MEMORY", userInputs.MEMORY);

        attr_gb.initial = attr_gb.initial / 1024;

        if (attr_gb.type == "range"){
          attr_gb.type = "range-float";
          attr_gb.min = Math.ceil((attr_gb.min / 1024));
          attr_gb.max = Math.floor((attr_gb.max / 1024));
          attr_gb.step = "1";
          attr_gb.tick_size = 1;

        } else if (attr_gb.type == "list"){
          attr_gb.options = attr_gb.options.map(function(e){
                              return e / 1024;
                            });

        } else if (attr_gb.type == "number"){
          attr_gb.type = "number-float";
          attr_gb.step = "1";
        }

        input = UserInputs.attributeInput(attr_gb);
        $("div.memory_gb_input", context).html(input);
        $("input, select", $("div.memory_gb_input", context)).removeAttr("wizard_field");
      }
    }

    WizardFields.fill(context, element.TEMPLATE);

    // Update memory_gb with the value set in memory
    $("input, select", $("div.memory_input", context)).trigger("input");

    if ($("input, select", $("div.memory_input", context)).val() >= 1024){
      $("#memory_unit", context).val("GB").change();
    } else {
      $("#memory_unit", context).val("MB").change();
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
