define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./clone/html');
  var Sunstone = require('sunstone');
  var DatastoreTable = require('tabs/datastores-tab/datatable')
  var Notifier = require('utils/notifier');

  /*
    CONSTANTS
   */
  
  var DIALOG_ID = require('./clone/dialogId');
  var IMAGES_TAB_ID = require('tabs/images-tab/tabId')

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    this.datastoreTable = new DatastoreTable('image_clone', {
      'select': true,
      'selectOptions': {
        'filter_fn': function(ds) { return ds.TYPE == 0; }
      }
    });

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
    return TemplateHTML({
      'dialogId': this.dialogId,
      'datastoreTableSelectHTML': this.datastoreTable.dataTableHTML
    });
  }

  function _setup(dialog) {
    var that = this;
    // TODO: Show DS with the same ds mad only
    that.datastoreTable.initialize();

    $('#image_clone_advanced_toggle', dialog).click(function() {
      $('#image_clone_advanced', dialog).toggle();
      return false;
    });

    $('#' + DIALOG_ID + 'Form', dialog).submit(function() {
      var name = $('input[name="image_clone_name"]', this).val();
      var sel_elems = Sunstone.getDataTable(IMAGES_TAB_ID).elements();

      if (!name || !sel_elems.length)
        Notifier.notifyError('A name or prefix is needed!');

      var extra_info = {};

      var targeDS = that.datastoreTable.retrieveResourceTableSelect();
      if (targeDS) {
        extra_info['target_ds'] = targeDS;
      }

      if (sel_elems.length > 1) {
        for (var i = 0; i < sel_elems.length; i++) {
          //If we are cloning several images we
          //use the name as prefix
          extra_info['name'] = name + Sunstone.getDataTable(IMAGES_TAB_ID).getName(sel_elems[i]);
          Sunstone.runAction('Image.clone', sel_elems[i], extra_info);
        }
      } else {
        extra_info['name'] = name;
        Sunstone.runAction('Image.clone', sel_elems[0], extra_info)
      }

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      setTimeout(function() {
        Sunstone.runAction('Image.refresh');
      }, 1500);
      return false;
    });

    return false;
  }

  function _onShow(dialog) {
    var sel_elems = Sunstone.getDataTable(IMAGES_TAB_ID).elements();
    //show different text depending on how many elements are selected
    if (sel_elems.length > 1) {
      $('.clone_one', dialog).hide();
      $('.clone_several', dialog).show();
      $('input[name="image_clone_name"]', dialog).val('Copy of ');
    } else {
      $('.clone_one', dialog).show();
      $('.clone_several', dialog).hide();
      $('input[name="image_clone_name"]', dialog).val('Copy of ' + Sunstone.getDataTable(IMAGES_TAB_ID).getName(sel_elems[0]));
    };

    $('#image_clone_advanced', dialog).hide();
    this.datastoreTable.resetResourceTableSelect();

    $("input[name='image_clone_name']", dialog).focus();

    return false;
  }
});
