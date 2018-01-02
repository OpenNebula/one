/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

  var TemplateHTML = require('hbs!./capacity-create/html');

  /*
    CONSTRUCTOR
   */

  return {
    'html': _html,
    'setup': _setup,
    'fill': _fill,
    'retrieve': _retrieve,
    'calculatedRealMemory': _calculatedRealMemory,
    'calculatedRealCpu': _calculatedRealCpu,
    'totalCost': _totalCost
  };

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML();
  }

  function _m2g(val){
    if(isNaN(val) || val == ""){
      return "";
    }

    return val / 1024;
  }

  function _g2m(val){
    if(isNaN(val) || val == ""){
      return "";
    }

    return Math.floor(val * 1024);
  }
  function convertCostNumber(number){
    if(number >= 1000000){
      number = (number / 1000000).toFixed(2)
      return number.toString() + "M";
    }
    else if (number >= 1000){
      number = (number / 1000).toFixed(2)
      return number.toString() + "K";
    }
    else if (number >= 0 && number < 1000){
      return number.toFixed(2);
    }
    else {
      return number;
    }
  }

  function _totalCost(){
    var memory = $("#real_memory_cost").val();
    var cpu = $("#real_cpu_cost").val();
    var disk_cost = $("#total_value_disk").text();
    if (disk_cost === "") {
      disk_cost = 0;
    } else {
      disk_cost = parseFloat(disk_cost);
    }

    if ((memory === undefined || memory === "") && (cpu === undefined || cpu === "")){
      document.getElementById('total_cost').textContent = "Total: " + disk_cost;
    } else if(memory === undefined || memory === ""){
      document.getElementById('total_cost').textContent = "Total: " + convertCostNumber(cpu + disk_cost);
    } else if(cpu === undefined || cpu === ""){
      document.getElementById('total_cost').textContent = "Total: " + convertCostNumber(memory + disk_cost);
    } else {
      document.getElementById('total_cost').textContent = "Total: " + convertCostNumber(memory + cpu + disk_cost);
    }
  }

  function _calculatedRealMemory(){
    var memory_cost = $("#MEMORY_COST").val();
    var type_cost = $("#MEMORY_UNIT_COST").val();
    var memory = $("#MEMORY").val();
    var type = $("#memory_unit").val();
    if (type_cost == "GB"){
      memory = (memory / 1024) * memory_cost * 24 * 30;
    } else {
      memory = memory * memory_cost * 24 * 30;
    }
    document.getElementById('real_memory_cost').textContent = "Cost: " + convertCostNumber(memory);
    document.getElementById('real_memory_cost').value = memory;
    document.getElementById('total_value_memory').textContent = memory;
    _totalCost();
  }

  function _calculatedRealCpu(){
    var cpu_cost = $("#CPU_COST").val();
    var cpu = $("#CPU").val();
    cpu = cpu * cpu_cost * 24 * 30;
    document.getElementById('real_cpu_cost').textContent = "Cost: " + convertCostNumber(cpu);
    document.getElementById('real_cpu_cost').value = cpu;
    document.getElementById('total_value_cpu').textContent = cpu;
    _totalCost();
  }

  function _setup(context) {
    context.on("change", "#MEMORY", function() {
      _calculatedRealMemory();
    });

    context.on("change", "#MEMORY_GB", function() {
      _calculatedRealMemory();
    });

    context.on("change", "#memory_unit", function() {
      _calculatedRealMemory();
    });

    context.on("change", "#CPU", function() {
      _calculatedRealCpu();
    });

    // MB to GB
    context.on("input", "div.memory_input input", function(){
      $("div.memory_gb_input input", context).val(_m2g(this.value));
    });

    // MB to GB, range input
    context.on("input", "div.mb_unit input.user_input_params_min", function(){
      $("div.gb_unit input.user_input_params_min").val(_m2g(this.value));
    });

    context.on("input", "div.mb_unit input.user_input_params_max", function(){
      $("div.gb_unit input.user_input_params_max").val(_m2g(this.value));
    });

    // MB to GB, list input
    context.on("input", "div.memory_modify_opt.list input.mb_unit", function(){
      var val = this.value.split(",").map(_m2g).join(",");

      $("div.memory_modify_opt.list input.gb_unit", context).val(val);
    });

    // GB to MB
    context.on("input", "div.memory_gb_input input", function(){
      $("div.memory_input input", context).val(_g2m(this.value));
    });

    // GB to MB, range input
    context.on("input", "div.gb_unit input.user_input_params_min", function(){
      $("div.mb_unit input.user_input_params_min").val(_g2m(this.value));
    });

    context.on("input", "div.gb_unit input.user_input_params_max", function(){
      $("div.mb_unit input.user_input_params_max").val(_g2m(this.value));
    });

    // GB to MB, list input
    context.on("input", "div.memory_modify_opt.list input.gb_unit", function(){
      var val = this.value.split(",").map(_g2m).join(",");

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
        if(this.value != ""){
          $("."+classname+"_modify_opt."+this.value, context).show();
        }

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

    if (userInputsJSON) {
      $.each(["memory","cpu","vcpu"], function(i,classname){
        var name = classname.toUpperCase();

        if (userInputsJSON[name] != undefined){
          var attr = UserInputs.unmarshall(userInputsJSON[name]);

          $("."+classname+"_modify_type", context).val(attr.type).change();

          if (attr.type == "range" ||
              attr.type == "range-float"){

            var values = attr.params.split("..");  // "2..8"

            if (values.length == 2){
              var param_context = $("div."+classname+"_modify_opt."+attr.type, context);

              $("input.user_input_params_min", param_context).val(values[0]).trigger("input");
              $("input.user_input_params_max", param_context).val(values[1]).trigger("input");
            } else {
              console.error('Wrong user input parameters for "'+name+'". Expected "MIN..MAX", received "'+attr.params+'"');
            }
          } else if (attr.type == "list"){
            $("input."+classname+"_modify_opt."+attr.type, context).val(attr.params).trigger("input");
          }

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

      if (attr.type == "number" || attr.type == "number-float"){
        // Continue. No user input is the same as 'any value'
        return true;
      }

      attr.name = classname.toUpperCase();
      attr.mandatory = true;
      attr.description = "";

      if (classname == "vcpu" || attr.type == "fixed"){
        attr.mandatory = false;
      }

      attr.initial = $('input[wizard_field="'+attr.name+'"]', context).val();

      if (attr.type == "range" ||
          attr.type == "range-float"){

        var param_context = $("div."+classname+"_modify_opt."+attr.type, context);

        var min = $("input.user_input_params_min", param_context).val();
        var max = $("input.user_input_params_max", param_context).val();
        attr.params  = min + ".." + max;

      } else if (attr.type == "list"){
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
