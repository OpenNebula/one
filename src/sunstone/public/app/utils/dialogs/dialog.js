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
  };

  return BaseDialog;

  function _insert(dialog) {
    var that = this;
    var dialogElement = $(that.html()).appendTo('div#dialogs');
    that.setup(dialogElement);
    dialogElement.foundation('reveal', 'reflow');

    dialogElement.on('opened.fndtn.reveal', function (e) {
      if (e.namespace !== 'fndtn.reveal') { return; }
      that.onShow(dialogElement);
    });

    dialogElement.on('click', '.resetDialog', function() {
      that.reset();
      that.show();
    });

    that.dialogElement = dialogElement;

    return that.dialogElement;
  }

  function _show() {
    this.dialogElement.foundation('reveal', 'open');
    return false;
  }

  function _hide() {
    this.dialogElement.foundation('reveal', 'close');
  }

  function _reset() {
    this.dialogElement.remove();
    this.dialogElement = this.insert();
    return false;
  }
})
