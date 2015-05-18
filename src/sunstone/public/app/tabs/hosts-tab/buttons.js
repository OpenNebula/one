define(function(require) {
  var Locale = require('utils/locale');

  var Buttons = {
    "Host.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Host.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "Host.addtocluster" : {
      type: "confirm_with_select",
      text: Locale.tr("Select cluster"),
      select: "Cluster",
      tip: Locale.tr("Select the destination cluster:"),
      layout: "main"
    },
    "Host.enable" : {
      type: "action",
      text: Locale.tr("Enable"),
      layout: "main"
    },
    "Host.disable" : {
      type: "action",
      text: Locale.tr("Disable"),
      layout: "main"
    },
    "Host.delete" : {
      type: "confirm",
      text: Locale.tr("Delete host"),
      layout: "del"
    }
  };

  return Buttons;
})
