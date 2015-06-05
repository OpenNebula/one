define(function(require) {
  var Locale = require('utils/locale');

  var Buttons = {
    "Marketplace.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Marketplace.import" : {
      type: "action",
      layout: "main",
      text: Locale.tr('Import')
    }
  };

  return Buttons;
});