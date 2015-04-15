define(function(require) {
  var Handlebars = require('hbs/handlebars');
  var Locale = require('utils/locale');

  var tr = function(context, options) {
    return Locale.tr(context);
  };

  Handlebars.registerHelper('tr', tr);
  return tr;
})
