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
  var ImageTable = require("tabs/images-tab/datatable");
  var TemplateUtils = require("utils/template-utils");
  var UniqueId = require("utils/unique-id");
  var WizardFields = require("utils/wizard-fields");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./disk-tab/html");

  /*
    CONSTRUCTOR
   */

  function DiskTab(diskTabId) {
    this.diskTabId = "diskTab" + diskTabId + UniqueId.id();

    this.imageTable = new ImageTable(this.diskTabId + "Table", {
      "select": true,
      "selectOptions": {
        "filter_fn": function(image) { return image.STATE != 5; }
    }});
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

  function optionsFilesystem(){
    var rtn = "<option value=''>-</option>";
    if(config && config.system_config && config.system_config.support_fs && Array.isArray(config.system_config.support_fs)){
      config.system_config.support_fs.forEach(function(element) {
        rtn += "<option value='"+element+"'>"+element+"</option>";
      });
    }
    return rtn;
  };

  function _html() {
    return TemplateHTML({
      "diskTabId": this.diskTabId,
      "imageTableSelectHTML": this.imageTable.dataTableHTML,
      "optionsFilesystem": optionsFilesystem()
    });
  }

  function _onShow() {
    this.imageTable.refreshResourceTableSelect();
  }

  function _setup(context) {
    var that = this;
    that.imageTable.initialize({
      "selectOptions": {
        "select_callback": function(aData, options) {
          // If the image is selected by Id, avoid overwriting it with name+uname
          if ($("#IMAGE_ID", context).val() != aData[options.id_index]) {
            $("#OPENNEBULA_MANAGED", context).val("");
            $("#IMAGE_ID", context).val("");
            $("#IMAGE", context).val(aData[options.name_index]);
            $("#IMAGE_UNAME", context).val(aData[options.uname_index]);
            $("#IMAGE_UID", context).val("");
          }
        }
      }
    });
    $("table#"+this.imageTable.dataTableId).css("table-layout", "fixed");
    that.imageTable.refreshResourceTableSelect();

    // Select Image or Volatile disk. The div is hidden depending on the selection, and the
    // vm_param class is included to be computed when the template is generated.
    var imageContext = $("div.image",  context);
    var volatileContext = $("div.volatile",  context);
    $("input[name='" + that.diskTabId + "']", context).change(function() {
      if ($("input[name='" + that.diskTabId + "']:checked", context).val() == "image") {
        imageContext.toggle();
        volatileContext.hide();
        $("[wizard_field]", imageContext).prop("wizard_field_disabled", false);
        $("[wizard_field]", volatileContext).prop("wizard_field_disabled", true);
      } else {
        imageContext.hide();
        volatileContext.toggle();
        $("[wizard_field]", volatileContext).prop("wizard_field_disabled", false);
        $("[wizard_field]", imageContext).prop("wizard_field_disabled", true);
      }
    });
    $("[wizard_field]", imageContext).prop("wizard_field_disabled", false);
    $("[wizard_field]", volatileContext).prop("wizard_field_disabled", true);

    // Volatile Type FS hides Format, Type SWAP displays Format
    $("select#TYPE_KVM", volatileContext).change(function() {
      var value = $(this).val();
      switch (value){
        case "fs":
          $("select#FORMAT_KVM", volatileContext).parent().show();
          if($("select#FORMAT_KVM", volatileContext).val() === "qcow2"){
            $("select#DRIVER", volatileContext).val("qcow2");
          }
          $("select#FS_KVM", volatileContext).parent().show();
          break;
        case "swap":
          $("select#FORMAT_KVM", volatileContext).parent().hide();
          $("select#DRIVER", volatileContext).val("");
          $("select#FS_KVM", volatileContext).val("");
          $("select#FS_KVM", volatileContext).parent().hide();
          break;
      }
    });

    // Volatile Type FS hides Format, Type SWAP displays Format
    $("select#TYPE_VCENTER", volatileContext).change(function() {
      var value = $(this).val();
      switch (value){
        case "fs":
          $("select#FORMAT_VCENTER", volatileContext).parent().show();
          if($("select#FORMAT_VCENTER", volatileContext).val() === "qcow2"){
            $("select#DRIVER", volatileContext).val("qcow2");
          }
          break;
        case "swap":
          $("select#FORMAT_VCENTER", volatileContext).parent().hide();
          $("select#DRIVER", volatileContext).val("");
          break;
      }
    });

    $("select[name=format]", volatileContext).change(function(){
      var value = $(this).val();
      switch (value){
        case "qcow2":
          $("select#DRIVER", volatileContext).val(value);
          break;
        default:
          $("select#DRIVER", volatileContext).val("");
          break;
      }
    });

    $("input[name=\"custom_disk_dev_prefix\"]",context).parent().hide();
    $("select#disk_dev_prefix",context).change(function(){
      if ($(this).val() == "custom"){
        $("input[name=\"custom_disk_dev_prefix\"]",context).parent().show();
      } else {
        $("input[name=\"custom_disk_dev_prefix\"]",context).parent().hide();
      }
    });

    if (!Config.isAdvancedEnabled("show_attach_disk_advanced")){
      $("#image_values", context).hide();
    }
  }

  function _retrieve(context) {
    var selectedContext;

    if ($("input[name='" + this.diskTabId + "']:checked", context).val() == "image"){
      selectedContext = $("div.image",  context);
    } else {
      selectedContext = $("div.volatile",  context);
      var typeKvm = $("#TYPE_KVM", selectedContext).val();
      var typeVcenter = $("#TYPE_VCENTER", selectedContext).val();
      var type = "fs";
      if(typeKvm != "fs"){
        type = typeKvm;
      } else if (typeVcenter != "fs"){
        type = typeVcenter;
      }

      if (type == "swap")
      {
        $("select#FORMAT", selectedContext).val("");
      }
    }

    var tmpl = WizardFields.retrieve(selectedContext);
    if(type){
      tmpl.TYPE = type;
    }

    if(tmpl.SIZE != undefined && $(".mb_input_unit", selectedContext).val() == "GB"){
      tmpl.SIZE = tmpl.SIZE * 1024;
      tmpl.SIZE = tmpl.SIZE.toString();
    }

    if(tmpl.SIZE != undefined && $(".mb_input_unit", selectedContext).val() == "TB"){
      tmpl.SIZE = tmpl.SIZE * 1048576;
      tmpl.SIZE = tmpl.SIZE.toString();
    }

    var formatKvm = $("#FORMAT_KVM", context).val();
    var formatVcenter = $("#FORMAT_VCENTER", context).val();

    if(formatKvm != "raw"){
      tmpl.FORMAT = formatKvm;
    } else if (formatVcenter != "raw"){
      tmpl.FORMAT = formatVcenter;
    }

    if($("input[name='" + this.diskTabId + "']:checked", context).val() == "image" && !tmpl["IMAGE"] && !tmpl["IMAGE_ID"]){
       return {};
    }
    var dev_prefix = WizardFields.retrieveInput($("#disk_dev_prefix", selectedContext));
    if (dev_prefix != undefined && dev_prefix.length) {
      if (dev_prefix == "custom") {
        dev_prefix = WizardFields.retrieveInput($("#custom_disk_dev_prefix", selectedContext));
      }
      tmpl["DEV_PREFIX"] = dev_prefix;
    }

    $.extend(TemplateUtils.stringToTemplate($("#templateStr", context).val()), tmpl);
    return tmpl;
  }

  function _fill(context, templateJSON) {
    var selectedContext;

    if(templateJSON.SIZE){
      templateJSON.SIZE = templateJSON.SIZE / 1024;
    }

    if (templateJSON.IMAGE_ID || templateJSON.IMAGE) {
      $("input#" + this.diskTabId + "radioImage", context).click();

      if (templateJSON.IMAGE_ID != undefined) {
        var selectedResources = {
          ids : templateJSON.IMAGE_ID
        };

        this.imageTable.selectResourceTableSelect(selectedResources);

      } else if (templateJSON.IMAGE != undefined && templateJSON.IMAGE_UNAME != undefined) {
        var selectedResources = {
          names : {
            name: templateJSON.IMAGE,
            uname: templateJSON.IMAGE_UNAME
          }
        };

        this.imageTable.selectResourceTableSelect(selectedResources);
      }

      selectedContext = $(".image", context);
    } else {
      $("input#" + this.diskTabId + "radioVolatile", context).click();

      selectedContext = $(".volatile", context);
    }

    WizardFields.fill(selectedContext, templateJSON);
    $("#templateStr",context).val(TemplateUtils.templateToString(templateJSON));

    var dev_prefix = templateJSON["DEV_PREFIX"];
    if (dev_prefix != undefined && dev_prefix.length) {
      WizardFields.fillInput($("#disk_dev_prefix", selectedContext), dev_prefix);

      var val = $("#disk_dev_prefix", selectedContext).val();
      if (val == "" || val == undefined){
        $("#disk_dev_prefix", selectedContext).val("custom").change();
        WizardFields.fillInput($("#custom_disk_dev_prefix", selectedContext), dev_prefix);
      }
    }
  }
});
