define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var BaseDialog = require('utils/dialogs/dialog');
  var Resumable = require('resumable');
  var TemplateHTML = require('hbs!./create/html');
  var Sunstone = require('sunstone');
  var OpenNebulaError = require('opennebula/error');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var ResourceSelect = require('utils/resource-select')
  
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
    Tips.setup(dialog);

    $('.advanced', dialog).hide();

    $('#advanced_image_create', dialog).click(function() {
      $('.advanced', dialog).toggle();
      return false;
    });

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
        break;
      case "datablock":
        $('#img_path,#file-uploader', dialog).closest('.row').hide();
        $('#img_fstype,#img_size', dialog).closest('.row').show();
        break;
      case "upload":
        $('#img_path,#img_fstype,#img_size', dialog).closest('.row').hide();
        $('#file-uploader', dialog).closest('.row').show();
        break;
      };
    });

    $('#path_image', dialog).click();

    dialog.on('click', '#add_custom_var_image_button', function() {
      var name = $('#custom_var_image_name', dialog).val();
      var value = $('#custom_var_image_value', dialog).val();
      if (!name.length || !value.length) {
        Notifier.notifyError(Locale.tr("Custom attribute name and value must be filled in"));
        return false;
      }
      option = '<option value=\'' + value + '\' name=\'' + name + '\'>' +
          name + '=' + value +
          '</option>';
      $('select#custom_var_image_box', dialog).append(option);
      return false;
    });

    dialog.on('click', '#remove_custom_var_image_button', function() {
      $('select#custom_var_image_box :selected', dialog).remove();
      return false;
    });

    var img_obj;

    if (_getInternetExplorerVersion() > -1) {
      $("#upload_image").attr("disabled", "disabled");
    } else {
      var uploader = new Resumable({
        target: 'upload_chunk',
        chunkSize: 10 * 1024 * 1024,
        maxFiles: 1,
        testChunks: false,
        query: {
          csrftoken: ""//TODO csrftoken
        }
      });

      uploader.assignBrowse($('#file-uploader-input', dialog));

      var fileName = '';
      var file_input = false;

      uploader.on('fileAdded', function(file) {
        fileName = file.fileName;
        file_input = fileName;

        $('#file-uploader-input', dialog).hide()
        $("#file-uploader-label", dialog).html(file.fileName);
      });

      uploader.on('uploadStart', function() {
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

      uploader.on('progress', function() {
        $('span.meter', $('div[id="' + fileName + 'progressBar"]')).css('width', uploader.progress() * 100.0 + '%')
      });

      uploader.on('fileSuccess', function(file) {
        $('div[id="' + fileName + '-info"]').text(Locale.tr("Registering in OpenNebula"));
        $.ajax({
          url: 'upload',
          type: "POST",
          data: {
            csrftoken: csrftoken,
            img : JSON.stringify(img_obj),
            file: fileName,
            tempfile: file.uniqueIdentifier
          },
          success: function() {
            Notifier.notifyMessage("Image uploaded correctly");
            $('div[id="' + fileName + 'progressBar"]').remove();
            Sunstone.runAction("Image.refresh");
          },
          error: function(response) {
            Notifier.onError({}, OpenNebulaError(response));
            $('div[id="' + fileName + 'progressBar"]').remove();
          }
        });
      });
    }

    $('#' + DIALOG_ID + 'Form', dialog).submit(function() {
      var exit = false;
      var upload = false;
      $('.img_man', this).each(function() {
        if (!$('input', this).val().length) {
          Notifier.notifyError(Locale.tr("There are mandatory parameters missing"));
          exit = true;
          return false;
        }
      });
      if (exit) { return false; }

      var ds_id = $('#img_datastore .resource_list_select', dialog).val();
      if (!ds_id) {
        Notifier.notifyError(Locale.tr("Please select a datastore for this image"));
        return false;
      };

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

      //Time to add custom attributes
      $('#custom_var_image_box option', dialog).each(function() {
        var attr_name = $(this).attr('name');
        var attr_value = $(this).val();
        img_json[attr_name] = attr_value;
      });

      img_obj = {"image" : img_json,
                  "ds_id" : ds_id};

      //we this is an image upload we trigger FileUploader
      //to start the upload
      if (upload) {
        Sunstone.hideDialog(DIALOG_ID);
        Sunstone.resetDialog(DIALOG_ID);
        uploader.upload();
      } else {
        Sunstone.runAction("Image.create", img_obj);
      };

      return false;
    });

    $('#create_image_submit_manual', dialog).click(function() {
      var template = $('#template', dialog).val();
      var ds_id = $('#img_datastore_raw .resource_list_select', dialog).val();

      if (!ds_id) {
        Notifier.notifyError(Locale.tr("Please select a datastore for this image"));
        return false;
      };

      var img_obj = {
        "image" : {
          "image_raw" : template
        },
        "ds_id" : ds_id
      };
      Sunstone.runAction("Image.create", img_obj);

      return false;
    });
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
