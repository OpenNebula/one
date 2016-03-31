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
    if (opts.tick_size !== undefined){
      var tick_val = opts.tick_size * Math.ceil(opts.min / opts.tick_size);
      while (tick_val <= opts.max){
        opts['ticks'].push(tick_val);
        tick_val += opts.tick_size;
      }
    }

    sliderId += 1;
    return TemplateHTML(opts);
  }

  function _initialSetup() {
    $(document).off("input", "input.uinput-slider-val");
    $(document).on("input", "input.uinput-slider-val", function(){
      $("input[type=range]", $(this).closest('.uinput-slider-container')).val( this.value );
    });

    $(document).off("input", "input.uinput-slider");
    $(document).on("input", "input.uinput-slider", function(){
      $("input[type=number]", $(this).closest('.uinput-slider-container')).val( this.value );
    });
  }
});
