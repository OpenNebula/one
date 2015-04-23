define(function(require) {
  var Locale = require('utils/locale');

  var DatastoreButtons = {
    "Datastore.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Datastore.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "Datastore.addtocluster" : {
      type: "confirm_with_select",
      text: Locale.tr("Select cluster"),
      select: "Cluster",
      layout: "main",
      tip: Locale.tr("Select the destination cluster:")
    },
    "Datastore.chown" : {
      type: "confirm_with_select",
      text: Locale.tr("Change owner"),
      select: "User",
      layout: "user_select",
      tip: Locale.tr("Select the new owner") + ":"
    },
    "Datastore.chgrp" : {
      type: "confirm_with_select",
      text: Locale.tr("Change group"),
      select: "Group",
      layout: "user_select",
      tip: Locale.tr("Select the new group") + ":"
    },
    "Datastore.delete" : {
      type: "confirm",
      text: Locale.tr("Delete"),
      layout: "del"
    },
    "Datastore.enable" : {
      type: "action",
      layout: "more_select",
      text: Locale.tr("Enable")
    },
    "Datastore.disable" : {
      type: "action",
      layout: "more_select",
      text: Locale.tr("Disable")
    }
  };

  return DatastoreButtons;
})
