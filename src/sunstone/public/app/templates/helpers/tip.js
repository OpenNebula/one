define(function(require) {
  var Handlebars = require('hbs/handlebars');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');

  var tip = function(context, options) {
    return Tips.html(context);
  };

  Handlebars.registerHelper('tip', tip);
  return tip;
})
