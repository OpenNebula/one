define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Resumable = require('resumable');
  var Sunstone = require('sunstone');
  var OpenNebulaError = require('opennebula/error');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var ResourceSelect = require('utils/resource-select');
  var CustomTagsTable = require('utils/custom-tags-table');

  var TemplateWizardHTML = require('hbs!./create/wizard');
  var TemplateAdvancedHTML = require('hbs!./create/advanced');

  /*
    CONSTANTS
   */
  
  var FORM_PANEL_ID = require('./create/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'create': {
        'title': Locale.tr("Create Image"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      }
    };

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.htmlAdvanced = _htmlAdvanced;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.submitAdvanced = _submitAdvanced;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;


  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
      'customTagsHTML': CustomTagsTable.html(),
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _onShow(dialog) {
    $("#img_name", dialog).focus();

    var ds_id = $('#img_datastore .resource_list_select', dialog).val();
    var ds_id_raw = $('#img_datastore_raw .resource_list_select', dialog).val();

    // Filter out DS with type system (1) or file (2)
    var filter_att = ["TYPE", "TYPE"];
    var filter_val = ["1", "2"];

    ResourceSelect.insert('div#img_datastore', dialog, "Datastore",
                        ds_id, false, null, filter_att, filter_val);

    ResourceSelect.insert('div#img_datastore_raw', dialog, "Datastore",
                        ds_id_raw, false, null, filter_att, filter_val);

    return false;
  }

  function _setup(dialog) {
    var that = this;
    Tips.setup(dialog);

    $('select#img_type', dialog).change(function() {
      var value = $(this).val();
      switch (value){
      case "DATABLOCK":
        $('#datablock_img', dialog).removeAttr("disabled");
        break;
      default:
        $('#datablock_img', dialog).attr('disabled', 'disabled');
        $('#path_image', dialog).click();

      }
    });

    $('#img_path,#img_fstype,#img_size,#file-uploader', dialog).closest('.row').hide();

    $("input[name='src_path']", dialog).change(function() {
      var value = $(this).val();
      switch (value){
      case "path":
        $('#img_fstype,#img_size,#file-uploader', dialog).closest('.row').hide();
        $('#img_path', dialog).closest('.row').show();

        $('#img_path', dialog).attr('required', '');
        $('#img_size', dialog).removeAttr('required');
        break;
      case "datablock":
        $('#img_path,#file-uploader', dialog).closest('.row').hide();
        $('#img_fstype,#img_size', dialog).closest('.row').show();

        $('#img_path', dialog).removeAttr('required');
        $('#img_size', dialog).attr('required', '');
        break;
      case "upload":
        $('#img_path,#img_fstype,#img_size', dialog).closest('.row').hide();
        $('#file-uploader', dialog).closest('.row').show();

        $('#img_path', dialog).removeAttr('required');
        $('#img_size', dialog).removeAttr('required');
        break;
      }
    });

    $('#path_image', dialog).click();

    CustomTagsTable.setup(dialog);

    if (_getInternetExplorerVersion() > -1) {
      $("#upload_image").attr("disabled", "disabled");
    } else {
      that.uploader = new Resumable({
        target: 'upload_chunk',
        chunkSize: 10 * 1024 * 1024,
        maxFiles: 1,
        testChunks: false,
        query: {
          csrftoken: ""//TODO csrftoken
        }
      });

      that.uploader.assignBrowse($('#file-uploader-input', dialog));

      var fileName = '';
      var file_input = false;

      that.uploader.on('fileAdded', function(file) {
        fileName = file.fileName;
        file_input = fileName;

        $('#file-uploader-input', dialog).hide()
        $("#file-uploader-label", dialog).html(file.fileName);
      });

      that.uploader.on('uploadStart', function() {
        $('#upload_progress_bars').append('<div id="' + fileName + 'progressBar" class="row" style="margin-bottom:10px">\
            <div id="' + fileName + '-info" class="large-2 columns dataTables_info">\
              ' + Locale.tr("Uploading...") + '\
            </div>\
            <div class="large-10 columns">\
              <div id="upload_progress_container" class="progress nine radius" style="height:25px !important">\
                <span class="meter" style="width:0%"></span>\
              </div>\
              <div class="progress-text" style="margin-left:15px">' + fileName + '</div>\
            </div>\
          </div>');
      });

      that.uploader.on('progress', function() {
        $('span.meter', $('div[id="' + fileName + 'progressBar"]')).css('width', that.uploader.progress() * 100.0 + '%')
      });
    }

    return false;
  }

  function _submitWizard(dialog) {
    var that = this;
    var upload = false;

    var ds_id = $('#img_datastore .resource_list_select', dialog).val();
    if (!ds_id) {
      Notifier.notifyError(Locale.tr("Please select a datastore for this image"));
      return false;
    }

    var img_json = {};

    var name = $('#img_name', dialog).val();
    img_json["NAME"] = name;

    var desc = $('#img_desc', dialog).val();
    if (desc.length) {
      img_json["DESCRIPTION"] = desc;
    }

    var type = $('#img_type', dialog).val();
    img_json["TYPE"] = type;

    img_json["PERSISTENT"] = $('#img_persistent:checked', dialog).length ? "YES" : "NO";

    var dev_prefix = $('#img_dev_prefix', dialog).val();
    if (dev_prefix.length) {
      img_json["DEV_PREFIX"] = dev_prefix;
    }

    var driver = $('#img_driver', dialog).val();
    if (driver.length)
        img_json["DRIVER"] = driver;

    var target = $('#img_target', dialog).val();
    if (target)
        img_json["TARGET"] = target;

    switch ($('#src_path_select input:checked', dialog).val()){
    case "path":
      path = $('#img_path', dialog).val();
      if (path) img_json["PATH"] = path;
      break;
    case "datablock":
      size = $('#img_size', dialog).val();
      fstype = $('#img_fstype', dialog).val();
      if (size) img_json["SIZE"] = size;
      if (fstype) img_json["FSTYPE"] = fstype;
      break;
    case "upload":
      upload = true;
      break;
    }

    $.extend(img_json, CustomTagsTable.retrieve(dialog));

    var img_obj = {
      "image" : img_json,
      "ds_id" : ds_id
    };

    //this is an image upload we trigger FileUploader
    //to start the upload
    if (upload) {
      Sunstone.resetFormPanel(that.tabId, that.formPanelId);
      Sunstone.hideFormPanel(that.tabId);

      that.uploader.on('fileSuccess', function(file) {
        $('div[id="' + file.fileName + '-info"]').text(Locale.tr("Registering in OpenNebula"));
        $.ajax({
          url: 'upload',
          type: "POST",
          data: {
            csrftoken: csrftoken,
            img : JSON.stringify(img_obj),
            file: file.fileName,
            tempfile: file.uniqueIdentifier
          },
          success: function() {
            Notifier.notifyMessage("Image uploaded correctly");
            $('div[id="' + file.fileName + 'progressBar"]').remove();
            Sunstone.runAction("Image.refresh");
          },
          error: function(response) {
            Notifier.onError({}, OpenNebulaError(response));
            $('div[id="' + file.fileName + 'progressBar"]').remove();
          }
        });
      });

      that.uploader.upload();
    } else {
      Sunstone.runAction("Image.create", img_obj);
    }

    return false;
  }

  function _submitAdvanced(dialog) {
    var template = $('#template', dialog).val();
    var ds_id = $('#img_datastore_raw .resource_list_select', dialog).val();

    if (!ds_id) {
      Notifier.notifyError(Locale.tr("Please select a datastore for this image"));
      return false;
    }

    var img_obj = {
      "image" : {
        "image_raw" : template
      },
      "ds_id" : ds_id
    };

    Sunstone.runAction("Image.create", img_obj);

    return false;
  }

  function _getInternetExplorerVersion() {
    // Returns the version of Internet Explorer or a -1
    // (indicating the use of another browser).
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer') {
      var ua = navigator.userAgent;
      var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
      if (re.exec(ua) != null)
          rv = parseFloat(RegExp.$1);
    }
    return rv;
  }
});
