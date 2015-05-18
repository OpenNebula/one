define(function(require) {
  var Locale = require('utils/locale');

  var VNetButtons = {
    "Network.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Network.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "Network.import_dialog" : {
      type: "create_dialog",
      layout: "create",
      text:  Locale.tr("Import"),
      icon: '<i class="fa fa-download">',
      alwaysActive: true
    },
    "Network.update_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Update")
    },
    "Network.reserve_dialog" : {
      type: "action",
      layout: "main",
      text: Locale.tr("Reserve"),
      custom_classes: "only-right-info reserve-right-info",
    },
    "Network.addtocluster" : {
      type: "confirm_with_select",
      text: Locale.tr("Select cluster"),
      layout: "main",
      select: "Cluster",
      tip: Locale.tr("Select the destination cluster:")
    },
    "Network.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      layout: "user_select",
      select: "User",
      tip: Locale.tr("Select the new owner")+":"
    },

    "Network.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      layout: "user_select",
      select: "Group",
      tip: Locale.tr("Select the new group")+":"
    },

    "Network.delete" : {
      type: "confirm",
      layout: "del",
      text: Locale.tr("Delete")
    }
  };

  return VNetButtons;
})
