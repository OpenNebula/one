define(function(require) {
  require('foundation.reveal');

  function BaseDialog() {
    return this;
  }

  BaseDialog.prototype = {
    'insert': _insert,
    'show': _show,
    'hide': _hide,
    'reset': _reset,
  }

  return BaseDialog;

  function _insert(dialog) {
    var that = this;
    var dialogElement = $(that.html()).appendTo('div#dialogs');
    that.setup(dialogElement);
    dialogElement.foundation('reveal', 'reflow');

    dialogElement.on('opened.fndtn.reveal', function () {
      that.onShow(dialogElement);
    });

    dialogElement.on('click', '.resetDialog', function() {
      that.reset();
      that.show();
    })

    return dialogElement;
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

  function _reset() {
    var dialogElement = $('#' + this.dialogId);
    dialogElement.remove();
    dialogElement = this.insert();
    return false;
  }
})