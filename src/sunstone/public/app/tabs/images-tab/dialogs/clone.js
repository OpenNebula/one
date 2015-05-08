define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./clone/html');
  var Sunstone = require('sunstone');
  
  /*
    CONSTANTS
   */
  
  var DIALOG_ID = require('./clone/dialogId');

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
    // TODO: Show DS with the same ds mad only
    setupDatastoreTableSelect(dialog, "image_clone",
        {filter_fn: function(ds) { return ds.TYPE == 0; }}
    );

    $('#image_clone_advanced_toggle', dialog).click(function() {
      $('#image_clone_advanced', dialog).toggle();
      return false;
    });

    $('#' + DIALOG_ID + 'Form', dialog).submit(function() {
      var name = $('input[name="image_clone_name"]', this).val();
      var sel_elems = imageElements();

      if (!name || !sel_elems.length)
          notifyError('A name or prefix is needed!');

      var extra_info = {};

      if ($("#selected_resource_id_image_clone", dialog).val().length > 0) {
        extra_info['target_ds'] =
            $("#selected_resource_id_image_clone", dialog).val();
      }

      if (sel_elems.length > 1) {
        for (var i = 0; i < sel_elems.length; i++) {
          //If we are cloning several images we
          //use the name as prefix
          extra_info['name'] = name + getImageName(sel_elems[i]);
          Sunstone.runAction('Image.clone', sel_elems[i], extra_info);
        }
      } else {
        extra_info['name'] = name;
        Sunstone.runAction('Image.clone', sel_elems[0], extra_info)
      }

      Sunstone.hideDialog(DIALOG_ID);
      Sunstone.resetDialog(DIALOG_ID);
      setTimeout(function() {
        Sunstone.runAction('Image.refresh');
      }, 1500);
      return false;
    });

    return false;
  }

  function _onShow(dialog) {
    var sel_elems = imageElements();
    //show different text depending on how many elements are selected
    if (sel_elems.length > 1) {
      $('.clone_one', dialog).hide();
      $('.clone_several', dialog).show();
      $('input[name="image_clone_name"]', dialog).val('Copy of ');
    } else {
      $('.clone_one', dialog).show();
      $('.clone_several', dialog).hide();
      $('input[name="image_clone_name"]', dialog).val('Copy of ' + getImageName(sel_elems[0]));
    };

    $('#image_clone_advanced', dialog).hide();
    resetResourceTableSelect(dialog, "image_clone");

    $("input[name='image_clone_name']", dialog).focus();

    return false;
  }
});
