define(function(require) {
  var Handlebars = require('hbs/handlebars');
  var Config = require('sunstone-config');
  
  var isFeatureEnabled = function(feature, options) {
    if (Config.isFeatureEnabled(feature)) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  };

  Handlebars.registerHelper('isFeatureEnabled', isFeatureEnabled);

  return isFeatureEnabled;
})
