define(function(require) {
  var Handlebars = require('hbs/handlebars');
  var Config = require('sunstone-config');
  
  var isTabActionEnabled = function(tabName, action, options) {
    if (Config.isTabActionEnabled(tabName, action)) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  };

  Handlebars.registerHelper('isTabActionEnabled', isTabActionEnabled);

  return isTabActionEnabled;
})
