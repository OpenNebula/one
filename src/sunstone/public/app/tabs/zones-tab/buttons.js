define(function(require) {
  var Locale = require('utils/locale');

  var zoneButtons = {
    "Zone.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Zone.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "Zone.delete" : {
      type: "confirm",
      layout: "del",
      text: Locale.tr("Delete")
    }
  };

  return zoneButtons;
})
