define(function(require) {
  var Locale = require('utils/locale');

  var Buttons = {
    "Support.refresh" : {
      type: "action",
      layout: "refresh",
      text: '<i class="fa fa-refresh fa fa-lg">',
      alwaysActive: true
    },
    "Support.upload" : {
      type: "action",
      layout: "main",
      text: '<i class="fa fa-cloud-upload" style="color: rgb(111, 111, 111)"/> '+Locale.tr("Upload a file"),
      custom_classes: "only-right-info"
    },
    "Support.signout" : {
      type: "action",
      layout: "main",
      text: '<i class="fa fa-sign-out fa fa-lg">',
      tip: "Sign out of Commercial Support",
      alwaysActive: true
    },
    "Support.create_dialog" : {
      type: "create_dialog",
      layout: "create",
      text: "Submit a Request"
    }
  };

  return Buttons;
});