define(function(require) {
  var Locale = require('utils/locale');

  var Buttons = {
    "Image.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Image.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "Image.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      layout: "user_select",
      select: "User",
      tip: Locale.tr("Select the new owner") + ":"
    },
    "Image.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      layout: "user_select",
      select: "Group",
      tip: Locale.tr("Select the new group") + ":"
    },
    "Image.enable" : {
      type: "action",
      layout: "more_select",
      text: Locale.tr("Enable")
    },
    "Image.disable" : {
      type: "action",
      layout: "more_select",
      text: Locale.tr("Disable")
    },
    "Image.persistent" : {
      type: "action",
      layout: "more_select",
      text: Locale.tr("Make persistent")
    },
    "Image.nonpersistent" : {
      type: "action",
      layout: "more_select",
      text: Locale.tr("Make non persistent")
    },
    "Image.clone_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Clone")
    },
    "Image.delete" : {
      type: "confirm",
      layout: "del",
      text: Locale.tr("Delete")
    },
  }

  return Buttons;
});
