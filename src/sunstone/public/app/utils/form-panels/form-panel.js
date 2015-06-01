define(function(require) {
  // Dependencies
  require('foundation.abide');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var Sunstone = require('sunstone');

  function BaseFormPanel() {
    return this;
  }

  BaseFormPanel.prototype = {
    'insert': _insert,
    'reset': _reset,
    'setAction': _setAction,
    'title': _title,
    'buttonText': _buttonText,
    'resetButton': _resetButton,
    'actionOptions': _actionOptions
  }

  return BaseFormPanel;

  function _insert(context) {
    var that = this;
    $("#wizardForms", context).append(that.htmlWizard());
    if (that.htmlAdvanced) {
      $("#advancedForms", context).append(that.htmlAdvanced());
    }
    
    context.off('invalid.fndtn.abide', '#' + that.formPanelId + 'Wizard');
    context.off('valid.fndtn.abide', '#' + that.formPanelId + 'Wizard');
    context.on('invalid.fndtn.abide', '#' + that.formPanelId + 'Wizard', function(e) {
      // Fix for valid event firing twice
      if (e.namespace != 'abide.fndtn') { return; };

      Notifier.notifyError(Locale.tr("One or more required fields are missing or malformed."));
      Sunstone.hideFormPanelLoading(that.tabId);
    }).on('valid.fndtn.abide', '#' + that.formPanelId + 'Wizard', function(e) {
      // Fix for valid event firing twice
      if (e.namespace != 'abide.fndtn') { return; };

      that.submitWizard(this);
      return false;
    });

    context.off('invalid.fndtn.abide', '#' + that.formPanelId + 'Advanced');
    context.off('valid.fndtn.abide', '#' + that.formPanelId + 'Advanced');
    context.on('invalid.fndtn.abide', '#' + that.formPanelId + 'Advanced', function(e) {
      // Fix for valid event firing twice
      if (e.namespace != 'abide.fndtn') { return; };

      Notifier.notifyError(Locale.tr("One or more required fields are missing or malformed."));
      Sunstone.hideFormPanelLoading(that.tabId);
    }).on('valid.fndtn.abide', '#' + that.formPanelId + 'Advanced', function(e) {
      // Fix for valid event firing twice
      if (e.namespace != 'abide.fndtn') { return; };

      that.submitAdvanced(this);
      return false;
    });

    context.foundation('reflow', 'abide');
    that.setup(context);
  }

  function _reset(context) {
    $('#' + this.formPanelId + "Wizard").remove();
    if (this.htmlAdvanced) {
      $('#' + this.formPanelId + "Advanced").remove();
    }
    
    this.insert(context);
  }

  function _setAction(context, action) {
    var prevAction = this.action;

    this.action = action;

    if (prevAction != action || action == "update") {
      this.reset(context);
    }
  }

  // @return [Object] actionOptions of the form based on the defined action
  function _actionOptions() {
    if (this.action) {
      var actionOptions = this.actions[this.action]
      if (actionOptions) {
        return actionOptions;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  // @return [String] The title of the form based on the defined action
  function _title() {
    var actionOptions = this.actionOptions();
    if (actionOptions) {
      return actionOptions.title;
    } else {
      return "";
    }
  }

  // @return [String] The buttonText of the form based on the defined action
  function _buttonText() {
    var actionOptions = this.actionOptions();
    if (actionOptions) {
      return actionOptions.buttonText;
    } else {
      return "";
    }
  }

  // @return [Boolean] Is enabled the reset button based on the defined action
  function _resetButton() {
    var actionOptions = this.actionOptions();
    if (actionOptions) {
      return actionOptions.resetButton;
    } else {
      return false;
    }
  }
})
