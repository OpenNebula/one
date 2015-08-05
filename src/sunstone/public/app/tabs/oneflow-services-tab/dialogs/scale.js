define(function(require) {
  /*
    DEPENDENCIES
   */

  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./scale/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./scale/dialogId');
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
  Dialog.prototype.setParams = _setParams;

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'dialogId': this.dialogId
    });
  }

  function _onShow(context) {
  }

  function _setup(context) {
    var that = this;

    context.foundation('abide', 'reflow');
    context.off('invalid.fndtn.abide', '#' + DIALOG_ID + 'Form');
    context.off('valid.fndtn.abide', '#' + DIALOG_ID + 'Form');

    context.on('invalid.fndtn.abide', '#' + DIALOG_ID + 'Form', function(e) {
      Notifier.notifyError(Locale.tr("One or more required fields are missing or malformed."));
    }).on('valid.fndtn.abide', '#' + DIALOG_ID + 'Form', function(e) {
      var force = false;
      if ($("#force", context).is(":checked")) {
        force = true;
      }

      var obj = {
        "force": force,
        "cardinality": $("#cardinality", context).val(),
      };

      Sunstone.runAction('Role.update', that.roleIds, obj);

      return false;
    });

    Tips.setup(context);

    return false;
  }

  /**
   * @param {object} params
   *        - params.roleIds : Array of selected role IDs
   */
  function _setParams(params) {
    this.roleIds = params.roleIds;
  }
});
