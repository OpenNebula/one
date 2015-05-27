define(function(require) {
  /*
    DEPENDENCIES
   */
  
  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./create/wizard');
  var TemplateAdvancedHTML = require('hbs!./create/advanced');
  
  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./create/formPanelId');
  var TAB_ID = require('../tabId');
  var WIZARD_TABS = [
    require('./create/wizard-tabs/general')
  ]

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'create': {
        'title': Locale.tr("Create VM Template"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      },
      'update': {
        'title': Locale.tr("Update VM Template"),
        'buttonText': Locale.tr("Update"),
        'resetButton': false
      }
    };

    var that = this;
    that.wizardTabs = [];
    var wizardTabInstance;
    $.each(WIZARD_TABS, function(index, wizardTab) {
      try {
        wizardTabInstance = new wizardTab();
        wizardTabInstance.contentHTML = wizardTabInstance.html();
        that.wizardTabs.push(wizardTabInstance); 
      } catch (err) {
        console.log(err);
      }
    })

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.htmlAdvanced = _htmlAdvanced;
  FormPanel.prototype.setup = _setup;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.submitAdvanced = _submitAdvanced;
  FormPanel.prototype.fill = _fill;

  return FormPanel;
  
  /*
    FUNCTION DEFINITIONS
   */
  
  function _htmlWizard() {

    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
      'wizardTabs': this.wizardTabs
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _setup(context) {
    $.each(this.wizardTabs, function(index, wizardTab) {
      wizardTab.setup();
    });

    context.foundation('reflow', 'tab');
    Tips.setup(context);
  }

  function _onShow() {

  }

  function _submitWizard() {

  }

  function _submitAdvanced() {

  }

  function _fill() {

  }
});
