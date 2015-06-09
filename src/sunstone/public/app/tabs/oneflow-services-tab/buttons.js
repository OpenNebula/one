define(function(require) {
  var Locale = require('utils/locale');

  var Buttons = {
    "Service.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Service.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      select: "User",
      tip: Locale.tr("Select the new owner")+":",
      layout: "user_select"
    },
    "Service.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      select: "Group",
      tip: Locale.tr("Select the new group")+":",
      layout: "user_select"
    },
    "Service.shutdown" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Shutdown")
    },
    "Service.recover" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Recover")
    },
    "Service.delete" : {
      type: "confirm",
      text: Locale.tr("Delete"),
      layout: "del",
      tip: Locale.tr("This will delete the selected services")
    }
  };

  return Buttons;
});