define(function(require) {
  var Locale = require('utils/locale');

  var Buttons = {
    "Acl.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "Acl.create_dialog" : {
      type: "create_dialog",
      layout: "create"
    },
    "Acl.delete" : {
      type: "confirm",
      text: Locale.tr("Delete"),
      layout: "del"
    },
  };

  return Buttons;
});
