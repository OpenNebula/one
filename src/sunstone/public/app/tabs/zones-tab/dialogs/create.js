define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./create/html');
  var Sunstone = require('sunstone');
  
  /*
    CONSTANTS
   */
  
  var DIALOG_ID = require('./create/dialogId');

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
    $('#'+DIALOG_ID+'Form', dialog).submit(_submit);
    return false;
  }

  function _submit() {
    var name = $('#zonename', this).val();
    var endpoint = $("#endpoint", this).val();
    var zoneJSON = {"zone" : {"name" : name, "endpoint" : endpoint}};
    Sunstone.runAction("Zone.create", zoneJSON);
    return false;
  }

  function _onShow(dialog) {
    $("#zonename", dialog).focus();
    return false;
  }
});
