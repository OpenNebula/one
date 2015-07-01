define(function(require) {
  /*
    DEPENDENCIES
   */

  require('nouislider');
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
    Tips.setup(context);

    // Define the cpu slider

    var cpu_input = $("#CPU", context);

    var cpu_slider = $("#cpu_slider", context).noUiSlider({
      handles: 1,
      connect: "lower",
      range: [0, 1600],
      //            start: 100,
      step: 50,
      start: 1,
      slide: function(type) {
        if (type != "move") {
          var values = $(this).val();

          cpu_input.val(values / 100);
        }
      },
    });

    cpu_slider.addClass("noUiSlider");

    cpu_input.change(function() {
      cpu_slider.val(this.value * 100)
    });

    cpu_input.val(1);

    // init::start is ignored for some reason
    cpu_slider.val(100);

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

    var memory_slider_change = function(type) {
      if (type != "move") {
        var values = $(this).val();

        memory_input.val(values / 100);

        update_final_memory_input();
      }
    };

    var memory_slider = $("#memory_slider", context).noUiSlider({
      handles: 1,
      connect: "lower",
      range: [0, 409600],
      step: 12800,
      start: 51200,
      value: 512,
      slide: memory_slider_change,
    });

    memory_slider.addClass("noUiSlider");

    memory_input.change(function() {
      memory_slider.val(this.value * 100)

      update_final_memory_input();
    });

    final_memory_input.change(function() {
          memory_slider.val(this.value * 100);
          memory_input.val(Math.floor(final_memory_input.val()));
        })

    memory_unit.change(function() {
      var memory_unit_val = $('#memory_unit :selected', context).val();

      if (current_memory_unit != memory_unit_val) {
        current_memory_unit = memory_unit_val

        if (memory_unit_val == 'GB') {

          memory_slider.empty().noUiSlider({
            handles: 1,
            connect: "lower",
            range: [0, 1600],
            start: 1,
            step: 50,
            value: 51200,
            slide: memory_slider_change,
          });

          var new_val = memory_input.val() / 1024;

          memory_input.val(new_val);
          memory_slider.val(new_val * 100);
        } else if (memory_unit_val == 'MB') {

          memory_slider.empty().noUiSlider({
            handles: 1,
            connect: "lower",
            range: [0, 409600],
            start: 1,
            value: 51200,
            step: 12800,
            slide: memory_slider_change,
          });

          var new_val = Math.floor(memory_input.val() * 1024);

          memory_input.val(new_val);
          memory_slider.val(new_val * 100);
        }

        update_final_memory_input();
      }
    });

    // init::start is ignored for some reason
    memory_input.val(512).change();

    // Define the vcpu slider

    var vcpu_input = $("#VCPU", context);

    var vcpu_slider = $("#vcpu_slider", context).noUiSlider({
      handles: 1,
      connect: "lower",
      range: [1, 16],
      start: 1,
      step: 1,
      slide: function(type) {
        if (type != "move") {
          var values = $(this).val();

          vcpu_input.val(values);
        }
      },
    });

    vcpu_slider.addClass("noUiSlider");

    vcpu_input.change(function() {
      vcpu_slider.val(this.value)
    });

    // init::start is ignored for some reason
    vcpu_slider.val(0);
  }
});
