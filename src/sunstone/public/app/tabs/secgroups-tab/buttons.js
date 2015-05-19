define(function(require) {
  var Locale = require('utils/locale');

  var Buttons = {
    "SecurityGroup.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "SecurityGroup.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "SecurityGroup.update_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Update")
    },
    "SecurityGroup.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      layout: "user_select",
      select: "User",
      tip: Locale.tr("Select the new owner")+":"
    },
    "SecurityGroup.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      layout: "user_select",
      select: "Group",
      tip: Locale.tr("Select the new group")+":"
    },
    "SecurityGroup.clone_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Clone")
    },
    "SecurityGroup.delete" : {
      type: "confirm",
      layout: "del",
      text: Locale.tr("Delete")
    }
  };

  return Buttons;
})
