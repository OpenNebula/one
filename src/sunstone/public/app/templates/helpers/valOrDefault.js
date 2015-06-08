define(function(require) {
  var Handlebars = require('hbs/handlebars');
  var Locale = require('utils/locale');

  var valOrDefault = function(value, defaultValue, options) {
    var out = value || defaultValue;
    return new Handlebars.SafeString(out);
  };

  Handlebars.registerHelper('valOrDefault', valOrDefault);
  return valOrDefault;
})
