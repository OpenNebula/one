define(function(require) {
  /*
    DEPENDENCIES
   */
  
  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var TemplateUtils = require('utils/template-utils');

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
    require('./create/wizard-tabs/general'),
    require('./create/wizard-tabs/storage'),
    require('./create/wizard-tabs/network'),
    require('./create/wizard-tabs/os'),
    require('./create/wizard-tabs/io'),
    require('./create/wizard-tabs/context'),
    require('./create/wizard-tabs/scheduling'),
    require('./create/wizard-tabs/hybrid'),
    require('./create/wizard-tabs/other')
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
      wizardTab.setup($('#' + wizardTab.wizardTabId, context));
    });

    context.foundation('reflow', 'tab');
  }

  function _onShow(context) {
    var that = this;
    $('a[href="#'+ that.wizardTabs[0].wizardTabId +'"]', context).trigger("click");

    $.each(that.wizardTabs, function(index, wizardTab) {
      wizardTab.onShow($('#' + wizardTab.wizardTabId, context), that);
    });
  }

  function _submitWizard(context) {
    var templateJSON = {}
    $.each(this.wizardTabs, function(index, wizardTab) {
      $.extend(templateJSON, wizardTab.retrieve($('#' + wizardTab.wizardTabId, context)));
    });

    if (this.action == "create") {
      Sunstone.runAction("Template.create", 
                          {'vmtemplate': templateJSON});
      return false;
    } else if (this.action == "update") {
      Sunstone.runAction("Template.update", 
                          this.resourceId, 
                          JSON.stringify({'vmtemplate': templateJSON}));
      return false;
    }
  }

  function _submitAdvanced(context) {
    var template = $('textarea#template', context).val();
    if (this.action == "create") {
      Sunstone.runAction("Template.create",  
                          {"vmtemplate": {"template_raw": template}});
      return false;

    } else if (this.action == "update") {
      Sunstone.runAction("Template.update", 
                          this.resourceId, 
                          JSON.stringify({"vmtemplate": {"template_raw": template}}));
      return false;
    }
  }

  function _fill(context, element) {
    if (this.action != "update") {return;}
    this.resourceId = element.ID;

    var templateJSON = element.TEMPLATE;

    // Populates the Avanced mode Tab
    $('#template', context).val(
      TemplateUtils.templateToString(templateJSON).replace(/^[\r\n]+$/g, ""));

    $.each(this.wizardTabs, function(index, wizardTab) {
      wizardTab.fill($('#' + wizardTab.wizardTabId, context), templateJSON);
    });
  }
});
