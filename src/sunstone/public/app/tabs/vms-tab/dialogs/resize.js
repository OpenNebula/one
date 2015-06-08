define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./resize/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Tips = require('utils/tips');
  var CapacityInputs = require('tabs/templates-tab/form-panels/create/wizard-tabs/general/capacity-inputs');
  var WizardFields = require('utils/wizard-fields');

  /*
    CONSTANTS
   */
  
  var DIALOG_ID = require('./resize/dialogId');
  var TAB_ID = require('../tabId')

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
  Dialog.prototype.setElement = _setElement;

  return Dialog;
  
  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'dialogId': this.dialogId,
      'capacityInputsHTML': CapacityInputs.html()
    });
  }

  function _setup(context) {
    var that = this;
    CapacityInputs.setup();

    Tips.setup(context);

    $('#' + DIALOG_ID + 'Form', context).submit(function() {
      var templateJSON = WizardFields.retrieve(context);

      if (templateJSON["CPU"] == that.element.TEMPLATE.CPU) {
        delete templateJSON["CPU"];
      };

      if (templateJSON["MEMORY"] == that.element.TEMPLATE.MEMORY) {
        delete templateJSON["MEMORY"];
      };

      if (templateJSON["VCPU"] == that.element.TEMPLATE.VCPU) {
        delete templateJSON["VCPU"];
      };

      var enforce = $("#enforce", this).is(":checked");

      var obj = {
        "vm_template": templateJSON,
        "enforce": enforce,
      }

      Sunstone.runAction('VM.resize', that.element.ID, obj);

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      return false;
    });

    return false;
  }

  function _onShow(context) {    
    var that = this;
    $('#vm_id', context).text(that.element.ID);
    $('#CPU', context).val(that.element.TEMPLATE.CPU);
    $('#MEMORY_TMP', context).val(that.element.TEMPLATE.MEMORY);
    if (that.element.VCPU) {
      $('#VCPU', context).val(that.element.TEMPLATE.VCPU);
    }
    return false;
  }

  function _setElement(element) {
    this.element = element
  }
});
