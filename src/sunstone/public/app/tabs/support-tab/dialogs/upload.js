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
            <div id="'+fileName+'-info" class="large-2 columns dataTables_info">\
              Uploading...\
            </div>\
            <div class="large-10 columns">\
              <div id="upload_progress_container" class="progress nine radius" style="height:25px !important">\
                <span class="meter" style="width:0%"></span>\
              </div>\
              <div class="progress-text" style="margin-left:15px">'+fileName+'</div>\
            </div>\
          </div>');
      });

      uploader.on('progress', function() {
        $('span.meter', $('div[id="'+fileName+'progressBar"]', tabContext)).css('width', uploader.progress()*100.0+'%')
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
