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
  var WizardFields = require("utils/wizard-fields");
  var TemplateUtils = require("utils/template-utils");
  var CustomTagsTable = require("utils/custom-tags-table");
  var FilesTable = require("tabs/files-tab/datatable");
  var OpenNebulaHost = require("opennebula/host");
  var UserInputs = require("utils/user-inputs");
  var UniqueId = require("utils/unique-id");
  var OpenNebula = require("opennebula");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./context/html");

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require("./context/wizardTabId");

  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, "context")) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = "fa-folder";
    this.type = "VM_TEMPLATE";
    this.title = Locale.tr("Context");
    this.classes = "hypervisor";
    this.templateVcenterCustomizationSpec = "";
    this.customizations = [];

    this.contextFilesTable = new FilesTable("ContextTable" + UniqueId.id(), {
      "select": true,
      "selectOptions": {
        "multiple_choice": true,
        "filter_fn": function(file) { return file.TYPE == 5; } // CONTEXT
      }});
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;
  WizardTab.prototype.generateContextFiles = _generateContextFiles;

  return WizardTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    CustomTagsTable.reset();
    return TemplateHTML({
      "uniqueId": UniqueId.id(),
      "userInputsHTML": UserInputs.html(),
      "customTagsTableHTML": CustomTagsTable.html(),
      "contextFilesTableHTML": this.contextFilesTable.dataTableHTML
    });
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context, type) {
    if(type){
      this.type = type;
    }

    var that = this;
    $("input[name='context_type']", context).on("change", function() {
      $(".context_type", context).hide();
      $("."+$(this).val(), context).show();
    });

    $("input#context_type_opennebula", context).click();

    $("#template_hypervisor_form input[name='hypervisor']").on("change", function(){
      if(this.value == "vcenter"){
        $("input#context_type_vcenter", context).click();
      } else {
        $("input#context_type_opennebula", context).click();
      }
    });

    context.on("change", "select.vcenter_customizations", function(){
      var option = $("option:selected", this);

      if (option.attr("custom") == "true"){
        $("input.vcenter_customizations_value", context).show();
      } else {
        $("input.vcenter_customizations_value", context).hide();
      }

      $("input.vcenter_customizations_value", context).val( $(this).val() );
    });

    $("input.vcenter_customizations_value", context).hide();

    OpenNebulaHost.vcenterCustomizations({
      data : {},
      timeout: true,
      success: function (request, customizations){
        that.customizations = customizations;
        _fillCustomizations(context, that);
      },
      error: function(request, error_json){
        console.error("There was an error requesting the vCenter customizations: "+
                      error_json.error.message);
        that.customizations = [];
        _fillCustomizations(context, that);
      }
    });

    context.on("change", "input.vcenter_customizations_value", function(){
      var opt =
        $("option"+
          "[value=\""+$("input.vcenter_customizations_value", context).val()+"\"]", context);

      if (opt.size() == 0){
        opt = $("option[custom=\"true\"]", context);
        $("input.vcenter_customizations_value", context).show();
      }

      opt.attr("selected", "selected");
    });

    UserInputs.setup(context);
    CustomTagsTable.reset();
    CustomTagsTable.setup(context, true);

    var selectOptions = {
      "selectOptions": {
        "select_callback": function(aData, options) {
          that.generateContextFiles(context);
        },
        "unselect_callback": function(aData, options) {
          that.generateContextFiles(context);
        }
      }
    };

    that.contextFilesTable.initialize(selectOptions);
    that.contextFilesTable.refreshResourceTableSelect();
  }

  function _fillCustomizations(context, that) {
    var customizations = that.customizations;
    var selectedCustom = true;
    var html = "<select>";
    html += "<option value=\"\">"+Locale.tr("None")+"</option>";
    if(Array.isArray(customizations)){
      customizations.forEach(customization => {
        var selected = "";
        if(that.templateVcenterCustomizationSpec && customization.toLowerCase() === that.templateVcenterCustomizationSpec.toLowerCase()){
          selectedCustom = false;
          selected = "selected";
        }
        html += "<option value=\""+customization+"\" "+selected+">"+customization+"</option>";
      });
    }
    var selected = selectedCustom && that.templateVcenterCustomizationSpec? "selected" : "";
    html += "<option custom=\"true\" value=\""+(that.templateVcenterCustomizationSpec || "")+"\" "+selected+">"+Locale.tr("Set manually")+"</option>";
    html += "</select>";
    $(".vcenter_customizations", context).html(html);
    if(selected){
      $(".vcenter_customizations_value").val(that.templateVcenterCustomizationSpec || "").show();
    }
  }

  function _retrieve(context) {
    var templateJSON = {};

    if($("input[name='context_type']:checked", context).val() == "context_type_vcenter"){
      var customization = WizardFields.retrieveInput($("input.vcenter_customizations_value", context));

      if (customization) {
        templateJSON = {
          VCENTER_CUSTOMIZATION_SPEC : customization
        };
      }
    } else {
      var contextJSON = WizardFields.retrieve(context);
      $.extend(contextJSON, CustomTagsTable.retrieve(context));

      if ($(".ssh_context", context).is(":checked")) {
        var public_key = WizardFields.retrieveInput($("#ssh_public_key", context));
        if (public_key) {
          contextJSON["SSH_PUBLIC_KEY"] = public_key;
        } else {
          contextJSON["SSH_PUBLIC_KEY"] = "$USER[SSH_PUBLIC_KEY]";
        }
      }

      if ($(".network_context", context).is(":checked")) {
        contextJSON["NETWORK"] = "YES";
      }

      if ($(".token_context", context).is(":checked")) {
        contextJSON["TOKEN"] = "YES";
      }

      if ($(".report_ready_context", context).is(":checked")) {
        contextJSON["REPORT_READY"] = "YES";
      }

      var userInputsJSON = UserInputs.retrieve(context);

      $.each(userInputsJSON, function(key, value){
        var name = key.toUpperCase();
        contextJSON[key] = "$" + name;
      });

      var start_script = WizardFields.retrieveInput($(".START_SCRIPT", context));
      if (start_script != "") {
        if ($(".ENCODE_START_SCRIPT", context).is(":checked")) {
          contextJSON["START_SCRIPT_BASE64"] = btoa(unescape(encodeURIComponent($(".START_SCRIPT", context).val())));
        } else {
          contextJSON["START_SCRIPT"] = start_script;
        }
      }

      if (!$.isEmptyObject(contextJSON)) { templateJSON["CONTEXT"] = contextJSON; };
      if (!$.isEmptyObject(userInputsJSON)) { templateJSON["USER_INPUTS"] = userInputsJSON; };
    }

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var that = this;

    that.templateVcenterCustomizationSpec = templateJSON && templateJSON.VCENTER_CUSTOMIZATION_SPEC;
    _fillCustomizations(context, that);
    var contextJSON = templateJSON["CONTEXT"];
    var userInputsJSON = templateJSON["USER_INPUTS"];
    var publicClouds = templateJSON["PUBLIC_CLOUD"];

    if (publicClouds != undefined) {
      if (!Array.isArray(publicClouds)){
        publicClouds = [publicClouds];
      }

      $.each(publicClouds, function(){
        if(this["TYPE"] == "vcenter"){
          $("input#context_type_vcenter", context).click();

          if(this["VCENTER_CUSTOMIZATION_SPEC"]){
            WizardFields.fillInput($("input.vcenter_customizations_value", context), this["VCENTER_CUSTOMIZATION_SPEC"]);
          } else if(userInputsJSON || contextJSON) {
            $("input#context_type_opennebula", context).click();
          }

          return false;
        }
      });
    }

    $(".ssh_context", context).removeAttr("checked");
    $(".network_context", context).removeAttr("checked");

    if (userInputsJSON) {
      UserInputs.fill(context, templateJSON);

      if (contextJSON) {
        $.each(userInputsJSON, function(key, value){
          delete contextJSON[key];
        });
      }

      delete templateJSON["USER_INPUTS"];
    }

    if (contextJSON) {
      $("input#context_type_opennebula", context).click();
      var file_ds_regexp = /FILE\[IMAGE=(\w+?)\W+IMAGE_UNAME=(\w+?)\]/g;
      var net_regexp = /^NETWORK$/;
      var ssh_regexp = /^SSH_PUBLIC_KEY$/;
      var token_regexp = /^TOKEN$/;
      var report_ready_regexp = /^REPORT_READY$/;
      var publickey_regexp = /\$USER\[SSH_PUBLIC_KEY\]/;
      var publickey_regexp = /\$USER\[SSH_PUBLIC_KEY\]/;
      var yes_value = /^(yes|YES)$/;

      var customTagsJSON = {};
      $.each(contextJSON, function(key, value) {
        if (ssh_regexp.test(key)) {
          $(".ssh_context", context).prop("checked", "checked");

          if (!publickey_regexp.test(value)) {
            WizardFields.fillInput($("#ssh_public_key", context), value);
          }
        } else if (token_regexp.test(key) && yes_value.test(value)) {
          $(".token_context", context).prop("checked", "checked");
        } else if (report_ready_regexp.test(key) && yes_value.test(value)) {
          $(".report_ready_context", context).prop("checked", "checked");
        } else if (net_regexp.test(key) && yes_value.test(value)) {
          $(".network_context", context).prop("checked", "checked");
        } else if ("INIT_SCRIPTS" == key) {
          WizardFields.fillInput($("input.INIT_SCRIPTS", context), value);
        } else if ("FILES_DS" == key) {
          WizardFields.fillInput($(".FILES_DS", context), contextJSON["FILES_DS"]);
          var files = [];
          OpenNebula.Image.list({
            timeout: true,
            success: function(request, obj_files){
              if(that.type === "VM"){
                if(value){
                  var pathFiles = value.split(" ");
                  if(Array.isArray(pathFiles)){
                    pathFiles.forEach(function(pathFile){
                      if(pathFile){
                        var nameFile = pathFile.split(/:'(\w+)'$/gi);
                        if(nameFile && nameFile[1]){
                          var find_id = obj_files.find(
                            function(element){
                              return element && element.IMAGE && element.IMAGE.NAME && element.IMAGE.NAME === nameFile[1];
                            }
                          );
                          if(find_id && find_id.IMAGE && find_id.IMAGE.ID){
                            files.push(find_id.IMAGE.ID);
                          }
                        }
                      }
                    });
                  }
                }
              }else{
                while (match = file_ds_regexp.exec(value.replace(/"/g, ""))) {
                  $.each(obj_files, function(key, value){
                    if(value.IMAGE.NAME.replace(/"/g, "") == match[1] && value.IMAGE.UNAME == match[2]){
                      files.push(value.IMAGE.ID);
                      return false;
                    }
                  });
                }
              }

              var selectedResources = {
                ids : files
              };
              that.contextFilesTable.selectResourceTableSelect(selectedResources);
            }
          });

        } else if ("START_SCRIPT_BASE64" == key) {
          $(".ENCODE_START_SCRIPT", context).prop("checked", "checked");
          $(".START_SCRIPT", context).val(decodeURIComponent(escape(window.atob(value))));
        } else if ("START_SCRIPT" ==  key) {
          WizardFields.fillInput($(".START_SCRIPT", context), value);
        } else {
          customTagsJSON[key] = value;
        }
      });

      CustomTagsTable.fill(context, customTagsJSON);

      delete templateJSON["CONTEXT"];
    }
  }

  function _generateContextFiles(context) {
    var that = this;
    var req_string=[];
    var selected_files = this.contextFilesTable.retrieveResourceTableSelect();
    if(selected_files.length != 0){
      $.each(selected_files, function(index, fileId) {
        OpenNebula.Image.show({
          timeout: true,
          data : {
            id: fileId
          },
          success: function(request, obj_file){
            req_string.push("$FILE[IMAGE=" + "\"" + obj_file.IMAGE.NAME + "\"" + ", IMAGE_UNAME=" + "\"" + obj_file.IMAGE.UNAME + "\"]");
            $(".FILES_DS", context).val(req_string.join(" "));
          }
        });
      });
    } else {
      $(".FILES_DS", context).val("");
    }
  };
});
