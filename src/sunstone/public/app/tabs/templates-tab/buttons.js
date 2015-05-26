define(function(require) {
  var Locale = require('utils/locale');

  var Buttons = {
    "Template.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Template.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "Template.import_dialog" : {
      type: "create_dialog",
      layout: "create",
      text:  Locale.tr("Import"),
      icon: '<i class="fa fa-download">',
      alwaysActive: true
    },
    "Template.update_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Update")
    },
    "Template.instantiate_vms" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Instantiate")
    },
    "Template.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      layout: "user_select",
      select: "User",
      tip: Locale.tr("Select the new owner") + ":",
    },
    "Template.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      layout: "user_select",
      select: "Group",
      tip: Locale.tr("Select the new group") + ":",
    },
    "Template.clone_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Clone")
    },
    "Template.delete" : {
      type: "confirm",
      layout: "del"
    }
  }

  return Buttons;
})
