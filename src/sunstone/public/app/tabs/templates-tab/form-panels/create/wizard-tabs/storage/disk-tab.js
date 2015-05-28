define(function(require) {
  /*
    DEPENDENCIES
   */

  require('nouislider');
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
    Tips.setup(context);
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
    // TODO Use wizard_fields
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

    // Define the size slider
    var final_size_input = $("#SIZE", context);
    var size_input = $("#SIZE_TMP", context);
    var size_unit  = $("#size_unit", context);

    var current_size_unit = size_unit.val();

    var update_final_size_input = function() {
      if (current_size_unit == 'MB') {
        final_size_input.val(Math.floor(size_input.val()));
      } else {
        final_size_input.val(Math.floor(size_input.val() * 1024));
      }
    }

    var size_slider_change = function(type) {
      if (type != "move") {
        var values = $(this).val();

        size_input.val(values / 100);

        update_final_size_input();
      }
    };

    var size_slider = $("#size_slider", context).noUiSlider({
      handles: 1,
      connect: "lower",
      range: [0, 5000],
      start: 1,
      step: 50,
      slide: size_slider_change,
    });

    size_slider.addClass("noUiSlider");

    size_input.change(function() {
      size_slider.val(this.value * 100)

      update_final_size_input();
    });

    size_input.val(10);
    update_final_size_input();

    // init::start is ignored for some reason
    size_slider.val(1000);

    size_unit.change(function() {
      var size_unit_val = $('#size_unit :selected', context).val();

      if (current_size_unit != size_unit_val) {
        current_size_unit = size_unit_val

        if (size_unit_val == 'GB') {

          size_slider.empty().noUiSlider({
            handles: 1,
            connect: "lower",
            range: [0, 5000],
            start: 1,
            step: 50,
            slide: size_slider_change,
          });

          var new_val = size_input.val() / 1024;

          size_input.val(new_val);
          size_slider.val(new_val * 100);
        } else if (size_unit_val == 'MB') {

          size_slider.empty().noUiSlider({
            handles: 1,
            connect: "lower",
            range: [0, 204800],
            start: 1,
            step: 12800,
            slide: size_slider_change,
          });

          var new_val = Math.round(size_input.val() * 1024);

          size_input.val(new_val);
          size_slider.val(new_val * 100);
        }

        update_final_size_input();
      }
    });
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

      if (templateJSON.SIZE) {
        $('#SIZE_TMP', context).val(templateJSON.SIZE / 1024)
      }
      
      WizardFields.fill($(".volatile", context), templateJSON);
    }

  }
});
