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

  var TemplateHTML = require('hbs!./other/html');
  
  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./other/wizardTabId');

  /*
    CONSTRUCTOR
   */
  
  function WizardTab() {
    if (!Config.isTemplateCreationTabEnabled('other')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID;
    this.icon = 'fa-ellipsis-h';
    this.title = Locale.tr("Other");
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

    context.on("click", '#add_context', function() {
      var table = $('#custom_tags', context)[0];
      var rowCount = table.rows.length;
      var row = table.insertRow(rowCount);

      var cell1 = row.insertCell(0);
      var element1 = document.createElement("input");
      element1.id = "KEY";
      element1.type = "text";
      element1.value = $('#KEY', context).val()
      cell1.appendChild(element1);

      var cell2 = row.insertCell(1);
      var element2 = document.createElement("input");
      element2.id = "VALUE";
      element2.type = "text";
      element2.value = $('#VALUE', context).val()
      cell2.appendChild(element2);

      var cell3 = row.insertCell(2);
      cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
    });

    context.on("click", "i.remove-tab", function() {
      $(this).closest("tr").remove()
    });

    context.on("change", "#raw_type", function() {
      var choice_str = $(this).val();
      switch (choice_str) {
      case 'vmware':
        $("#data_vmx_div", context).show();
        break;
      default:
        $("#data_vmx_div", context).hide();
      }
    });
  }

  function _retrieve(context) {
    var templateJSON = {};
    var rawJSON = {}
    t = $('#raw_type', context).val();
    if (t) { rawJSON['TYPE'] = t; }
    t = TemplateUtils.escapeDoubleQuotes($('#raw_data', context).val());
    if (t) { rawJSON['DATA'] = t; }
    t = TemplateUtils.escapeDoubleQuotes($('#raw_data_vmx', context).val());
    if (t) { rawJSON['DATA_VMX'] = t; }

    if (!$.isEmptyObject(rawJSON)) { templateJSON['RAW'] = rawJSON; };

    $('#custom_tags tr', context).each(function() {
      if ($('#KEY', $(this)).val()) {
        templateJSON[$('#KEY', $(this)).val()] = TemplateUtils.escapeDoubleQuotes($('#VALUE', $(this)).val());
      }
    });

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var rawJSON = templateJSON.RAW;
    if (rawJSON) {
      $('#raw_type', context).val(rawJSON['TYPE']);
      $('#raw_type', context).change();
      $('#raw_data', context).val(TemplateUtils.htmlDecode(rawJSON['DATA']));
      $('#raw_data_vmx', context).val(TemplateUtils.htmlDecode(rawJSON['DATA_VMX']));

      delete templateJSON.RAW
    }

    $.each(templateJSON, function(key, value) {
      var table = $('#custom_tags', context)[0];
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
      element2.value = TemplateUtils.htmlDecode(value);
      cell2.appendChild(element2);

      var cell3 = row.insertCell(2);
      cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
    });
  }
});
