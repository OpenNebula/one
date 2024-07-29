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

  var Config = require("sunstone-config");
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var UniqueId = require("utils/unique-id");
  var OpenNebulaAction = require("opennebula/action");
  var CustomTagsTable = require("utils/custom-tags-table");
  var ResourceSelect = require("utils/resource-select");
  var BrowserInfo = require("utils/browser-info");
  var Resumable = require("resumable");
  var OpenNebulaDatastore = require("opennebula/datastore");
  var ProgressBar = require("utils/progress-bar");
  var Humanize = require("utils/humanize");

  /*
    TEMPLATES
   */

  var WrapperTaps = require("hbs!../wrapper");
  var TemplateHTML = require("hbs!./image/html");
  var TemplateAdvancedHTML = require("hbs!./image/advanced");

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require("./image/wizardTabId");
  var prepend = "img";
  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, "image")) {
      throw "Wizard Tab not enabled";
    }
    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = "fa-edit";
    this.title = Locale.tr("Image");
    this.formPanelId = opts.formPanelId || "";
    this.typeSender = "wizard";
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;

  return WizardTab;

  function optionsFilesystem(){
    var rtn = "<option value=''>--</option>";
    if(config && config.system_config && config.system_config.support_fs && Array.isArray(config.system_config.support_fs)){
      config.system_config.support_fs.forEach(function(element) {
        rtn += "<option value='"+element+"'>"+element+"</option>";
      });
    }
    return rtn;
  };

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    // this alls forms of Image template
    return WrapperTaps({
      "formPanelId": this.formPanelId,
      "form": TemplateHTML({
        "prepend": prepend,
        "formPanelId": this.formPanelId,
        "customTagsHTML": CustomTagsTable.html(),
        "optionsFilesystem": optionsFilesystem(),
      }),
      "advanced": TemplateAdvancedHTML({
        "prepend": prepend,
        "formPanelId": this.formPanelId
      })
    });
  }

  function _onShow(context, panelForm) {
    $("#"+this.formPanelId+"InternalTabs").css({"display":"flex"});
    $("#"+prepend+"_driver").val("");
    $("#"+prepend+"_name", context).focus();
    var ds_id = $("#"+prepend+"_datastore .resource_list_select", context).val();
    var ds_id_raw = $("#"+prepend+"_datastore_raw .resource_list_select", context).val();
    var filterValue = OpenNebulaDatastore.TYPES.IMAGE_DS;
    ResourceSelect.insert({
      context: $("#"+prepend+"_datastore", context),
      resourceName: "Datastore",
      initValue: ds_id,
      filterKey: "TYPE",
      filterValue: filterValue.toString(),
      triggerChange: true
    });
    ResourceSelect.insert({
      context: $("#"+prepend+"_datastore_raw", context),
      resourceName: "Datastore",
      initValue: ds_id_raw,
      filterKey: "TYPE",
      filterValue: filterValue.toString(),
      triggerChange: true
    });
    ResourceSelect.insert({
      context: $("#"+prepend+"_datastore_raw_advanced", context),
      resourceName: "Datastore",
      initValue: ds_id_raw,
      filterKey: "TYPE",
      filterValue: filterValue.toString(),
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

     $("#"+prepend+"_type", context).change(function() {
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
    Foundation.reflow(context, "tabs");
    return false;
  }

  function _retrieve(context) {
  }

  function _fill(context, templateJSON) {
  }

});
