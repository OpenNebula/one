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
  require("jquery");
  var TemplateHTML = require('hbs!./range-slider/html');

  var sliderId = 0;
  _initialSetup();

  return {
    'insert': _insert,
    'html': _html
  }

  /*
    Insert a range slider
    @param {Object} opts Options for the slider
      opts.label Label for the input
      opts.name Name of the input, it will be used for the wizard_field value
        and the ID of the input
      opts.min Start value of the slider
      opts.max End value of the slider
      opts.step Step value of the slider
      opts.initial Initialize the slider with this value
      opts.enabled false to disable the inputs (true by default)
    @param {Object} context div to insert the range slider
    @returns {String} HTML row
   */
  function _insert(opts, context) {
    context.html(_html(opts));
  }

  function _html(opts) {
    opts['sliderId'] = sliderId;
    opts['ticks'] = [];
    if (opts.tick_size !== undefined && !opts.no_ticks){
      var tick_val = opts.tick_size * Math.ceil(opts.min / opts.tick_size);
      while (tick_val <= opts.max){
        opts['ticks'].push(tick_val);
        tick_val += opts.tick_size;
      }
      if(
        opts && 
        opts.min && 
        opts.tick_size &&
        parseInt(opts.min,10) && 
        parseInt(opts.min, 10) < parseInt(opts.tick_size)
      ){
        opts['ticks'].unshift(opts.min)
      }
    }
    sliderId += 1;
    return TemplateHTML(opts);
  }

  function _initialSetup() {
    $(document).off("input", "input.uinput-slider-val");
    $(document).on("input", "input.uinput-slider-val", function(){
      var max = $("input[type=number]", $(this).closest('.uinput-slider-container')).attr('max');
      $("input[type=range]", $(this).closest('.uinput-slider-container')).val( this.value );
      if(parseInt(this.value) > parseInt(max))
        $("input[type=number]", $(this).closest('.uinput-slider-container')).val(max);
    });
    $(document).off("input", "input.uinput-slider");
    $(document).on("input", "input.uinput-slider", function(){
      //change selector to MB
      var base = 1024;
      var baseCal = 1;
      var unit = "MB";
      var valueInMB = 0;
      // Fill in the input with your unit the first time
      var value = $(this).val();
      var valueInUnit = value;
      var min = parseInt($(this).attr("min"),10);

      if(value / (base*base) >= 1){
        baseCal = base*base;
        unit = "TB";
      }else if(value / base >= 1){
        baseCal = base;
        unit = "GB";
      }
      if (value >= 0) {
        valueInMB = value;
        if(!isNaN(min) && parseInt(min, 10) > valueInMB ){
          valueInMB = min;
        }
        $("input, select", $(this).closest('.uinput-slider-container')).val(valueInMB);
        $(".uinput-slider-val", $(this).closest('.uinput-slider-container')).trigger("change");
        valueInUnit = valueInMB / baseCal;
      }
      $("input.visor", $(this).closest('.uinput-slider-container')).val(valueInUnit);
      $(".mb_input_unit", $(this).closest('.mb_input_wrapper')).val(unit).trigger("change");
    });
  }
});
