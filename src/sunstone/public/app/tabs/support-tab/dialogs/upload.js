/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./upload/html');
  var Resumable = require('resumable');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var OpenNebulaError = require('opennebula/error');
  var BrowserInfo = require('utils/browser-info');
  var ProgressBar = require('utils/progress-bar');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./upload/dialogId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    BaseDialog.call(this);
  }

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;
  Dialog.prototype.setParams = _setParams;

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'dialogId': this.dialogId
    });
  }

  /**
   * @param {object} params
   *        - params.requestId : Support Request id
   */
  function _setParams(params) {
    this.requestId = params.requestId;
  }

  function _setup(context) {
    var that = this;

    var tabContext = $("#"+TAB_ID);

    if (BrowserInfo.getInternetExplorerVersion() > -1) {
      $(".upload_support_file_form_button", context).text("Uploading files through IE is not supported");
      $(".upload_support_file_form_button", context).attr("disabled", "disabled");
    } else {
      var uploader = new Resumable({
        target: 'upload_chunk',
        chunkSize: 10*1024*1024,
        maxFiles: 1,
        testChunks: false,
        query: {
          csrftoken: csrftoken
        }
      });

      uploader.assignBrowse($('#support_file-uploader-input', context));

      var fileName = '';
      var file_input = false;

      uploader.on('fileAdded', function(file){
        $(".upload_support_file_form_button", context).removeAttr("disabled");
        fileName = file.fileName;
        file_input = fileName;

        $('#support_file-uploader-input', context).hide();
        $("#support_file-uploader-label", context).html(file.fileName);
      });

      uploader.on('uploadStart', function() {
        $(".upload_support_file_form_button", context).attr("disabled", "disabled");
        $('.support_upload_progress_bars', tabContext).append(
          '<div id="'+fileName+'progressBar" class="row" style="margin-bottom:10px">\
            <div id="'+fileName+'-info" class="medium-2 columns">\
              Uploading...\
            </div>\
            <div class="medium-10 columns">\
              <div class="progressbar">'+
                ProgressBar.html(0, 1, fileName) + '\
              </div>\
            </div>\
          </div>');
      });

      uploader.on('progress', function() {
        $('div.progressbar', $('div[id="' + fileName + 'progressBar"]', tabContext)).html(
                              ProgressBar.html(this.progress(), 1, fileName) );
      });

      uploader.on('fileSuccess', function(file) {
        $('div[id="'+fileName+'-info"]', tabContext).text('Registering in OpenNebula');
        $.ajax({
          url: 'support/request/' + that.requestId + '/upload',
          type: "POST",
          data: {
            csrftoken: csrftoken,
            file: fileName,
            tempfile: file.uniqueIdentifier
          },
          success: function(){
            Notifier.notifyMessage("File uploaded correctly");
            $('div[id="'+fileName+'progressBar"]', tabContext).remove();
            Sunstone.runAction("Support.refresh");

            Sunstone.getDialog(DIALOG_ID).hide();
          },
          error: function(response){
            Notifier.onError({}, OpenNebulaError(response));
            $('div[id="'+fileName+'progressBar"]', tabContext).remove();
          }
        });
      });

      $('#' + DIALOG_ID + 'Form', context).on("submit", function(){
        uploader.upload();
        Sunstone.getDialog(DIALOG_ID).hide();
        return false;
      });
    }
  }

  function _onShow(context) {
    return false;
  }
});
