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
  var CustomTagsTable = require("utils/custom-tags-table");
  var Locale = require("utils/locale");
  var Notifier = require("utils/notifier");
  var OpenNebulaError = require("opennebula/error");
  var Sunstone = require("sunstone");
  var TemplateTabsHTML = require("hbs!./create/tabs");
  var Tips = require("utils/tips");
  var WizardFields = require("utils/wizard-fields");

  /*
    CONSTANTS
   */
  var WIZARD_TABS = [
    require("./create/wizard-tabs/image"),
    require("./create/wizard-tabs/docker"),
  ];
  var IMAGES_TAB_ID = require("tabs/images-tab/tabId");
  var typeSender = "wizard";
  /*
    CONSTRUCTOR
   */
  function FormPanel() {
    var title = Locale.tr("Create Image");
    var that = this;
    var tabId = IMAGES_TAB_ID;
    var formPanelId = (that && that.formPanelId)||"";
    that.wizardTabs = [];
    var wizardTabCreate;

    $.each(WIZARD_TABS, function(index, wizardTab) {
      try {
        wizardTabCreate = new wizardTab({formPanelId: formPanelId, tabId: tabId});
        wizardTabCreate.contentHTML = wizardTabCreate.html();
        that.wizardTabs.push(wizardTabCreate);
      } catch (err) {
        console.log(err);
      }
    });

    this.actions = {
      "create": {
        "title": title,
        "buttonText": Locale.tr("Create"),
        "resetButton": true
      }
    };

    // BaseFormPanel.call(this);
  }

  function _reInit(context){
    var that = this;
    //this clear events into forms ""
    $("#"+that.formPanelId+"Wizard, #"+that.formPanelId+"Advanced")
    .off("forminvalid.zf.abide")
    .off("formvalid.zf.abide")
    .off("submit")
    .on("submit", function(ev){
      that.submitWizard(context);
      ev.preventDefault();
      return false;
    });
  }

  function errorSubmit(element, tabId, context){
    if(element && tabId){
      $(element).off("forminvalid.zf.abide").on("forminvalid.zf.abide", function(ev, frm) {
        Notifier.notifyError(Locale.tr("One or more required fields are missing or malformed."),ev.target,context);
        Sunstone.hideFormPanelLoading(tabId);
      });
    }
  }

  function successSubmit(element, callback, that){
    if(element && callback && typeof callback === "function"){
      $(element).off("formvalid.zf.abide").on("formvalid.zf.abide", function(ev, frm){
        callback(that, frm);
      });
    }
  }

  function resetOtherForms (form, formPanelId) {
    if(form && formPanelId){
      var forms = ["Docker","Advanced","Wizard"];
      forms.forEach(function(element) {
        if(form !== element){
          try {
            $("#"+formPanelId+element).foundation("resetForm");
          } catch (error) {}
        }
      });
    }
  }

  function _submit(context){
    var that = this;
    switch (typeSender) {
      case "docker":
        var element = "#"+that.formPanelId+"Docker";

        //reset other forms
        resetOtherForms("Docker",that.formPanelId);

        errorSubmit(element, that.tabId, context);
        successSubmit(element, _submitDocker, that);
        $(element).foundation("validateForm");
      break;

      case "advanced":
        var element = "#"+that.formPanelId+"Advanced";

        //reset other forms
        resetOtherForms("Advanced", that.formPanelId);

        errorSubmit(element, that.tabId, context);
        successSubmit(element, _submitAdvanced, that);
        $(element).foundation("validateForm");
      break;

      default:
        var element = "#"+that.formPanelId+"Wizard";

        //reset other forms
        resetOtherForms("Wizard", that.formPanelId);

        errorSubmit(element, that.tabId, context);
        successSubmit(element, _submitWizard, that);
        $(element).foundation("validateForm");
      break;
    }
  }

  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.submitWizard = _submit;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;
  FormPanel.prototype.reInit = _reInit;

  return FormPanel;


  /*
    FUNCTION DEFINITIONS
   */

  function changeTypeSender(attr){
    if(attr){
      typeSender = attr;
    }
  }

  function _htmlWizard() {
    return TemplateTabsHTML({
      "formPanelId": this.formPanelId,
      "wizardTabs": this.wizardTabs
    });
  }

  function _onShow(context) {
    var that = this;
    //click on image tag
    $("a[href=\"#"+ that.wizardTabs[0].wizardTabId +"\"]", context).trigger("click");
    //click on wizard sub tab
    $("a[href=\"#createImageFormWizard\"]", context).trigger("click");

    $.each(that.wizardTabs, function(index, wizardTab) {
      wizardTab.onShow($("#" + wizardTab.wizardTabId, context), that);
    });
    $(".changeTypeSender").each(function(){
      var attr = $(this).attr("data-typesender");
      if (typeof attr !== typeof undefined && attr !== false){
        $(this).on("click", function(){
          changeTypeSender(attr);
        });
      }
    });
  }


  function _setup(context) {
    var that = this;
    $.each(this.wizardTabs, function(index, wizardTab) {
      wizardTab.setup($("#" + wizardTab.wizardTabId, context));
      if(wizardTab.title === Locale.tr("Image")){
        that.uploader = wizardTab.uploader;
      }
    });
    Foundation.reflow(context, "tabs");
    Tips.setup(context);
  }

  function _submitWizard(that, context) {
    var upload = false;

    var ds_id = $("#img_datastore .resource_list_select", context).val();
    if (!ds_id) {
      Sunstone.hideFormPanelLoading(that.tabId);
      Notifier.notifyError(Locale.tr("Please select a datastore for this image"));
      return false;
    }

    var img_json = {};

    var name = WizardFields.retrieveInput($("#img_name", context));
    img_json["NAME"] = name;

    var desc = WizardFields.retrieveInput($("#img_desc", context));
    if (desc != undefined && desc.length) {
      img_json["DESCRIPTION"] = desc;
    }

    var type = WizardFields.retrieveInput($("#img_type", context));
    img_json["TYPE"] = type;

    img_json["PERSISTENT"] = $("#img_persistent", context).val();
    if ( img_json["PERSISTENT"] == "" ){
      delete img_json["PERSISTENT"];
    }

    var dev_prefix = WizardFields.retrieveInput($("#img_dev_prefix", context));
    if (dev_prefix != undefined && dev_prefix.length) {
      if (dev_prefix == "custom") {
        dev_prefix = WizardFields.retrieveInput($("#custom_img_dev_prefix", context));
      }
      img_json["DEV_PREFIX"] = dev_prefix;
    }

    var driver = WizardFields.retrieveInput($("#img_driver", context));
    if (driver != undefined && driver.length) {
        if (driver == "custom") {
          driver = WizardFields.retrieveInput($("#custom_img_driver", context));
        }
        img_json["FORMAT"] = driver;
    }

    var filesystem = WizardFields.retrieveInput($("#img_fs", context));
    if (filesystem != undefined && filesystem.length) {
        img_json["FS"] = filesystem;
    }

    var target = WizardFields.retrieveInput($("#img_target", context));
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
      path = WizardFields.retrieveInput($("#img_path", context));
      if (path) img_json["PATH"] = path;
      break;
    case "datablock":
      size = WizardFields.retrieveInput($("#img_size", context));

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
      if(that.uploader){
        if (that.uploader.files && that.uploader.files.length == 0) {
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
      }else{
        Notifier.notifyError(Locale.tr("you don't have a valid uploader"));
      }
    } else {
      Sunstone.runAction(that.resource+".create", img_obj);
    }

    return false;
  }

  function _submitDocker(that, context){
    var name = $("#docker_name", context).val();
    var ds_id = $("#docker_datastore .resource_list_select", context).val();
    var cntext = $("#docker_context", context).val();
    var size = parseInt($("#docker_size", context).val(), 10) || 0;
    var template = "";
    var sizeUnit = parseInt($("#docker_size_units", context).val(),10) || 1;

    size = size * sizeUnit;

    // that.wizardTabs[1] is tab docker see line 34 of this file
    if (that.wizardTabs && that.wizardTabs[1] && that.wizardTabs[1].getValueEditor && typeof that.wizardTabs[1].getValueEditor === "function") {
      template = that.wizardTabs[1].getValueEditor().trim();
    }

    if (!ds_id) {
      Sunstone.hideFormPanelLoading(that.tabId);
      Notifier.notifyError(Locale.tr("Please select a datastore"));
      return false;
    }

    if(!template){
      Sunstone.hideFormPanelLoading(that.tabId);
      Notifier.notifyError(Locale.tr("Please insert a dockerfile template"));
      return false;
    }else{
      template = btoa(template);
    }

    if (!size) {
      Sunstone.hideFormPanelLoading(that.tabId);
      Notifier.notifyError(Locale.tr("Please select a size"));
      return false;
    }
    var img_obj = {
      "image" : {
        "NAME" : name,
        "PATH" : "dockerfile://?fileb64="+template+"&context="+cntext+"&size="+size.toString()
      },
      "ds_id" : ds_id
    };
    Sunstone.runAction(that.resource+".create", img_obj);
    return false;
  }

  function _submitAdvanced(that, context) {
    var template = $("#template", context).val();
    var ds_id = $("#img_datastore_raw_advanced .resource_list_select", context).val();

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

    Sunstone.runAction(that.resource+".create", img_obj);

    return false;
  }
});
