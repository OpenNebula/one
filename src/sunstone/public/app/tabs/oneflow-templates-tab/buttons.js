define(function(require) {
  var Locale = require('utils/locale');

  var Buttons = {
    "ServiceTemplate.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "ServiceTemplate.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "ServiceTemplate.instantiate_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Instantiate")
    },
    "ServiceTemplate.update_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Update")
    },
    "ServiceTemplate.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      select: "User",
      layout: "user_select",
      tip: Locale.tr("Select the new owner")+":"
    },
    "ServiceTemplate.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      select: "Group",
      layout: "user_select",
      tip: Locale.tr("Select the new group")+":"
    },
    "ServiceTemplate.delete" : {
      type: "confirm",
      text: Locale.tr("Delete"),
      layout: "del",
      tip: Locale.tr("This will delete the selected templates")
    }
  };

  return Buttons;
});