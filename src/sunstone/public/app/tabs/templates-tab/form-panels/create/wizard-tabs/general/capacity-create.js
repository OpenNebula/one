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

  var TemplateHTML = require('hbs!./capacity-create/html');

  /*
    CONSTRUCTOR
   */

  return {
    'html': _html,
    'setup': _setup,
    'fill': _fill,
    'retrieve': _retrieve
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

    // MB to GB, range input
    context.on("input", "div.memory_modify_opt.range input.mb_unit", function(){
      var val = this.value.split("..").map(function(e){
          if(isNaN(e) || e == ""){
            return "";
          }

          return e / 1024;
        }).join("..");

      $("div.memory_modify_opt.range input.gb_unit", context).val(val);
    });

    // MB to GB, list input
    context.on("input", "div.memory_modify_opt.list input.mb_unit", function(){
      var val = this.value.split(",").map(function(e){
          if(isNaN(e) || e == ""){
            return "";
          }

          return e / 1024;
        }).join(",");

      $("div.memory_modify_opt.list input.gb_unit", context).val(val);
    });

    // GB to MB
    context.on("input", "div.memory_gb_input input", function(){
      if (this.value && this.value >= 0) {
        $("div.memory_input input", context).val( Math.floor(this.value * 1024) );
      } else {
        $("div.memory_input input", context).val("");
      }
    });

    // GB to MB, range input
    context.on("input", "div.memory_modify_opt.range input.gb_unit", function(){
      var val = this.value.split("..").map(function(e){
          if(isNaN(e) || e == ""){
            return "";
          }

          return Math.floor(e * 1024);
        }).join("..");

      $("div.memory_modify_opt.range input.mb_unit", context).val(val);
    });

    // GB to MB, list input
    context.on("input", "div.memory_modify_opt.list input.gb_unit", function(){
      var val = this.value.split(",").map(function(e){
          if(isNaN(e) || e == ""){
            return "";
          }

          return Math.floor(e * 1024);
        }).join(",");

      $("div.memory_modify_opt.list input.mb_unit", context).val(val);
    });

    // Unit select
    $("#memory_unit", context).on('change', function() {
      var memory_unit_val = $('#memory_unit :selected', context).val();

      if (memory_unit_val == 'GB') {
        $(".mb_unit", context).hide();
        $(".gb_unit", context).show();
      } else {
        $(".mb_unit", context).show();
        $(".gb_unit", context).hide();
      }

      $(".memory_modify_unit", context).text(memory_unit_val);
    });

    $("#memory_unit", context).change();

    // Select for memory, cpu, vcpu modification on instantiate
    $.each(["memory","cpu","vcpu"], function(i,classname){
      $("."+classname+"_modify_type", context).on("change", function(){
        $("."+classname+"_modify_opt", context).hide();
        $("."+classname+"_modify_opt."+this.value, context).show();

        $("#memory_unit", context).change();
      });

      $("."+classname+"_modify_type", context).change();
    });
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
      $(this).data("original_value", element[field_name]);
    });

    WizardFields.fill(context, element);

    // Update memory_gb with the value set in memory
    $("div.memory_input input", context).trigger("input");

    if ($("div.memory_input input", context).val() && $("div.memory_input input", context).val() < 1024){
      $("#memory_unit", context).val("MB").change();
    } else {
      $("#memory_unit", context).val("GB").change();
    }

    var userInputsJSON = element['USER_INPUTS'];

    $("[class$=_modify_type]", context).val("fixed").change();

    if (userInputsJSON) {
      $.each(["memory","cpu","vcpu"], function(i,classname){
        var name = classname.toUpperCase();

        if (userInputsJSON[name] != undefined){
          var attr = UserInputs.unmarshall(userInputsJSON[name]);

          $("."+classname+"_modify_type", context).val(attr.type).change();

          $("input."+classname+"_modify_opt."+attr.type, context).val(attr.params).trigger("input");

          delete userInputsJSON[name];
        }
      });
    }
  }

  /**
   * Retrieves the input values
   * @param  {Object} context  JQuery selector
   * @return {Object}         If the input is not empty, returns:
   *                                  - CPU
   *                                  - MEMORY
   *                                  - VCPU
   *                                  - USER_INPUTS for cpu, memory, vcpu
   */
  function _retrieve(context) {
    var templateJSON = WizardFields.retrieve(context);

    var userInputsJSON = {};

    $.each(["memory","cpu","vcpu"], function(i,classname){
      var attr = {};

      attr.type = $("."+classname+"_modify_type", context).val();

      if (attr.type == "fixed"){
        // No user input, continue
        return true;
      }

      attr.name = classname.toUpperCase();
      attr.mandatory = true;
      attr.description = "";

      attr.initial = $('input[wizard_field="'+attr.name+'"]', context).val();

      if (attr.type == "range" ||
          attr.type == "range-float" ||
          attr.type == "list"){

          attr.params = $("input."+classname+"_modify_opt."+attr.type, context).val();
      }

      userInputsJSON[attr.name] = UserInputs.marshall(attr);
    });

    if (!$.isEmptyObject(userInputsJSON)) {
      templateJSON['USER_INPUTS'] = userInputsJSON;
    }

    return templateJSON;
  }
});
