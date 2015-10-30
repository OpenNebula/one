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

  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');
  var TemplateUtils = require('utils/template-utils');
  var CustomTagsTable = require('utils/custom-tags-table');
  var FilesTable = require('tabs/files-tab/datatable')
  var OpenNebulaHost = require('opennebula/host');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./context/html');

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./context/wizardTabId');

  /*
    CONSTRUCTOR
   */

  function WizardTab() {
    if (!Config.isTemplateCreationTabEnabled('context')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID;
    this.icon = 'fa-folder';
    this.title = Locale.tr("Context");
    this.classes = "hypervisor only_kvm only_vmware only_xen only_vcenter";

    this.contextFilesTable = new FilesTable(this.wizardTabId + 'ContextTable', {
      'select': true,
      'selectOptions': {
        'multiple_choice': true,
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
    return TemplateHTML({
      'customTagsTableHTML': CustomTagsTable.html(),
      'contextFilesTableHTML': this.contextFilesTable.dataTableHTML
    });
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context) {
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

    context.on("change", "select#vcenter_customizations", function(){
      var option = $("option:selected", this);

      if (option.attr("custom") == "true"){
        $('input#vcenter_customizations_value', context).show();
      } else {
        $('input#vcenter_customizations_value', context).hide();
      }

      $('input#vcenter_customizations_value', context).val( $(this).val() );
    });

    $('input#vcenter_customizations_value', context).hide();

    OpenNebulaHost.vcenterCustomizations({
      data : {},
      timeout: true,
      success: function (request, customizations){
        _fillCustomizations(context, customizations);
      },
      error: function(request, error_json){
        console.error("There was an error requesting the vCenter customizations: "+
                      error_json.error.message);

        _fillCustomizations(context, []);
      }
    });

    context.on("change", "input#vcenter_customizations_value", function(){
      var opt =
        $('option'+
          '[value="'+$('input#vcenter_customizations_value', context).val()+'"]', context);

      if (opt.size() == 0){
        opt = $('option[custom="true"]', context);
        $('input#vcenter_customizations_value', context).show();
      }

      opt.attr('selected', 'selected');
    });

    CustomTagsTable.setup(context);

    var selectOptions = {
      'selectOptions': {
        'select_callback': function(aData, options) {
          that.generateContextFiles(context)
        },
        'unselect_callback': function(aData, options) {
          that.generateContextFiles(context)
        }
      }
    }

    that.contextFilesTable.initialize(selectOptions);
    that.contextFilesTable.refreshResourceTableSelect();

    context.on("click", ".add_service_custom_attr", function() {
      $(".service_custom_attrs tbody").append(
        '<tr>' +
          '<td>' +
            '<input class="user_input_name" type="text" pattern="[\\w]+"/>' +
            '<small class="error">' + Locale.tr("Only word characters are allowed") + '</small>' +
          '</td>' +
          '<td>' +
            '<select class="user_input_type" >' +
              '<option value="text">' + Locale.tr("text") + '</option>' +
              '<option value="text64">' + Locale.tr("text (base64)") + '</option>' +
              '<option value="password">' + Locale.tr("password") + '</option>' +
            '</select>' +
          '</td>' +
          '<td>' +
            '<textarea class="user_input_description"/>' +
          '</td>' +
          '<td>' +
            '<a href="#"><i class="fa fa-times-circle remove-tab"></i></a>' +
          '</td>' +
        '</tr>');
    })

    context.on("click", ".service_custom_attrs i.remove-tab", function() {
      var tr = $(this).closest('tr');
      tr.remove();
    });
  }

  function _fillCustomizations(context, customizations) {
    var html = "<select>";

    html += '<option value="">'+Locale.tr("None")+'</option>';

    $.each(customizations, function(i,customization){
      html += '<option value="'+customization+'">'+customization+'</option>';
    });

    html += '<option value="" custom="true">'+Locale.tr("Set manually")+'</option>';

    html += '</select>';

    $("#vcenter_customizations", context).html(html);
  }

  function _retrieve(context) {
    var templateJSON = {};

    if($("input[name='context_type']:checked", context).val() == "context_type_vcenter"){
      var customization = $('input#vcenter_customizations_value', context).val();

      if (customization) {
        templateJSON["VCENTER_PUBLIC_CLOUD"] = {
          CUSTOMIZATION_SPEC : customization
        };
      }
    } else {
      var contextJSON = WizardFields.retrieve(context);
      $.extend(contextJSON, CustomTagsTable.retrieve(context));

      if ($("#ssh_context", context).is(":checked")) {
        var public_key = $("#ssh_public_key", context).val();
        if (public_key) {
          contextJSON["SSH_PUBLIC_KEY"] = TemplateUtils.escapeDoubleQuotes(public_key);
        } else {
          contextJSON["SSH_PUBLIC_KEY"] = '$USER[SSH_PUBLIC_KEY]';
        }
      }

      if ($("#network_context", context).is(":checked")) {
        contextJSON["NETWORK"] = "YES";
      }

      if ($("#token_context", context).is(":checked")) {
        contextJSON["TOKEN"] = "YES";
      }

      var userInputsJSON = {};
      $(".service_custom_attrs tbody tr", context).each(function() {
        if ($(".user_input_name", $(this)).val()) {
          var attr_name = $(".user_input_name", $(this)).val();
          var attr_type = $(".user_input_type", $(this)).val();
          var attr_desc = $(".user_input_description", $(this)).val();
          userInputsJSON[attr_name] = "M|" + attr_type + "|" + attr_desc;
          contextJSON[attr_name] = "$" + attr_name.toUpperCase();
        }
      });

      var start_script = $("#START_SCRIPT", context).val();
      if (start_script != "") {
        if ($("#ENCODE_START_SCRIPT", context).is(":checked")) {
          contextJSON["START_SCRIPT_BASE64"] = btoa(start_script);
        } else {
          contextJSON["START_SCRIPT"] = start_script;
        }
      }

      if (!$.isEmptyObject(contextJSON)) { templateJSON['CONTEXT'] = contextJSON; };
      if (!$.isEmptyObject(userInputsJSON)) { templateJSON['USER_INPUTS'] = userInputsJSON; };
    }

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var that = this;

    var contextJSON = templateJSON['CONTEXT'];
    var userInputsJSON = templateJSON['USER_INPUTS'];
    var publicClouds = templateJSON["PUBLIC_CLOUD"];

    if (publicClouds != undefined) {
      if (!$.isArray(publicClouds)){
        publicClouds = [publicClouds];
      }

      $.each(publicClouds, function(){
        if(this["TYPE"] == "vcenter"){
          $("input#context_type_vcenter", context).click();

          if(this["CUSTOMIZATION_SPEC"]){
            $('input#vcenter_customizations_value', context).val(this["CUSTOMIZATION_SPEC"]).change();
          } else if(userInputsJSON || contextJSON) {
            $("input#context_type_opennebula", context).click();
          }

          return false;
        }
      });
    }

    $("#ssh_context", context).removeAttr('checked');
    $("#network_context", context).removeAttr('checked');

    if (userInputsJSON) {
      $.each(userInputsJSON, function(key, value) {
        $(".add_service_custom_attr", context).trigger("click");

        var context = $(".service_custom_attrs tbody tr", context).last();
        var parts = value.split("|");
        $(".user_input_name", context).val(key);
        $(".user_input_type", context).val(parts[1]);
        $(".user_input_description", context).val(TemplateUtils.escapeDoubleQuotes(TemplateUtils.htmlDecode(parts[2])));

        if (contextJSON) {
          delete contextJSON[key];
        }
      });

      delete templateJSON['USER_INPUTS'];
    }

    if (contextJSON) {
      var file_ds_regexp = /\$FILE\[IMAGE_ID=([0-9]+)+/g;
      var net_regexp = /^NETWORK$/;;
      var ssh_regexp = /^SSH_PUBLIC_KEY$/;
      var token_regexp = /^TOKEN$/;
      var publickey_regexp = /\$USER\[SSH_PUBLIC_KEY\]/;

      var net_flag = false;
      var files = [];

      var customTagsJSON = {};
      $.each(contextJSON, function(key, value) {
        if (ssh_regexp.test(key)) {
          $("#ssh_context", context).prop('checked', 'checked');

          if (!publickey_regexp.test(value)) {
            $("#ssh_public_key", context).val(TemplateUtils.htmlDecode(value));
          }
        } else if (token_regexp.test(key)) {
          $("#token_context", context).prop('checked', 'checked');
        } else if (net_regexp.test(key)) {
          $("#network_context", context).prop('checked', 'checked');
        } else if ("INIT_SCRIPTS" == key) {
          $("input#INIT_SCRIPTS").val(TemplateUtils.htmlDecode(value));
        } else if ("FILES_DS" == key) {
          $('#FILES_DS', context).val(TemplateUtils.escapeDoubleQuotes(TemplateUtils.htmlDecode(contextJSON["FILES_DS"])))
          var files = [];
          while (match = file_ds_regexp.exec(value)) {
            files.push(match[1])
          }

          var selectedResources = {
              ids : files
            }
          that.contextFilesTable.selectResourceTableSelect(selectedResources);
        } else if ("START_SCRIPT_BASE64" == key) {
          $("#ENCODE_START_SCRIPT", context).prop('checked', 'checked');
          $("#START_SCRIPT", context).val(atob(value));
        } else if ("START_SCRIPT" ==  key) {
          $("#START_SCRIPT", context).val(TemplateUtils.escapeDoubleQuotes(TemplateUtils.htmlDecode(value)));
        } else {
          customTagsJSON[key] = value;
        }
      });

      CustomTagsTable.fill(context, customTagsJSON);

      delete templateJSON['CONTEXT'];
    }
  }

  function _generateContextFiles(context) {
    var req_string=[];
    var selected_files = this.contextFilesTable.retrieveResourceTableSelect();

    $.each(selected_files, function(index, fileId) {
      req_string.push("$FILE[IMAGE_ID="+ fileId +"]");
    });

    $('#FILES_DS', context).val(req_string.join(" "));
  };
});
