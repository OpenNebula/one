/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var TemplateUtils = require('utils/template-utils');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./updateconf/wizard');
  var TemplateAdvancedHTML = require('hbs!./updateconf/advanced');

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./updateconf/formPanelId');
  var TAB_ID = require('../tabId');
  var WIZARD_TABS = [
    require('tabs/templates-tab/form-panels/create/wizard-tabs/os'),
    require('tabs/templates-tab/form-panels/create/wizard-tabs/io'),
    require('tabs/templates-tab/form-panels/create/wizard-tabs/context'),
    require('tabs/templates-tab/form-panels/create/wizard-tabs/other')
  ]

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'updateconf': {
        'title': Locale.tr("Update VM Configuration"),
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

    $(".vm_updateconf_hide", context).remove();

    Foundation.reflow(context, 'tabs');
    Foundation.reflow(context, 'tooltip');
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
      $.extend(true, templateJSON, wizardTab.retrieve($('#' + wizardTab.wizardTabId, context)));
    });

    Sunstone.runAction("VM.updateconf", this.resourceId, TemplateUtils.templateToString(templateJSON));
    return false;

  }

  function _submitAdvanced(context) {
    var template = $('textarea#template', context).val();

    Sunstone.runAction("VM.updateconf", this.resourceId, template);
    return false;
  }

  function _fill(context, elementId, templateJSON) {
    this.resourceId = elementId;

    // Populates the Avanced mode Tab
    $('#template', context).val(
      TemplateUtils.templateToString(templateJSON));

    $.each(this.wizardTabs, function(index, wizardTab) {
      wizardTab.fill($('#' + wizardTab.wizardTabId, context), templateJSON);
    });

    // After all tabs have been filled, perform a notify.
    // There isn't a proper listener because this wizard does not allow to edit
    // the disks and nics
    $.each(this.wizardTabs, function(index, wizardTab) {
      if (wizardTab.notify != undefined){
        wizardTab.notify($('#' + wizardTab.wizardTabId, context), templateJSON);
      }
    });
  }
});
