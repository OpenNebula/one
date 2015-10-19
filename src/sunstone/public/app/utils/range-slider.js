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

  return {
    'insert': _insert
  }

  /*
    Insert a range slider
    @param {Object} opts Options for the slider
      opts.label Label for the input
      opts.tip String with the despription
      opts.name Name of the input, it will be used for the wizard_field value
        and the ID of the input
      opts.start Start value of the slider
      opts.end End value of the slider
      opts.step Step value of the slider
      opts.startValue Initialize the slider with this value
      opts.enabled false to disable the inputs (true by default)
    @param {Object} context div to insert the range slider
    @returns {String} HTML row
   */
  function _insert(opts, context) {
    context.html(TemplateHTML(opts));
    context.foundation('slider', 'reflow');
    
    // Define the cpu slider
    var input = $("#" + opts.name, context);
    var slider = $("#" + opts.name + "Slider", context)

    slider.on('change.fndtn.slider', function(){
      if ($(this).attr('data-slider') >= 0) {
        input.val($(this).attr('data-slider'));
      }
    });

    input.on('change', function() {
      if (this.value && this.value >= 0) {
        slider.foundation('slider', 'set_value', this.value);
      } else {
        slider.foundation('slider', 'set_value', -1);
      }
    });

    if (opts.startValue) {
      slider.foundation('slider', 'set_value', opts.startValue);
      input.val(opts.startValue);
    }

    if (opts.enabled == false){
      input.attr('disabled', 'disabled');
      slider.attr('disabled', 'disabled');
    }
  }
});
