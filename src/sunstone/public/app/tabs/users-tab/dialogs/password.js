define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./password/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var UserCreation = require('tabs/users-tab/utils/user-creation');

  /*
    CONSTANTS
   */
  
  var DIALOG_ID = require('./password/dialogId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    BaseDialog.call(this);
  }

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;

  return Dialog;
  
  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'dialogId': this.dialogId,
      'userCreationHTML': UserCreation.html()
    });
  }

  function _setup(context) {
    var that = this;

    UserCreation.setup(context, {name: false, auth_driver: false});

    context.off('invalid.fndtn.abide', '#' + DIALOG_ID + 'Form');
    context.off('valid.fndtn.abide', '#' + DIALOG_ID + 'Form');

    context.on('invalid.fndtn.abide', '#' + DIALOG_ID + 'Form', function(e) {
      // Fix for valid event firing twice
      if (e.namespace != 'abide.fndtn') { return; }

      Notifier.notifyError(Locale.tr("One or more required fields are missing or malformed."));
    }).on('valid.fndtn.abide', '#' + DIALOG_ID + 'Form', function(e) {
      // Fix for valid event firing twice
      if (e.namespace != 'abide.fndtn') { return; }

      var inputs = UserCreation.retrieve(context);

      var selElems = Sunstone.getDataTable(TAB_ID).elements();

      Sunstone.runAction('User.passwd', selElems, inputs.password);

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      Sunstone.runAction('User.refresh');

      return false;
    });

    context.foundation('reflow', 'abide');

    return false;
  }

  function _onShow(context) {

    return false;
  }
});
