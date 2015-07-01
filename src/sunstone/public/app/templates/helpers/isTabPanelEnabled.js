define(function(require) {
  var Handlebars = require('hbs/handlebars');
  var Config = require('sunstone-config');

  var isTabPanelEnabled = function(tabName, panel, options) {
    if (Config.isTabPanelEnabled(tabName, panel)) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  };

  Handlebars.registerHelper('isTabPanelEnabled', isTabPanelEnabled);

  return isTabPanelEnabled;
})