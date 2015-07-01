define(function(require) {
  /*
    DEPENDENCIES
   */

  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var UserCreation = require('tabs/users-tab/utils/user-creation');

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
        'title': Locale.tr("Create User"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      }
    };

    this.userCreation = new UserCreation(FORM_PANEL_ID);

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
      'formPanelId': this.formPanelId,
      'userCreationHTML': this.userCreation.html()
    });
  }

  function _setup(context) {
    this.userCreation.setup(context);
  }

  function _submitWizard(context) {
    var user_json = {
      "user" : this.userCreation.retrieve(context)
    };

    Sunstone.runAction("User.create",user_json);
    return false;
  }

  function _onShow(context) {
  }
});
