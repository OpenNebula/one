define(function(require) {
  var Locale = require('utils/locale');

  var Buttons = {
    "Group.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Group.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "Group.update_dialog" : {
      type : "action",
      layout: "main",
      text : Locale.tr("Update")
    },
    "Group.quotas_dialog" : {
      type : "action",
      text : Locale.tr("Quotas"),
      layout: "main"
    },
    "Group.delete" : {
      type: "confirm",
      text: Locale.tr("Delete"),
      layout: "del"
    }
  };

  return Buttons;
});
