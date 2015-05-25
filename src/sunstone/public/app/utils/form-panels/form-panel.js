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
    'setAction': _setAction,
    'retrieveWizardFields': _retrieveWizardFields,
    'fillWizardFields': _fillWizardFields
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

  // TODO: other types: radio, checkbox
  function _retrieveWizardFields(dialog, template_json) {
    var fields = $('[wizard_field]', dialog);

    fields.each(function() {
      var field = $(this);

      if (field.prop('wizard_field_disabled') != true &&
            field.val() != null && field.val().length &&
            (field.attr("type") != "checkbox" || field.prop("checked"))
          ) {

        var field_name = field.attr('wizard_field');
        template_json[field_name] = field.val();
      }
    });
  }

  function _fillWizardFields(dialog, template_json) {
    var fields = $('[wizard_field]', dialog);

    fields.each(function() {
      var field = $(this);
      var field_name = field.attr('wizard_field');
      if (template_json[field_name]) {
        switch (field.attr("type")){
        case "radio":
          var checked = (field.val() == template_json[field_name]);

          field.prop("checked", checked);

          if (checked) {
            field.change();
          }
          break;
        case "checkbox":
          var checked = (field.val().toUpperCase() ==
                          template_json[field_name].toUpperCase());

          field.prop("checked", checked);

          if (checked) {
            field.change();
          }
          break;
        default:
          field.val(template_json[field_name])  //TODO field.val(escapeDoubleQuotes(htmlDecode(template_json[field_name])));
          field.change();
        }
      }
    });
  }
})
