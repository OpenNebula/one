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
    'show': _show,
    'hide': _hide,
    'reset': _reset,
    'setAction': _setAction
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

  function _show() {
    var dialogElement = $('#' + this.dialogId);
    dialogElement.foundation('reveal', 'open');
    return false;
  }

  function _hide() {
    var dialogElement = $('#' + this.dialogId);
    dialogElement.foundation('reveal', 'close')
  }

  function _reset(context) {
    $('#' + this.formPanelId + "Wizard").remove();
    if (this.htmlAdvanced) {
      $('#' + this.formPanelId + "Advanced").remove();
    }
    
    this.insert(context);
  }

  function _setAction(action) {
    this.action = action
  }
})
