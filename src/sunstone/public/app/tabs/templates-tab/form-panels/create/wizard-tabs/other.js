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
    return TemplateHTML({
      'customTagsTableHTML': CustomTagsTable.html()
    });
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context) {
    Tips.setup(context);

    CustomTagsTable.setup(context);

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
    var templateJSON = CustomTagsTable.retrieve(context);

    var rawJSON = {}
    t = $('#raw_type', context).val();
    if (t) { rawJSON['TYPE'] = t; }
    t = TemplateUtils.escapeDoubleQuotes($('#raw_data', context).val());
    if (t) { rawJSON['DATA'] = t; }
    t = TemplateUtils.escapeDoubleQuotes($('#raw_data_vmx', context).val());
    if (t) { rawJSON['DATA_VMX'] = t; }

    if (!$.isEmptyObject(rawJSON)) { templateJSON['RAW'] = rawJSON; };

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

    CustomTagsTable.fill(context, templateJSON);
  }
});
