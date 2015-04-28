define(function(require) {
  var TemplateHTML = require('hbs!./confirm/html');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var DIALOG_ID = require('./confirm/dialogId');

  var _html = function() {
    return TemplateHTML({dialogId: DIALOG_ID});
  }

  var _setup = function(dialog) {
    // Submit action is configured in sunstone.js since it's an action_button
    return false;
  }

  var _onShow = function(dialog) {
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

  return {
    'dialogId': DIALOG_ID,
    'html': _html,
    'setup': _setup,
    'onShow': _onShow
  }
});
