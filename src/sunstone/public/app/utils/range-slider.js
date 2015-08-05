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
  }
});
