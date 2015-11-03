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
    'retrieveResize': _retrieveResize
  };

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML();
  }

  function _setup(context) {
    // Define the cpu slider
    var cpu_input = $("#CPU", context);
    var cpu_slider = $("#cpu_slider", context)

    context.foundation('slider', 'reflow');

    //cpu_slider.attr('data-options', 'start: 0; end: 1600; step: 50;');

    cpu_slider.on('change.fndtn.slider', function(){
      if ($(this).attr('data-slider') >= 0) {
        cpu_input.val($(this).attr('data-slider') / 100);
      }
    });

    cpu_input.on('change', function() {
      if (this.value && this.value >= 0) {
        cpu_slider.foundation('slider', 'set_value', this.value * 100);
      } else {
        cpu_slider.foundation('slider', 'set_value', -1);
      }
    });

    cpu_slider.foundation('slider', 'set_value', 100);

    // Define the memory slider

    var final_memory_input = $("#MEMORY", context);
    var memory_input = $("#MEMORY_TMP", context);
    var memory_unit  = $("#memory_unit", context);

    var current_memory_unit = memory_unit.val();

    var update_final_memory_input = function() {
      if (current_memory_unit == 'MB') {
        final_memory_input.val(Math.floor(memory_input.val()));
      } else {
        final_memory_input.val(Math.floor(memory_input.val() * 1024));
      }
    }

    memory_input.on('change', function() {
      if (this.value && this.value >= 0) {
        $("#memory_slider", context).foundation('slider', 'set_value', this.value * 100);
        update_final_memory_input();
      } else {
        $("#memory_slider", context).foundation('slider', 'set_value', -1);
        final_memory_input.val("");
      }
    });

    final_memory_input.on('change', function() {
      if (this.value && this.value >= 0) {
        $("#memory_slider", context).foundation('slider', 'set_value', this.value * 100);
        memory_input.val(Math.floor(this.value));
      } else {
        $("#memory_slider", context).foundation('slider', 'set_value', -1);
        memory_input.val("");
      }
    });

    $("#memory_slider", context).on('change.fndtn.slider', function() {
      if ($(this).attr('data-slider') >= 0) {
        memory_input.val($(this).attr('data-slider') / 100);
        update_final_memory_input();
      }
    });

    memory_unit.on('change', function() {
      var memory_unit_val = $('#memory_unit :selected', context).val();

      if (current_memory_unit != memory_unit_val) {
        current_memory_unit = memory_unit_val
        var new_val;
        if (memory_unit_val == 'GB') {
          $("#memory_slider", context).detach();
          $(".memory_slider_container", context).html(
            '<div id="memory_slider" class="range-slider radius" data-slider data-options="start: 0; end: 1600; step: 50;">'+
              '<span class="range-slider-handle"></span>'+
              '<span class="range-slider-active-segment"></span>'+
              '<input type="hidden">'+
            '</div>');

          new_val = memory_input.val() / 1024;
        } else if (memory_unit_val == 'MB') {
          $("#memory_slider", context).detach();
          $(".memory_slider_container", context).html(
            '<div id="memory_slider" class="range-slider radius" data-slider data-options="start: 0; end: 409600; step: 12800;">'+
              '<span class="range-slider-handle"></span>'+
              '<span class="range-slider-active-segment"></span>'+
              '<input type="hidden">'+
            '</div>');

          new_val = Math.floor(memory_input.val() * 1024);
        }

        $("#memory_slider", context).foundation('slider', 'reflow');
        memory_input.val(new_val);
        $("#memory_slider", context).foundation('slider', 'set_value', new_val * 100);
        $("#memory_slider", context).on('change.fndtn.slider', function() {
          if ($(this).attr('data-slider') >= 0) {
            memory_input.val($(this).attr('data-slider') / 100);
            update_final_memory_input();
          }
        });

        update_final_memory_input();
      }
    });

    // init::start is ignored for some reason
    $("#memory_slider", context).foundation('slider', 'set_value', 51200);

    // Define the vcpu slider

    var vcpu_input = $("#VCPU", context);
    var vcpu_slider = $("#vcpu_slider", context)

    //vcpu_slider.attr('data-options', 'start: 0; end: 1600; step: 50;');
    vcpu_slider.on('change.fndtn.slider', function(){
      if ($(this).attr('data-slider') > 0) {
        vcpu_input.val($(this).attr('data-slider') / 100);
      }
    });

    vcpu_input.on('change', function() {
      if (this.value && this.value > 0) {
        vcpu_slider.foundation('slider', 'set_value', this.value * 100);
      } else {
        vcpu_slider.foundation('slider', 'set_value', -1);
      }
    });

    vcpu_slider.foundation('slider', 'set_value', 0);
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
  }

  /**
   * Sets a callback that will be called when the input values change
   * @param {Object}   context  jQuery selector
   * @param {Function} callback will be called as callback( retrieve(context) )
   */
  function _setCallback(context, callback) {
    context.on("change.fndtn.slider", function(){
      callback( _retrieve(context) );
    });
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
  function _retrieveResize(context) {
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
