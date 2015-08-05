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

  function _retrieve(context) {
    var templateJSON = {};
    var contextJSON = WizardFields.retrieve(context);
    $.extend(contextJSON, CustomTagsTable.retrieve(context));

    if ($("#ssh_context", context).is(":checked")) {
      var public_key = $("#ssh_public_key", context).val();
      if (public_key) {
        contextJSON["SSH_PUBLIC_KEY"] = public_key;
      } else {
        contextJSON["SSH_PUBLIC_KEY"] = '$USER[SSH_PUBLIC_KEY]';
      }
    };

    if ($("#network_context", context).is(":checked")) {
      contextJSON["NETWORK"] = "YES";
    };

    if ($("#token_context", context).is(":checked")) {
      contextJSON["TOKEN"] = "YES";
    };

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

    if (!$.isEmptyObject(contextJSON)) { templateJSON['CONTEXT'] = contextJSON; };
    if (!$.isEmptyObject(userInputsJSON)) { templateJSON['USER_INPUTS'] = userInputsJSON; };

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var that = this;
    $("#ssh_context", context).removeAttr('checked');
    $("#network_context", context).removeAttr('checked');

    var contextJSON = templateJSON['CONTEXT'];
    var userInputsJSON = templateJSON['USER_INPUTS'];
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
