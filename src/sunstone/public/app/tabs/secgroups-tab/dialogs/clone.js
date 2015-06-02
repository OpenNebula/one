define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./clone/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');

  /*
    CONSTANTS
   */
  
  var DIALOG_ID = require('./clone/dialogId');
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

    context.off('invalid.fndtn.abide', '#' + DIALOG_ID + 'Form');
    context.off('valid.fndtn.abide', '#' + DIALOG_ID + 'Form');

    context.on('invalid.fndtn.abide', '#' + DIALOG_ID + 'Form', function(e) {
      // Fix for valid event firing twice
      if (e.namespace != 'abide.fndtn') { return; }

      Notifier.notifyError(Locale.tr("One or more required fields are missing or malformed."));
    }).on('valid.fndtn.abide', '#' + DIALOG_ID + 'Form', function(e) {
      // Fix for valid event firing twice
      if (e.namespace != 'abide.fndtn') { return; }

      var name = $('input', this).val();
      var sel_elems = Sunstone.getDataTable(TAB_ID).elements();

      if (sel_elems.length > 1){
        for (var i=0; i< sel_elems.length; i++)
          //use name as prefix if several items selected
          Sunstone.runAction('SecurityGroup.clone',
            sel_elems[i],
            name + Sunstone.getDataTable(TAB_ID).getName(sel_elems[i]));
      } else {
        Sunstone.runAction('SecurityGroup.clone',sel_elems[0],name);
      }

      return false;
    });

    context.foundation('reflow', 'abide');

    return false;
  }

  function _onShow(context) {
    var sel_elems = Sunstone.getDataTable(TAB_ID).elements();

    //show different text depending on how many elements are selected
    if (sel_elems.length > 1) {
      $('.clone_one', context).hide();
      $('.clone_several', context).show();
      $('input',context).val('Copy of ');
    } else {
      $('.clone_one', context).show();
      $('.clone_several', context).hide();

      $('input',context).val('Copy of ' + Sunstone.getDataTable(TAB_ID).getName(sel_elems[0]));
    }

    $("input[name='name']",context).focus();

    return false;
  }
});
