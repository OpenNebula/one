define(function(require) {
  var Locale = require('utils/locale');

  var Buttons = {
    "Cluster.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
    "Cluster.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "Cluster.update_dialog" : {
        type : "action",
        layout: "main",
        text : Locale.tr("Update")
    },
    "Cluster.delete" : {
        type: "confirm",
        layout: "del",
        text: Locale.tr("Delete")
    }
  };

  return Buttons;
});
