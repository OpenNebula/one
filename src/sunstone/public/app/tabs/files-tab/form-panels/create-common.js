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

  var BaseFormPanel = require("utils/form-panels/form-panel");
  var Resumable = require("resumable");
  var Sunstone = require("sunstone");
  var OpenNebulaError = require("opennebula/error");
  var Notifier = require("utils/notifier");
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var OpenNebulaDatastore = require("opennebula/datastore");
  var ResourceSelect = require("utils/resource-select");
  var CustomTagsTable = require("utils/custom-tags-table");
  var BrowserInfo = require("utils/browser-info");
  var Config = require("sunstone-config");
  var WizardFields = require("utils/wizard-fields");
  var ProgressBar = require("utils/progress-bar");
  var Humanize = require("utils/humanize");

  var TemplateWizardHTML = require("hbs!./create/wizard");
  var TemplateAdvancedHTML = require("hbs!./create/advanced");

  /*
    CONSTANTS
   */
  var prepend = "file";

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    var title = Locale.tr("Create File");

    this.actions = {
      "create": {
        "title": title,
        "buttonText": Locale.tr("Create"),
        "resetButton": true
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
      "prepend": prepend,
      "formPanelId": this.formPanelId,
      "customTagsHTML": CustomTagsTable.html()
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({
      "prepend": prepend,
      formPanelId: this.formPanelId
    });
  }

  function _onShow(context) {
    $("#"+prepend+"_driver").val("");
    $("#"+prepend+"_name", context).focus();

    var ds_id = $("#"+prepend+"_datastore .resource_list_select", context).val();
    var ds_id_raw = $("#"+prepend+"_datastore_raw .resource_list_select", context).val();

    var filterValue = "" + OpenNebulaDatastore.TYPES.FILE_DS;

    ResourceSelect.insert({
        context: $("#"+prepend+"_datastore", context),
        resourceName: "Datastore",
        initValue: ds_id,
        filterKey: "TYPE",
        filterValue: filterValue,
        triggerChange: true
      });

    ResourceSelect.insert({
        context: $("#"+prepend+"_datastore_raw", context),
        resourceName: "Datastore",
        initValue: ds_id_raw,
        filterKey: "TYPE",
        filterValue: filterValue,
        triggerChange: true
      });

    return false;
  }


  function _setup(context) {
    var that = this;
    Tips.setup(context);

    $("select#"+prepend+"_type", context).change(function() {
      var value = $(this).val();
      switch (value){
      case "DATABLOCK":
      case "OS":
        $("#datablock_img", context).removeAttr("disabled");
        break;
      default:
        $("#datablock_img", context).attr("disabled", "disabled");
        $("#path_image", context).click();
      }
    });
    if(config["federation_mode"] == "SLAVE"){
      $("#upload_image").attr("disabled", "disabled");
    }

    $("#"+prepend+"_datastore", context).off("change", ".resource_list_select");
    $("#"+prepend+"_datastore", context).on("change", ".resource_list_select", function() {
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
                      $("#"+prepend+"_persistent", context).prop("disabled", true);
                      $("#"+prepend+"_persistent", context).val("YES");
                      pers_forced = true;
                      return false;
                  }
                }
              }
            );
          }

          if (!pers_forced) {
            $("#"+prepend+"_persistent", context).prop("disabled", false);
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
            $("select#"+prepend+"_driver",context).val("qcow2");
          } else {
            //$("select#img_driver",context).val("raw");
          }
        },
        error: function(request, error_json, container){
          Notifier.onError(request, error_json, container);
        }
      });
    });

    // Custom Adapter Type
    var custom_attrs = [
      "vcenter_adapter_type",
      "vcenter_disk_type",
      "img_dev_prefix",
      "img_driver"
    ];

    $(custom_attrs).each(function(_, field) {
      $("input[name=\"custom_"+field+"\"]",context).parent().hide();

      $("select#"+field, context).on("change", function() {
        var field = $(this).attr("name");

        if ($(this).val() == "custom"){
          $("input[name=\"custom_"+field+"\"]",context).parent().show();
          $("input[name=\"custom_"+field+"\"]",context).attr("required", "");
        } else {
          $("input[name=\"custom_"+field+"\"]",context).parent().hide();
          $("input[name=\"custom_"+field+"\"]",context).removeAttr("required");
        }
      });
    });

    $("#"+prepend+"_path,#"+prepend+"_size,#file-uploader", context).closest(".row").hide();
    $("input[name='src_path']", context).change(function() {
      var value = $(this).val();
      switch (value){
      case "path":
        $("#"+prepend+"_size,#file-uploader", context).closest(".row").hide();
        $("#"+prepend+"_path", context).closest(".row").show();
        $("#"+prepend+"_path", context).attr("required", "");
        $("#"+prepend+"_size", context).removeAttr("required");
        $(".datablock-input, .upload-input").addClass("hide");
        $(".path-input").removeClass("hide");
        $("#"+prepend+"_driver").val("");
        break;
      case "datablock":
        $("#"+prepend+"_path,#file-uploader", context).closest(".row").hide();
        $("#"+prepend+"_size", context).closest(".row").show();
        $("#"+prepend+"_path", context).removeAttr("required");
        $("#"+prepend+"_size", context).attr("required", "");
        $(".path-input, .upload-input").addClass("hide");
        $(".datablock-input").removeClass("hide");
        break;
      case "upload":
        $("#"+prepend+"_path,#"+prepend+"_size", context).closest(".row").hide();
        $("#file-uploader", context).closest(".row").show();
        $("#"+prepend+"_path", context).removeAttr("required");
        $("#"+prepend+"_size", context).removeAttr("required");
        $(".path-input, .datablock-input").addClass("hide");
        $(".upload-input").removeClass("hide");
        $("#"+prepend+"_driver").val("");
        break;
      }
    });

     $("#img_type", context).change(function() {
      var value = $(this).val();
      if(value == "CDROM")
        $("#"+prepend+"_persistent", context).closest(".row").hide();
      else
        $("#"+prepend+"_persistent", context).closest(".row").show();
    });

    $("#path_image", context).click();

    CustomTagsTable.setup(context);

    if (BrowserInfo.getInternetExplorerVersion() > -1) {
      $("#upload_image").attr("disabled", "disabled");
    } else {
      that.uploader = new Resumable({
        target: "upload_chunk",
        chunkSize: 10 * 1024 * 1024,
        maxFiles: 1,
        maxFileSize: config["system_config"]["max_upload_file_size"],
        testChunks: false,
        query: {
          csrftoken: csrftoken
        }
      });

      that.uploader.assignBrowse($("#file-uploader-input", context));

      var fileName = "";
      var file_input = false;

      that.uploader.on("fileAdded", function(file) {
        fileName = file.fileName;
        file_input = fileName;

        $("#file-uploader-input", context).hide();
        $("#file-uploader-label", context).html(file.fileName);
        $("#file-uploader-label", context).show();
        $("#close_image", context).show();
      });

      $("#close_image", context).on("click", function(){
          $("#file-uploader-label", context).hide();
          $("#close_image", context).hide();
          $("#file-uploader-input", context).show();
          fileName= "";
          that.uploader.files.length = 0;
      });
      var last_time = 0;
      var old_size = 0;

      that.uploader.on("uploadStart", function() {
        last_time = new Date().getTime();
        old_size = 0;
        var myThis = this;
          if(!(myThis.progress() > 0)){
          var element = $("#upload_progress_bars").append(
            "<div id=\"" + fileName + "progressBar\" class=\"row\" style=\"margin-bottom:10px\">\
              <div id=\"" + fileName + "-info\" class=\"medium-2 columns\">\
                " + Locale.tr("Uploading...") + "\
              </div>\
              <div class=\"medium-10 columns\">\
                <div class=\"progressbar\">"+
                  ProgressBar.html(0, 1, fileName) + "\
                </div>\
                <div>\
                  <button id=\"close_upload_image\" class=\"fas fa-times-circle fas fa-lg close_upload_image\">   </button>\
                  <button id=\"pause_upload_image\" class=\"fas fa-pause fas fa-lg pause_upload_image\">   </button>\
                  <button id=\"play_upload_image\" class=\"fas fa-play fas fa-lg play_upload_image\" hidden=\"true\">   </button>\
                </div>\
              </div>\
              <div class=\"medium-2 columns\">\
                <div id=\"speed\">speed: </div>\
                <div id=\"percent_progress\">Completed: </div>\
                </div>\
            </div>");
          }
          $(".close_upload_image").on("click", function(){
            myThis.cancel();
            show=0;
            if(element)
              element.remove();
          });
          $(".pause_upload_image").on("click", function(){
            myThis.pause();
            $(".pause_upload_image").hide();
            $(".play_upload_image").show();
          });
          $(".play_upload_image").on("click", function(){
            myThis.upload();
            $(".play_upload_image").hide();
            $(".pause_upload_image").show();
          });
      });

      that.uploader.on("progress", function() {
        var time = new Date().getTime();
        var size = this.getSize() * this.progress();
        if(time - last_time > 2000){
          size = size - old_size;
          var speed = size / ((time - last_time));
          document.getElementById( "speed" ).textContent = "speed: " + Humanize.size(speed) +"s";
          last_time = time;
          old_size = size;
        }
        document.getElementById( "percent_progress" ).textContent = "Completed: " + (this.progress().toFixed(3)*100).toFixed(1) +"%";
        $("div.progressbar", $("div[id=\"" + fileName + "progressBar\"]")).html(
                              ProgressBar.html(this.progress(), 1, fileName) );
      });
    }

    return false;
  }

 function _submitWizard(context) {
    var that = this;
    var upload = false;

    var ds_id = $("#"+prepend+"_datastore .resource_list_select", context).val();
    if (!ds_id) {
      Sunstone.hideFormPanelLoading(that.tabId);
      Notifier.notifyError(Locale.tr("Please select a datastore for this image"));
      return false;
    }

    var img_json = {};

    var name = WizardFields.retrieveInput($("#"+prepend+"_name", context));
    img_json["NAME"] = name;

    var desc = WizardFields.retrieveInput($("#"+prepend+"_desc", context));
    if (desc != undefined && desc.length) {
      img_json["DESCRIPTION"] = desc;
    }

    var type = WizardFields.retrieveInput($("#"+prepend+"_type", context));
    img_json["TYPE"] = type;

    img_json["PERSISTENT"] = $("#"+prepend+"_persistent", context).val();
    if ( img_json["PERSISTENT"] == "" ){
      delete img_json["PERSISTENT"];
    }

    var dev_prefix = WizardFields.retrieveInput($("#"+prepend+"_dev_prefix", context));
    if (dev_prefix != undefined && dev_prefix.length) {
      if (dev_prefix == "custom") {
        dev_prefix = WizardFields.retrieveInput($("#custom_img_dev_prefix", context));
      }
      img_json["DEV_PREFIX"] = dev_prefix;
    }

    var driver = WizardFields.retrieveInput($("#"+prepend+"_driver", context));
    if (driver != undefined && driver.length) {
        if (driver == "custom") {
          driver = WizardFields.retrieveInput($("#custom_img_driver", context));
        }
        img_json["FORMAT"] = driver;
    }

    var target = WizardFields.retrieveInput($("#"+prepend+"_target", context));
    if (target)
        img_json["TARGET"] = target;

    var vcenter_adapter_type = WizardFields.retrieveInput($("#vcenter_adapter_type", context));
    if (vcenter_adapter_type) {
      if (vcenter_adapter_type == "custom") {
        vcenter_adapter_type = WizardFields.retrieveInput($("#custom_vcenter_adapter_type", context));
      }
      img_json["VCENTER_ADAPTER_TYPE"] = vcenter_adapter_type;
    }

    switch ($("#src_path_select input:checked", context).val()){
    case "path":
      path = WizardFields.retrieveInput($("#"+prepend+"_path", context));
      if (path) img_json["PATH"] = path;
      break;
    case "datablock":
      size = WizardFields.retrieveInput($("#"+prepend+"_size", context));

      if(size && $(".mb_input_unit", context).val() == "GB"){
        size = size * 1024;
        size = size.toString();
      }
      if (size) img_json["SIZE"] = size;

      var vcenter_disk_type = WizardFields.retrieveInput($("#vcenter_disk_type", context));
      if (vcenter_disk_type) {
        if (vcenter_disk_type == "custom"){
          vcenter_disk_type = WizardFields.retrieveInput($("#custom_disk_type", context));
        }
        img_json["VCENTER_DISK_TYPE"] = vcenter_disk_type;
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

      that.uploader.on("fileSuccess", function(file) {
        $("div[id=\"" + file.fileName + "-info\"]").text(Locale.tr("Registering in OpenNebula"));
        $.ajax({
          url: "upload",
          type: "POST",
          data: {
            csrftoken: csrftoken,
            img : JSON.stringify(img_obj),
            file: file.fileName,
            tempfile: file.uniqueIdentifier
          },
          success: function() {
            Notifier.notifyMessage("Image uploaded correctly");
            $("div[id=\"" + file.fileName + "progressBar\"]").remove();
            Sunstone.runAction(that.resource+".refresh");
          },
          error: function(response) {
            Notifier.onError({}, OpenNebulaError(response));
            $("div[id=\"" + file.fileName + "progressBar\"]").remove();
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
    var template = $("#template", context).val();
    var ds_id = $("#"+prepend+"_datastore_raw .resource_list_select", context).val();

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
