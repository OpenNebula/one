/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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
  var Config = require('sunstone-config');
  var Notifier = require("utils/notifier");

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
    if (Config.isFeatureEnabled("instantiate_hide_cpu")){
      $(".cpu_input_wrapper", context).hide();
    }

    Tips.setup(context);
  }

  function _calculateSockets(context){
    var vcpu = $("div.vcpu_input input, div.vcpu_input select", context).val();
    var cores_per_socket = $("#CORES_PER_SOCKET").val();

    if ((vcpu != "") && (cores_per_socket != "")){
      $("div.socket_info").show();
      $("#number_sockets").text(parseInt(vcpu, 10)/parseInt(cores_per_socket, 10));
    }
    else{
      $("div.socket_info").hide();
    }
  }

  function _generateCores(context){
    $("#CORES_PER_SOCKET", context).find('option').remove();
    $("#CORES_PER_SOCKET", context).append($('<option>').val("").text(""));
    var visor = $("div.vcpu_input input.visor")
    var slider = $("div.vcpu_input input");
    var select = $("div.vcpu_input select");
    var from = visor.length? visor : slider.length ? slider : select;
    var vcpuValue = from.val();
    for (var i = 1; i <= vcpuValue; i++){
      if (vcpuValue%i === 0){
        $("#CORES_PER_SOCKET", context).append($('<option>').val(i).text((i).toString()));
      }
    }
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
      attr = UserInputs.parse("CPU", "O|number-float|||");
    }

    if (element.TEMPLATE.CPU != undefined){
      attr.initial = element.TEMPLATE.CPU;
    } else {
      attr.mandatory = true;
    }

    attr.step = 0.01;

    if(attr.min == undefined){
      attr.min = 0.01;
    }

    input = UserInputs.attributeInput(attr);

    if (attr.type != "range-float"){
      $("div.cpu_input_wrapper", context).addClass("small-12");
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

    if(attr.min == undefined){
      attr.min = 1;
    }

    input = UserInputs.attributeInput(attr);

    if (attr.type != "range"){
      $("div.vcpu_input_wrapper", context).addClass("small-12");
    }

    $("div.vcpu_input", context).html(input);

    var cpuInput = $("div.cpu_input input, div.cpu_input select", context);
    var vcpuInput = $("div.vcpu_input input, div.vcpu_input select", context);
    vcpuInput.off();

    if (Config.isFeatureEnabled("instantiate_cpu_factor")){
      vcpuInput.on("change keyup", function() {
        var vcpuValue = $(this).val();
        if (vcpuValue !== "") {
          var scaleFactorValue = vcpuValue * Config.scaleFactor
          var minCpuValue = $("div.cpu_input input.visor", context).attr("min");
          var maxCpuValue = $("div.cpu_input input.visor", context).attr("max");

          if (scaleFactorValue <= minCpuValue) {
            cpuInput.val(minCpuValue);
          }
          else if (scaleFactorValue >= maxCpuValue) {
            cpuInput.val(maxCpuValue);
          }
          else {
            if (cpuInput.is("select")) {
              if ($("option[value='"+ scaleFactorValue +"']", cpuInput).length !== 0) {
                cpuInput.val(scaleFactorValue);
              }
            }
            else cpuInput.val(scaleFactorValue);
          }
        } else {
          cpuInput.val("");
        }
      });
      
      cpuInput.prop("disabled", true);
      var vcpuValue = vcpuInput.val();
      if (vcpuValue && vcpuValue !== "") {
        vcpuInput.trigger("change")
      } 
    }

    if (element.TEMPLATE.HYPERVISOR == "vcenter"){
      $("div.cores_per_socket_select_wrapper").show();
      $("div.socket_info").show();
      
      var vcpuValue = $("div.vcpu_input input", context).val();
      if (vcpuValue !== "") {
        _generateCores(context);
        if(element.TEMPLATE.TOPOLOGY) {
          $('#CORES_PER_SOCKET').val(element.TEMPLATE.TOPOLOGY.CORES).change()
        }
      }

      vcpuInput.on("change keyup", function(e){
        element = $("div.vcpu_input input.visor", context);
        if (element.length) {
          min = element.attr("min");
          max = element.attr("max");
          if(parseInt(element.val(),10) >= parseInt(min,10) && parseInt(element.val(),10)<= parseInt(max,10)){
            $("div.vcpu_input input", context).val(element.val());
            _generateCores(context);
            $('#CORES_PER_SOCKET option[value=""]').prop('selected', true);
            _calculateSockets(context);
          } else{
            element.val(max);
            $("div.vcpu_input input", context).val(max).change();
            Notifier.notifyError(Locale.tr("The value goes out of the allowed limits"));
          }
        } else{
          _generateCores(context);
          $('#CORES_PER_SOCKET option[value=""]').prop('selected', true);
          _calculateSockets(context);
        }
        
      });

      $("#CORES_PER_SOCKET", context).on("change", function(){
        _calculateSockets(context);
      })

      _calculateSockets(context);
    }
    else{
      $("div.cores_per_socket_select_wrapper").hide();
      $("div.socket_info").hide();
    }


    if (userInputs != undefined && userInputs.MEMORY != undefined){
      attr = UserInputs.parse("MEMORY", userInputs.MEMORY);
    } else {
      attr = UserInputs.parse("MEMORY", "O|number|||");
    }

    if (element.TEMPLATE.MEMORY != undefined){
      attr.initial = element.TEMPLATE.MEMORY;
    } else {
      attr.mandatory = true;
    }

    if(attr.min == undefined){
      attr.min = 1;
    }

    if (attr.type != "range"){
      $("div.memory_input_wrapper", context).addClass("large-6").addClass("medium-8");
    }
    
    attr.visor = attr.type === "number";
    UserInputs.insertAttributeInputMB(attr, $("div.memory_input", context), true, attr.type === "number");

    if (Config.isFeatureEnabled("instantiate_hide_cpu")){
      $(".vcpu_input input", context).prop("required", true);
    }
  }

  /**
   * Sets a callback that will be called when the input values change
   * @param {Object}   context  jQuery selector
   * @param {Function} callback will be called as callback( retrieve(context) )
   */
  function _setCallback(context, callback) {
    context.on("change", function(){
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
    var values = WizardFields.retrieve(context);

    return values;
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
