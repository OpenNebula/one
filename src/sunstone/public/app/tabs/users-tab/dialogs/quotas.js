define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./quotas/html');
  var Locale = require('utils/locale');
  var QuotaDefaults = require('utils/quotas/quota-defaults');
  var QuotaWidgets = require('utils/quotas/quota-widgets');

  /*
    CONSTANTS
   */
  
  var DIALOG_ID = require('./quotas/dialogId');
  var TAB_ID = require('../tabId');
  var RESOURCE = "User";
  var XML_ROOT = "USER";

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    this.element = undefined;

    BaseDialog.call(this);
  }

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;
  Dialog.prototype.setParams = _setParams;

  return Dialog;
  
  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'dialogId': this.dialogId,
      'quotasHTML': QuotaWidgets.dialogHTML()
    });
  }

  function _setup(context) {
    var that = this;

    QuotaWidgets.setupQuotasDialog(context);

    return false;
  }

  /**
   * @param {object} params
   *        - params.element : user object, or empty object {}
   */
  function _setParams(params) {
    this.element = params.element;
  }

  function _onShow(context) {
    QuotaWidgets.populateQuotasDialog(
      this.element,
      QuotaDefaults.getDefaultQuotas(RESOURCE),
      context);

    return false;
  }
});
