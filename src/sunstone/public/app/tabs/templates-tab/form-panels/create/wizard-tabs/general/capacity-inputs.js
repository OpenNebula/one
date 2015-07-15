define(function(require) {
  /*
    DEPENDENCIES
   */

  require('foundation.slider');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./capacity-inputs/html');

  /*
    CONSTRUCTOR
   */

  return {
    'html': _html,
    'setup': _setup
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

    //cpu_slider.attr('data-options', 'start: 0; end: 1600; step: 50;');

    cpu_slider.on('change.fndtn.slider', function(){
      cpu_input.val($(this).attr('data-slider') / 100);
    });

    cpu_input.on('change', function() {
      cpu_slider.foundation('slider', 'set_value', this.value * 100);
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
      $("#memory_slider", context).foundation('slider', 'set_value', this.value * 100);
      update_final_memory_input();
    });

    final_memory_input.on('change', function() {
      $("#memory_slider", context).foundation('slider', 'set_value', this.value * 100);
      memory_input.val(Math.floor(this.value));
    });

    $("#memory_slider", context).on('change.fndtn.slider', function() {
      memory_input.val($(this).attr('data-slider') / 100);
      update_final_memory_input();
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

        context.foundation('slider', 'reflow');
        memory_input.val(new_val);
        $("#memory_slider", context).foundation('slider', 'set_value', new_val * 100);
        $("#memory_slider", context).on('change.fndtn.slider', function() {
          memory_input.val($(this).attr('data-slider') / 100);
          update_final_memory_input();
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
      vcpu_input.val($(this).attr('data-slider') / 100);
    });

    vcpu_input.on('change', function() {
      vcpu_slider.foundation('slider', 'set_value', this.value * 100);
    });

    vcpu_slider.foundation('slider', 'set_value', 0);
  }
});
