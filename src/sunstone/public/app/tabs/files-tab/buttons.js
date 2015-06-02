define(function(require) {
  var Locale = require('utils/locale');

  var Buttons = {
    "File.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "File.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "File.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      layout: "user_select",
      select: "User",
      tip: Locale.tr("Select the new owner") + ":"
    },
    "File.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      layout: "user_select",
      select: "Group",
      tip: Locale.tr("Select the new group") + ":"
    },
    "File.enable" : {
      type: "action",
      layout: "more_select",
      text: Locale.tr("Enable")
    },
    "File.disable" : {
      type: "action",
      layout: "more_select",
      text: Locale.tr("Disable")
    },
    "File.delete" : {
      type: "confirm",
      layout: "del",
      text: Locale.tr("Delete")
    },
  };

  return Buttons;
});
