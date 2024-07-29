/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

  var CoresPerSocket = require("tabs/templates-tab/form-panels/create/wizard-tabs/utils/cores-per-socket");
  var UserInputs = require("utils/user-inputs");
  var WizardFields = require("utils/wizard-fields");
  var Config = require("sunstone-config");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./capacity-create/html");

  /*
    CONSTANTS
   */

  var VCPU_SELECTOR = "#VCPU";

  /*
    CONSTRUCTOR
   */

  return {
    "html": _html,
    "setup": _setup,
    "fill": _fill,
    "retrieve": _retrieve,
    "calculatedRealMemory": _calculatedRealMemory,
    "calculatedRealCpu": _calculatedRealCpu,
    "totalCost": _totalCost
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
      number = (number / 1000000).toFixed(2);
      return number.toString() + "M";
    }
    else if (number >= 1000){
      number = (number / 1000).toFixed(2);
      return number.toString() + "K";
    }
    else if (number >= 0 && number < 1000){
      number = (typeof number === "string"? parseFloat(number) : number);
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
    var elementTotalCost = document.getElementById("total_cost");
    if (disk_cost === "") {
      disk_cost = 0;
    } else {
      disk_cost = parseFloat(disk_cost);
    }
    if(elementTotalCost){
      if ((memory === undefined || memory === "") && (cpu === undefined || cpu === "")){
        elementTotalCost.textContent = "Total: " + disk_cost;
      } else if(memory === undefined || memory === ""){
        elementTotalCost.textContent = "Total: " + convertCostNumber(cpu + disk_cost);
      } else if(cpu === undefined || cpu === ""){
        elementTotalCost.textContent = "Total: " + convertCostNumber(memory + disk_cost);
      } else {
        elementTotalCost.textContent = "Total: " + convertCostNumber(memory + cpu + disk_cost);
      }
    }
  }

  function _calculatedRealMemory(context){
    if (Config.isFeatureEnabled("showback")){
      var memory_cost = $("#MEMORY_COST").val() || 0;
      var type_cost   = $("#MEMORY_UNIT_COST").val() || 0;
      var memory = $("#MEMORY").val();
      
      if (type_cost == "GB"){
        memory = (memory / 1024) * memory_cost * 24 * 30;
      } else {
        memory = memory * memory_cost * 24 * 30;
      }
      
      var realMemory = document.getElementById("real_memory_cost");
      var totalMemory = document.getElementById("total_value_memory");
      
      if (realMemory && totalMemory) {
        realMemory.value = memory;
        totalMemory.textContent = convertCostNumber(memory);
      }
      
      if (memory_cost != "") {
        $(".total_memory_cost", context).show();
      }
      _totalCost();
    }
  }

  function _calculatedRealCpu(context){
    if (Config.isFeatureEnabled("showback")){
      var cpu_cost = $("#CPU_COST").val() || 0;
      var cpu      = $("#CPU").val() || 0;
      var totalValueCpu = document.getElementById("real_cpu_cost");
      var totalCPU = document.getElementById("total_value_cpu");
      cpu = cpu * cpu_cost * 24 * 30;
      totalValueCpu.value = cpu;
      if(totalValueCpu){
        var convValue = convertCostNumber(cpu);
        totalCPU.textContent = convValue;
        totalValueCpu.textContent = convValue;
      }
      if (cpu_cost != ""){
        $(".total_cpu_cost", context).show();
      }
      _totalCost();
    } 
  }

  function _setup(context) {
    context.on("change", "#MEMORY", function() {
      _calculatedRealMemory(context);
    });

    context.on("change", "#MEMORY_GB", function() {
      _calculatedRealMemory(context);
    });

    context.on("change", "#memory_unit", function() {
      _calculatedRealMemory(context);
    });

    context.on("change", "#CPU", function() {
      _calculatedRealCpu(context);
    });

    context.on("change", "#VCPU", function(){
      if ($('#vcenterRadio').is(':checked')){
        CoresPerSocket.generateCores(VCPU_SELECTOR);
        CoresPerSocket.calculateSockets(VCPU_SELECTOR);
      }
      $("#selectedVCPU").val(this.value);
    });

    context.on("change", "#CORES_PER_SOCKET", function(){
      CoresPerSocket.calculateSockets(VCPU_SELECTOR);
    });
    // MB to GB
    context.on("input", "div.memory_input input", function(){
      $("div.memory_gb_input input", context).val(_m2g(this.value));
    });

    // MB to GB, max memory
    context.on("input", "div.memory_max_input input", function(){
      $("div.memory_max_gb_input input", context).val(_m2g(this.value));
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

    // GB to MB, max memory
    context.on("input", "div.memory_max_gb_input input", function(){
      $("div.memory_max_input input", context).val(_g2m(this.value));
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
    $("#memory_unit", context).on("change", function() {
      var memory_unit_val = $("#memory_unit :selected", context).val();

      if (memory_unit_val == "GB") {
        $(".mb_unit", context).hide();
        $(".gb_unit", context).show();
      } else {
        $(".mb_unit", context).show();
        $(".gb_unit", context).hide();
      }

      $(".memory_modify_unit", context).text(memory_unit_val);
    });

    $("#memory_unit", context).change();

    $("#MEMORY_HOT_ADD_ENABLED", context).on("change", function(){
      if (this.value == "NO"){
        $("#MEMORY_MAX", context).val("");
        $("#MEMORY_MAX_GB", context).val("");
        $("#memory_max_group", context).hide();
      }
      else{
        $("#memory_max_group", context).show();
      }
    });

    $("#CPU_HOT_ADD_ENABLED", context).on("change", function(){
      if (this.value == "NO"){
        $("#VCPU_MAX", context).val("");
        $("#vcpu_max_group", context).hide();
      }
      else{
        $("#vcpu_max_group", context).show();
      }
    });

    // Unit select
    $("#MEMORY_MAX_UNIT", context).on("change", function() {
      var memory_unit_val = $("#MEMORY_MAX_UNIT :selected", context).val();

      if (memory_unit_val == "GB") {
        $(".mb_max_unit", context).hide();
        $(".gb_max_unit", context).show();
      } else {
        $(".mb_max_unit", context).show();
        $(".gb_max_unit", context).hide();
      }

    });

    $("#MEMORY_MAX_UNIT", context).change();

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

    $("#MEMORY_RESIZE_MODE", context).on('change', function(){
      switch (this.value) {
        case 'BALLOONING':
          $("#MEMORY_SLOTS", context).val("")
          $("#memory_slots_div", context).hide()
          break;
        case 'HOTPLUG':
          $("#memory_slots_div", context).show()
          break;
        default:
          break;
      }
    })
  }

  /**
   * Fills the capacity inputs
   * @param  {Object} context  JQuery selector
   * @param  {Object} template VM or VMTemplate object
   */
  function _fill(context, element) {

    var fields = $("[wizard_field]", context);

    fields.each(function() {
      var field_name = $(this).attr("wizard_field");
      $(this).data("original_value", element[field_name]);
    });

    WizardFields.fill(context, element);

    if(element.TOPOLOGY && element.TOPOLOGY.CORES) {
      CoresPerSocket.selectOption(element.TOPOLOGY.CORES);
    }

    // Update memory_gb with the value set in memory
    $("div.memory_input input", context).trigger("input");

    if ($("div.memory_input input", context).val() && $("div.memory_input input", context).val() < 1024){
      $("#memory_unit", context).val("MB").change();
    } else {
      $("#memory_unit", context).val("GB").change();
    }

    // Update memory_max_gb with the value set in memory
    $("div.memory_max_input input", context).trigger("input");

    if ($("div.memory_max_input input", context).val() && $("div.memory_max_input input", context).val() < 1024){
      $("#memory_max_unit", context).val("MB").change();
    } else {
      $("#memory_max_unit", context).val("GB").change();
    }

    var userInputsJSON = element["USER_INPUTS"];

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
              console.error("Wrong user input parameters for \""+name+"\". Expected \"MIN..MAX\", received \""+attr.params+"\"");
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

      attr.initial = $("input[wizard_field=\""+attr.name+"\"]", context).val();

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
      templateJSON["USER_INPUTS"] = userInputsJSON;
    }

    return templateJSON;
  }
});
