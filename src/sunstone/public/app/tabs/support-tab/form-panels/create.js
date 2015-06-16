define(function(require) {
  /*
    DEPENDENCIES
   */

  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./create/wizard');

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./create/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'create': {
        'title': "Submit a Request",
        'buttonText': "Submit",
        'resetButton': true
      }
    };

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateWizardHTML({
      'formPanelId': this.formPanelId
    });
  }

  function _onShow(context) {
  }

  function _setup(context) {
    return false;
  }

  function _submitWizard(context) {
    var template = {
      "subject" : $('#subject', context).val(),
      "description" : $('#description', context).val(),
      "opennebula_version" : $('#opennebula_version', context).val(),
      "severity" : $('#severity', context).val(),
    };

    Sunstone.runAction("Support.create", template);
    return false;
  }
});
