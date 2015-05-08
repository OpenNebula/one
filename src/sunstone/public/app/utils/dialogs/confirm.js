define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./confirm/html');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  
  /*
    CONSTANTS
   */
  
  var DIALOG_ID = require('./confirm/dialogId');

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;
    BaseDialog.call(this);
  };

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
    return TemplateHTML({dialogId: this.dialogId});
  }

  function _setup(dialog) {
    // Submit action is configured in sunstone.js since it's an action_button
    return false;
  }

  function _onShow(dialog) {
    var actionId = dialog.data('buttonAction');
    var tabId = dialog.data('buttonTab');
    var button = Sunstone.getButton(tabId, actionId);

    var tip = Locale.tr("You have to confirm this action");
    if (button.tip) {
      tip = button.tip
    }

    $('#confirm_proceed', dialog).val(actionId);
    $('#confirm_tip', dialog).text(tip);

    var action = Sunstone.getAction(actionId);
    var elements = action.elements();
    if (elements) {
      var str = actionId.split('.');
      $(".confirm_action", dialog).html(str[1] + ' ' + str[0] + ': ' + elements.join(', '))
    }

    return false;
  }
});
