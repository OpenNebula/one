define(function(require) {
  var Handlebars = require('hbs/handlebars');

  var id = 0;

  var advancedSection = function(title, options) {
    id += 1;

    var html_id = "advanced_section_" + id;

    return new Handlebars.SafeString(
      '<div class="accordion_advanced">'+
        '<a href="#'+html_id+'">'+
            '<i class="fa fa-fw fa-chevron-down"/>'+
            '<i class="fa fa-fw fa-chevron-up"/>'+
            title+
        '</a>'+
        '<div id="'+html_id+'" class="content hidden">'+
          options.fn(this) +
        '</div>'+
      '</div>'
    );
  };

  Handlebars.registerHelper('advancedSection', advancedSection);

  return advancedSection;
});