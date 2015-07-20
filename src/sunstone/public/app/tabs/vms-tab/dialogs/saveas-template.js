define(function(require) {
  /*
    DEPENDENCIES
   */

  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./saveas-template/html');
  var Sunstone = require('sunstone');
  var OpenNebula = require('opennebula');
  var Notifier = require('utils/notifier');
  var Tips = require('utils/tips');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./saveas-template/dialogId');
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

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'dialogId': this.dialogId
    });
  }

  function _setup(context) {
    var that = this;

    Tips.setup(context);


    $('#' + DIALOG_ID + 'Form', context).submit(function() {
      var template_name = $('#template_name', this).val();
      var vm_id = $("#vm_id", context).val();

      OpenNebula.VM.save_as_template({
        data : {
          id: vm_id,
          extra_param: {
            name : template_name
          }
        },
        success: function(request, response){
          OpenNebula.Action.clear_cache("VMTEMPLATE");
          Notifier.notifyMessage(Locale.tr("VM Template") + ' ' + template_name + ' ' + Locale.tr("saved successfully"))
        },
        error: function(request, response){
          Notifier.onError(request, response);
        }
      })

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      return false;
    });

    return false;
  }

  function _onShow(context) {
    $("#vm_id", context).val(Sunstone.getDataTable(TAB_ID).elements());
    $("#template_name", context).focus();
    return false;
  }
});
