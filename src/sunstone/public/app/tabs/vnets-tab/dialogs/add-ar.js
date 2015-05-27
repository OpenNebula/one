define(function(require) {
  /*
    DEPENDENCIES
   */

  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./add-ar/html');
  var ArTab = require('tabs/vnets-tab/utils/ar-tab');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./add-ar/dialogId');

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    this.arTab = new ArTab();

    BaseDialog.call(this);
  }

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;
  Dialog.prototype.setId = _setId;

  return Dialog;
  
  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'arTabHTML': this.arTab.html("add_ar")
    });
  }

  function _setup(context) {
    var that = this;

    that.arTab.setup(context, "add_ar");

    $('#submit_ar_reset_button', context).click(function(){
      Sunstone.getDialog(DIALOG_ID).reset();
      Sunstone.getDialog(DIALOG_ID).show();
    });

    $('#add_ar_form',context).on('invalid', function () {
        Notifier.notifyError(Locale.tr("One or more required fields are missing."));
    }).on('valid', function () {
        var data = that.arTab.retrieve();

        var obj = {AR: data};
        Sunstone.runAction('Network.add_ar', that.vnetId, obj);

        return false;
    });
  }

  function _onShow(context) {
    this.arTab.onShow();
    $('#vnet_id', this.dialogElement).text(this.vnetId);
  }

  function _setId(id) {
    this.vnetId = id;
  }
});
