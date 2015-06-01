define(function(require) {
  /*
    DEPENDENCIES
   */

  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');
  var TemplateUtils = require('utils/template-utils');

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

    /* TODO
    this.contextFilesTable = new FilesTable(this.wizardTabId + 'ContextTable', {'select': true});
    */
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;

  return WizardTab;
  
  /*
    FUNCTION DEFINITIONS
   */
  
  function _html() {
    return TemplateHTML();
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context) {
    Tips.setup(context);

    context.off("click", '#add_context');
    context.on("click", '#add_context', function() {
      var table = $('#context_table', context)[0];
      var rowCount = table.rows.length;
      var row = table.insertRow(rowCount);

      var cell1 = row.insertCell(0);
      var element1 = document.createElement("input");
      element1.id = "KEY";
      element1.type = "text";
      element1.value = $('input#KEY', context).val()
      cell1.appendChild(element1);

      var cell2 = row.insertCell(1);
      var element2 = document.createElement("textarea");
      element2.id = "VALUE";
      element2.type = "text";
      element2.value = $('textarea#VALUE', context).val()
      cell2.appendChild(element2);

      var cell3 = row.insertCell(2);
      cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
    });

    context.off("click", 'i.remove-tab');
    context.on("click", 'i.remove-tab', function() {
      $(this).closest("tr").remove()
    });

    /* TODO
    that.context.initialize({
      'selectOptions': {
        'select_callback': function(aData, options) {
          $('#KERNEL', context).text(aData[options.name_index]);
          $('#KERNEL_DS', context).val("$FILE[IMAGE_ID="+ aData[options.id_index] +"]");
        }
      }
    });
    that.context.refreshResourceTableSelect();

    var generate_context_files = function() {
      var req_string = [];

      $.each($("span.image", $("#selected_files_spans")), function() {
        req_string.push("$FILE[IMAGE_ID=" + $(this).attr("image_id") + "]");
      });

      $('#FILES_DS', context).val(req_string.join(" "));
    };
    */
   
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

    $('#context_table tr', context).each(function() {
      if ($('#KEY', $(this)).val()) {
        contextJSON[$('#KEY', $(this)).val()] = $('#VALUE', $(this)).val()
      }
    });

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
          /* TODO var files = [];
          while (match = file_ds_regexp.exec(value)) {
            files.push(match[1])
          }

          var dataTable_context = $("#datatable_context").dataTable();

          // TODO updateView should not be required. Currently the dataTable
          //  is filled twice.
          update_datatable_template_files(dataTable_context, function() {
                });*/
        } else {
          var table = $('#context_table', context)[0];
          var rowCount = table.rows.length;
          var row = table.insertRow(rowCount);

          var cell1 = row.insertCell(0);
          var element1 = document.createElement("input");
          element1.id = "KEY";
          element1.type = "text";
          element1.value = TemplateUtils.htmlDecode(key);
          cell1.appendChild(element1);

          var cell2 = row.insertCell(1);
          var element2 = document.createElement("textarea");
          element2.id = "VALUE";
          element2.type = "text";
          element2.value = TemplateUtils.escapeDoubleQuotes(TemplateUtils.htmlDecode(value));
          cell2.appendChild(element2);

          var cell3 = row.insertCell(2);
          cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
        }
      });

      delete templateJSON['CONTEXT'];
    }
  }
});
