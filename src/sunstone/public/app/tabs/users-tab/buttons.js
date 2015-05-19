define(function(require) {
  var Locale = require('utils/locale');

  var Buttons = {
    "User.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "User.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "User.update_password" : {
      type : "action",
      layout: "main_buttons",
      text : Locale.tr("Password")
    },
    "User.change_authentication" : {
      type : "action",
      layout: "main_buttons",
      text : Locale.tr("Auth")
    },
    "User.quotas_dialog" : {
      type : "action",
      layout: "main_buttons",
      text : Locale.tr("Quotas")
    },
    "User.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      layout: "user_select",
      select: "Group",
      tip: Locale.tr("This will change the main group of the selected users. Select the new group")+":"
    },
    "User.addgroup" : {
      type: "confirm_with_select",
      text: Locale.tr("Add to group"),
      layout: "user_select",
      select: "Group",
      tip: Locale.tr("This will add the user to a secondary group. Select the new group")+":"
    },
    "User.delgroup" : {
      type: "confirm_with_select",
      text: Locale.tr("Remove from group"),
      layout: "user_select",
      select: "Group",
      tip: Locale.tr("This will remove the user from a secondary group. Select the group")+":"
    },
    "User.delete" : {
      type: "confirm",
      text: Locale.tr("Delete"),
      layout: "del"
    }
  };

  return Buttons;
});
