/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

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
  var OpenNebulaDatastore = require('opennebula/datastore');
  var ResourceSelect = require('utils/resource-select');
  var CustomTagsTable = require('utils/custom-tags-table');
  var BrowserInfo = require('utils/browser-info');
  var Config = require('sunstone-config');
  var WizardFields = require('utils/wizard-fields');
  var ProgressBar = require('utils/progress-bar');

  var TemplateWizardHTML = require('hbs!./create/wizard');
  var TemplateAdvancedHTML = require('hbs!./create/advanced');

  /*
    CONSTANTS
   */

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    var title;

    if (this.resource == "Image"){
      title = Locale.tr("Create Image");
    } else {
      title = Locale.tr("Create File");
    }

    this.actions = {
      'create': {
        'title': title,
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      }
    };

    BaseFormPanel.call(this);
  }

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
      'images': (this.resource == "Image")
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _onShow(context) {
    $("#img_name", context).focus();

    var ds_id = $('#img_datastore .resource_list_select', context).val();
    var ds_id_raw = $('#img_datastore_raw .resource_list_select', context).val();

    var filterValue;

    if (this.resource == "Image"){
      filterValue = '' + OpenNebulaDatastore.TYPES.IMAGE_DS;
    } else {
      filterValue = '' + OpenNebulaDatastore.TYPES.FILE_DS
    }

    ResourceSelect.insert({
        context: $('#img_datastore', context),
        resourceName: 'Datastore',
        initValue: ds_id,
        filterKey: 'TYPE',
        filterValue: filterValue,
        triggerChange: true
      });

    ResourceSelect.insert({
        context: $('#img_datastore_raw', context),
        resourceName: 'Datastore',
        initValue: ds_id_raw,
        filterKey: 'TYPE',
        filterValue: filterValue,
        triggerChange: true
      });

    return false;
  }

  function _setup(context) {
    var that = this;
    Tips.setup(context);

    $('select#img_type', context).change(function() {
      var value = $(this).val();
      switch (value){
      case "DATABLOCK":
        $('#datablock_img', context).removeAttr("disabled");
        break;
      default:
        $('#datablock_img', context).attr('disabled', 'disabled');
        $('#path_image', context).click();
      }
    });

    $('#img_datastore', context).off('change', '.resource_list_select');
    $('#img_datastore', context).on('change', '.resource_list_select', function() {
      var ds_id = $(this).val();
      OpenNebulaDatastore.show({
        data : {
          id: ds_id
        },
        timeout: true,
        success: function(request, ds){
          var mad    = ds["DATASTORE"]["DS_MAD"];
          var tm_mad = ds["DATASTORE"]["TM_MAD"];

          var pers_forced = false;

          // Set the persistency
          if (Config.onedConf.DS_MAD_CONF !== undefined) {
            $.each(Config.onedConf.DS_MAD_CONF, function(i,e){
                if (e["NAME"] == mad && !$.isEmptyObject(e["PERSISTENT_ONLY"])) {
                  if (e["PERSISTENT_ONLY"] != undefined &&
                      e["PERSISTENT_ONLY"].toLowerCase() == "yes") {
                      $('#img_persistent', context).prop('disabled', true);
                      $('#img_persistent', context).prop('checked', true);
                      pers_forced = true;
                      return false;
                  }
                }
              }
            );
          }

          if (!pers_forced) {
            $('#img_persistent', context).prop('disabled', false);
          }

          // Display adequate values in the dialog.
          switch (mad) {
          case "vcenter":
            $(".only_vcenter").show();
            $(".not_vcenter").hide();
            break;
          default:
            $(".only_vcenter").hide();
            $(".not_vcenter").show();
          }

          // Fill in the default driver
          if (tm_mad == "qcow2"){
            $('select#img_driver',context).val("qcow2");
          } else {
            $('select#img_driver',context).val("raw");
          }
        },
        error: function(request, error_json, container){
          Notifier.onError(request, error_json, container);
        }
      });
    });

    // Custom Adapter Type
    var custom_attrs = ["adapter_type",
                        "disk_type",
                        "img_dev_prefix",
                        "img_driver"];

    for (var i in custom_attrs){
      var field = custom_attrs[i];
      $('input[name="custom_'+field+'"]',context).parent().hide();
      $('select#'+field,context).change(function(){
        var field = $(this).attr('name');
        if ($(this).val() == "custom"){
          $('input[name="custom_'+field+'"]',context).parent().show();
          $('input[name="custom_'+field+'"]',context).attr('required', '');
        } else {
          $('input[name="custom_'+field+'"]',context).parent().hide();
          $('input[name="custom_'+field+'"]',context).removeAttr('required');
        }
      });
    }

    $('#img_path,#img_size,#file-uploader', context).closest('.row').hide();

    $("input[name='src_path']", context).change(function() {
      var value = $(this).val();
      switch (value){
      case "path":
        $('#img_size,#file-uploader', context).closest('.row').hide();
        $('#img_path', context).closest('.row').show();

        $('#img_path', context).attr('required', '');
        $('#img_size', context).removeAttr('required');
        break;
      case "datablock":
        $('#img_path,#file-uploader', context).closest('.row').hide();
        $('#img_size', context).closest('.row').show();

        $('#img_path', context).removeAttr('required');
        $('#img_size', context).attr('required', '');
        break;
      case "upload":
        $('#img_path,#img_size', context).closest('.row').hide();
        $('#file-uploader', context).closest('.row').show();

        $('#img_path', context).removeAttr('required');
        $('#img_size', context).removeAttr('required');
        break;
      }
    });

    $('#path_image', context).click();

    CustomTagsTable.setup(context);

    if (BrowserInfo.getInternetExplorerVersion() > -1) {
      $("#upload_image").attr("disabled", "disabled");
    } else {
      that.uploader = new Resumable({
        target: 'upload_chunk',
        chunkSize: 10 * 1024 * 1024,
        maxFiles: 1,
        testChunks: false,
        query: {
          csrftoken: csrftoken
        }
      });

      that.uploader.assignBrowse($('#file-uploader-input', context));

      var fileName = '';
      var file_input = false;

      that.uploader.on('fileAdded', function(file) {
        fileName = file.fileName;
        file_input = fileName;

        $('#file-uploader-input', context).hide()
        $("#file-uploader-label", context).html(file.fileName);
      });

      that.uploader.on('uploadStart', function() {
        $('#upload_progress_bars').append(
          '<div id="' + fileName + 'progressBar" class="row" style="margin-bottom:10px">\
            <div id="' + fileName + '-info" class="medium-2 columns">\
              ' + Locale.tr("Uploading...") + '\
            </div>\
            <div class="medium-10 columns">\
              <div class="progressbar">'+
                ProgressBar.html(0, 1, fileName) + '\
              </div>\
            </div>\
          </div>');
      });

      that.uploader.on('progress', function() {
        $('div.progressbar', $('div[id="' + fileName + 'progressBar"]')).html(
                              ProgressBar.html(this.progress(), 1, fileName) );
      });
    }

    return false;
  }

  function _submitWizard(context) {
    var that = this;
    var upload = false;

    var ds_id = $('#img_datastore .resource_list_select', context).val();
    if (!ds_id) {
      Sunstone.hideFormPanelLoading(that.tabId);
      Notifier.notifyError(Locale.tr("Please select a datastore for this image"));
      return false;
    }

    var img_json = {};

    var name = WizardFields.retrieveInput($('#img_name', context));
    img_json["NAME"] = name;

    var desc = WizardFields.retrieveInput($('#img_desc', context));
    if (desc != undefined && desc.length) {
      img_json["DESCRIPTION"] = desc;
    }

    var type = WizardFields.retrieveInput($('#img_type', context));
    img_json["TYPE"] = type;

    img_json["PERSISTENT"] = $('#img_persistent:checked', context).length ? "YES" : "NO";

    var dev_prefix = WizardFields.retrieveInput($('#img_dev_prefix', context));
    if (dev_prefix != undefined && dev_prefix.length) {
      if (dev_prefix == "custom") {
        dev_prefix = WizardFields.retrieveInput($('#custom_img_dev_prefix', context));
      }
      img_json["DEV_PREFIX"] = dev_prefix;
    }

    var driver = WizardFields.retrieveInput($('#img_driver', context));
    if (driver != undefined && driver.length) {
        if (driver == "custom") {
          driver = WizardFields.retrieveInput($('#custom_img_driver', context));
        }
        img_json["DRIVER"] = driver;
    }

    var target = WizardFields.retrieveInput($('#img_target', context));
    if (target)
        img_json["TARGET"] = target;

    var adapter_type = WizardFields.retrieveInput($('#adapter_type', context));
    if (adapter_type) {
      if (adapter_type == "custom") {
        adapter_type = WizardFields.retrieveInput($('#custom_adapter_type', context));
      }
      img_json["ADAPTER_TYPE"] = adapter_type;
    }

    switch ($('#src_path_select input:checked', context).val()){
    case "path":
      path = WizardFields.retrieveInput($('#img_path', context));
      if (path) img_json["PATH"] = path;
      break;
    case "datablock":
      size = WizardFields.retrieveInput($('#img_size', context));
      if (size) img_json["SIZE"] = size;

      var disk_type = WizardFields.retrieveInput($('#disk_type', context));
      if (disk_type) {
        if (disk_type == "custom"){
          disk_type = WizardFields.retrieveInput($('#custom_disk_type', context));
        }
        img_json["DISK_TYPE"] = disk_type;
      }

      break;
    case "upload":
      upload = true;
      break;
    }

    $.extend(img_json, CustomTagsTable.retrieve(context));

    var img_obj = {
      "image" : img_json,
      "ds_id" : ds_id
    };

    //this is an image upload we trigger FileUploader
    //to start the upload
    if (upload) {
      if (that.uploader.files.length == 0) {
        Sunstone.hideFormPanelLoading(that.tabId);
        Notifier.notifyError(Locale.tr("Please select a file to upload"));
        return false;
      }

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
            Sunstone.runAction(that.resource+".refresh");
          },
          error: function(response) {
            Notifier.onError({}, OpenNebulaError(response));
            $('div[id="' + file.fileName + 'progressBar"]').remove();
          }
        });
      });

      that.uploader.upload();
    } else {
      Sunstone.runAction(that.resource+".create", img_obj);
    }

    return false;
  }

  function _submitAdvanced(context) {
    var template = $('#template', context).val();
    var ds_id = $('#img_datastore_raw .resource_list_select', context).val();

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

    Sunstone.runAction(this.resource+".create", img_obj);

    return false;
  }
});
