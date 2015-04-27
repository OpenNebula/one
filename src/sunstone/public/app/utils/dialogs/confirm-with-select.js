define(function(require) {
  var TemplateHTML = require('hbs!./confirm-with-select/html');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');
  var DIALOG_ID = require('./confirm-with-select/dialogId');

  var ResourceSelect = require('utils/resource-select');

  var _html = function() {
    return TemplateHTML({dialogId: DIALOG_ID});
  }

  var _setup = function(dialog) {
    //when we proceed with a "confirm with select" we need to
    //find out if we are running an action with a parametre on a datatable
    //items or if its just an action
    $('#confirm_with_select_proceed', dialog).click(function() {
      var action = $(this).val();
      var action = Sunstone.getActions[action];
      var param = $('.resource_list_select', dialog).val();

      if (!param.length) {
        notifyError("You must select a value");
        return false;
      };

      if (!action) { 
        notifyError("Action " + action + " not defined."); 
        return false;
      };

      var error;
      switch (action.type){
      case "multiple": 
        error = Sunstone.runAction(action, action.elements(), param);
        break;
      default:
        error = Sunstone.runAction(action, param);
        break;
      }

      if (!error) {
        dialog.foundation('reveal', 'close');
      }

      return false;
    });

    return false;
  }

  var _onShow = function(dialog) {
    var actionId = dialog.data('buttonAction');
    var tabId = dialog.data('buttonTab');
    var button = Sunstone.getButton(tabId, action);

    var tip = Locale.tr("You have to confirm this action");
    if (button.tip == undefined) {
      tip = button.tip
    }

    if (button.custom_select) {
      $('div#confirm_select', dialog).html(button.custom_select);
    } else {
      ResourceSelect.insert('#confirm_select', dialog, button.select, null, true);
    }

    $('#confirm_with_select_tip', dialog).text(tip);
    $('#confirm_with_select_proceed', dialog).val(action);

    var action = Sunstone.getAction(action);
    var elements = action.elements();
    if (elements) {
      var str = action.split('.');
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
