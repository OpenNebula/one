define(function(require) {
  var Locale = require('utils/locale');

  var Buttons = {
    "Vdc.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
    "Vdc.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "Vdc.update_dialog" : {
        type: "action",
        layout: "main",
        text: Locale.tr("Update")
    },
    "Vdc.delete" : {
        type: "confirm",
        layout: "del",
        text: Locale.tr("Delete")
    }
  };

  return Buttons;
});
