define(function(require) {
  /*
    DEPENDENCIES
   */

  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var ImageTable = require('tabs/images-tab/datatable')
  var WizardFields = require('utils/wizard-fields');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./disk-tab/html');

  /*
    CONSTANTS
   */

  /*
    CONSTRUCTOR
   */

  function DiskTab(diskTabId) {
    this.diskTabId = 'diskTab' + diskTabId;

    this.imageTable = new ImageTable(this.diskTabId + 'Table', {'select': true});
  }

  DiskTab.prototype.constructor = DiskTab;
  DiskTab.prototype.html = _html;
  DiskTab.prototype.setup = _setup;
  DiskTab.prototype.onShow = _onShow;
  DiskTab.prototype.retrieve = _retrieve;
  DiskTab.prototype.fill = _fill;

  return DiskTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'diskTabId': this.diskTabId,
      'imageTableSelectHTML': this.imageTable.dataTableHTML
    });
  }

  function _onShow(context, panelForm) {
    this.imageTable.refreshResourceTableSelect();
  }

  function _setup(context) {
    var that = this;
    context.foundation('tooltip', 'reflow');
    that.imageTable.initialize({
      'selectOptions': {
        'select_callback': function(aData, options) {
          // If the image is selected by Id, avoid overwriting it with name+uname
          if ($('#IMAGE_ID', context).val() != aData[options.id_index]) {
            $('#IMAGE_ID', context).val("");
            $('#IMAGE', context).val(aData[options.name_index]);
            $('#IMAGE_UNAME', context).val(aData[options.uname_index]);
            $('#IMAGE_UID', context).val("");
          }
        }
      }
    });
    that.imageTable.refreshResourceTableSelect();

    // Select Image or Volatile disk. The div is hidden depending on the selection, and the
    // vm_param class is included to be computed when the template is generated.
    var imageContext = $("div.image",  context);
    var volatileContext = $("div.volatile",  context);
    $("input[name='" + that.diskTabId + "']", context).change(function() {
      if ($("input[name='" + that.diskTabId + "']:checked", context).val() == "image") {
        imageContext.toggle();
        volatileContext.hide();
        $("[wizard_field]", imageContext).prop('wizard_field_disabled', false);
        $("[wizard_field]", volatileContext).prop('wizard_field_disabled', true);
      } else {
        imageContext.hide();
        volatileContext.toggle();
        $("[wizard_field]", volatileContext).prop('wizard_field_disabled', false);
        $("[wizard_field]", imageContext).prop('wizard_field_disabled', true);
      }
    });

    $("[wizard_field]", imageContext).prop('wizard_field_disabled', false);
    $("[wizard_field]", volatileContext).prop('wizard_field_disabled', true);
  }

  function _retrieve(context) {
    return WizardFields.retrieve(context);
  }

  function _fill(context, templateJSON) {
    if (templateJSON.IMAGE_ID || templateJSON.IMAGE) {
      $('input#' + this.diskTabId + 'radioImage', context).click();

      if (templateJSON.IMAGE_ID != undefined) {
        var selectedResources = {
          ids : templateJSON.IMAGE_ID
        }

        this.imageTable.selectResourceTableSelect(selectedResources);
      } else if (templateJSON.IMAGE != undefined && templateJSON.IMAGE_UNAME != undefined) {
        var selectedResources = {
          names : {
            name: templateJSON.IMAGE,
            uname: templateJSON.IMAGE_UNAME
          }
        }

        this.imageTable.selectResourceTableSelect(selectedResources);
      }

      WizardFields.fill($(".image", context), templateJSON);
    } else {
      $('input#' + this.diskTabId + 'radioVolatile', context).click();
      WizardFields.fill($(".volatile", context), templateJSON);
    }

  }
});
