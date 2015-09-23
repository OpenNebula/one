/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
  var ResourceSelect = require('utils/resource-select');
  var BrowserInfo = require('utils/browser-info');

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
        'title': Locale.tr("Create File"),
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
      'formPanelId': this.formPanelId
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({
      'formPanelId': this.formPanelId
    });
  }

  function _onShow(context) {
    $("#file_name", context).focus();

    var ds_id = $('#file_datastore .resource_list_select', context).val();
    var ds_id_raw = $('#file_datastore_raw .resource_list_select', context).val();

    // Filter out DS with type image (0) or system (1)
    var filter_att = ["TYPE", "TYPE"];
    var filter_val = ["0", "1"];

    ResourceSelect.insert('div#file_datastore', context, "Datastore",
                        ds_id, false, null, filter_att, filter_val);

    ResourceSelect.insert('div#file_datastore_raw', context, "Datastore",
                        ds_id_raw, false, null, filter_att, filter_val);

    return false;
  }

  function _setup(context) {
    var that = this;
    Tips.setup(context);

    $('#file_path,#files_file-uploader', context).closest('.row').hide();

    $("input[name='src_path']", context).change(function() {
      var value = $(this).val();
      switch (value){
      case "path":
        $('#files_file-uploader', context).closest('.row').hide();
        $('#file_path', context).closest('.row').show();

        $('#file_path', context).attr('required', '');
        break;
      case "upload":
        $('#file_path', context).closest('.row').hide();
        $('#files_file-uploader', context).closest('.row').show();

        $('#file_path', context).removeAttr('required');
        break;
      }
    });

    $('#path_file', context).click();

    if (BrowserInfo.getInternetExplorerVersion() > -1) {
      $("#upload_file").attr("disabled", "disabled");
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

      that.uploader.assignBrowse($('#files_file-uploader-input', context));

      var fileName = '';
      var file_input = false;

      that.uploader.on('fileAdded', function(file) {
        fileName = file.fileName;
        file_input = fileName;

        $('#files_file-uploader-input', context).hide()
        $("#files_file-uploader-label", context).html(file.fileName);
      });

      that.uploader.on('uploadStart', function() {
        $('#files_upload_progress_bars').append('<div id="files-' + fileName + 'progressBar" class="row" style="margin-bottom:10px">\
            <div id="files-' + fileName + '-info" class="large-2 columns dataTables_info">\
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
        $('span.meter', $('div[id="files-' + fileName + 'progressBar"]')).css('width', this.progress() * 100.0 + '%')
      });
    }

    return false;
  }

  function _submitWizard(context) {
    var that = this;
    var upload = false;

    var ds_id = $('#file_datastore .resource_list_select', context).val();
    if (!ds_id) {
      Sunstone.hideFormPanelLoading(TAB_ID);
      Notifier.notifyError(Locale.tr("Please select a datastore for this file"));
      return false;
    }

    var img_json = {};

    var name = $('#file_name', context).val();
    img_json["NAME"] = name;

    var desc = $('#file_desc', context).val();
    if (desc.length) {
      img_json["DESCRIPTION"] = desc;
    }

    var type = $('#file_type', context).val();
    img_json["TYPE"] = type;

    switch ($('#src_path_select input:checked', context).val()){
    case "path":
      path = $('#file_path', context).val();
      if (path) img_json["PATH"] = path;
      break;
    case "upload":
      upload = true;
      break;
    }

    var img_obj = {
      "image" : img_json,
      "ds_id" : ds_id
    };

    //this is an image upload we trigger FileUploader
    //to start the upload
    if (upload) {
      if (that.uploader.files.length == 0) {
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.notifyError(Locale.tr("Please select a file to upload"));
        return false;
      }

      Sunstone.resetFormPanel(that.tabId, that.formPanelId);
      Sunstone.hideFormPanel(that.tabId);

      that.uploader.on('fileSuccess', function(file) {
        $('div[id="files-' + file.fileName + '-info"]').text(Locale.tr("Registering in OpenNebula"));
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
            $('div[id="files-' + file.fileName + 'progressBar"]').remove();
            Sunstone.runAction("File.refresh");
          },
          error: function(response) {
            Notifier.onError({}, OpenNebulaError(response));
            $('div[id="files-' + file.fileName + 'progressBar"]').remove();
          }
        });
      });

      that.uploader.upload();
    } else {
      Sunstone.runAction("File.create", img_obj);
    }

    return false;
  }

  function _submitAdvanced(context) {
    var template = $('#template', context).val();
    var ds_id = $('#file_datastore_raw .resource_list_select', context).val();

    if (!ds_id) {
      Notifier.notifyError(Locale.tr("Please select a datastore for this file"));
      return false;
    }

    var img_obj = {
      "image" : {
        "image_raw" : template
      },
      "ds_id" : ds_id
    };

    Sunstone.runAction("File.create", img_obj);

    return false;
  }
});
