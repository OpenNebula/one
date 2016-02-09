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

  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');
  var Tips = require('utils/tips');
  var ImagesTable = require('tabs/images-tab/datatable');
  var MarketPlacesTable = require('tabs/marketplaces-tab/datatable');
  var Config = require('sunstone-config');
  var WizardFields = require('utils/wizard-fields');

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

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'create': {
        'title': Locale.tr("Create MarketPlace App"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      }
    };

    this.imagesTable = new ImagesTable(
      FORM_PANEL_ID + 'imagesTable',
      {'select': true});

    this.marketPlacesTable = new MarketPlacesTable(
      FORM_PANEL_ID + 'marketPlacesTable',
      {'select': true});

    this.marketPlacesTableAdvanced = new MarketPlacesTable(
      FORM_PANEL_ID + 'marketPlacesTableAdvanced',
      {'select': true});

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.htmlAdvanced = _htmlAdvanced;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.submitAdvanced = _submitAdvanced;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
      'imagesTableHTML': this.imagesTable.dataTableHTML,
      'marketPlacesTableHTML': this.marketPlacesTable.dataTableHTML
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({
      'formPanelId': this.formPanelId,
      'marketPlacesTableAdvancedHTML': this.marketPlacesTableAdvanced.dataTableHTML
    });
  }

  function _onShow(dialog) {
    this.imagesTable.resetResourceTableSelect();
    this.marketPlacesTable.resetResourceTableSelect();
    this.marketPlacesTableAdvanced.resetResourceTableSelect();

    $("#NAME", dialog).focus();

    return false;
  }

  // Set up the create datastore dialog
  function _setup(dialog) {
    Tips.setup(dialog);

    this.imagesTable.initialize();
    this.marketPlacesTable.initialize();
    this.marketPlacesTableAdvanced.initialize();

    this.imagesTable.idInput().
      attr('required', '').
      attr('wizard_field', 'ORIGIN_ID');

    this.marketPlacesTable.idInput().attr('required', '');
    this.marketPlacesTableAdvanced.idInput().attr('required', '');
  }


  function _submitWizard(dialog) {
    var marketPlaceJSON = {};
    $.extend(marketPlaceJSON, WizardFields.retrieve(dialog));

    var vmTemplate = $('#VMTEMPLATE', dialog).val();
    if (vmTemplate) {
      marketPlaceJSON['VMTEMPLATE64'] = btoa(vmTemplate);
    }

    var appTemplate = $('#APPTEMPLATE', dialog).val();
    if (appTemplate) {
      marketPlaceJSON['APPTEMPLATE64'] = btoa(appTemplate);
    }

    var marketPlaceAppObj = {
      "marketplaceapp" : marketPlaceJSON,
      "mp_id" : this.marketPlacesTable.idInput().val()
    };

    Sunstone.runAction("MarketPlaceApp.create", marketPlaceAppObj);
    return false;
  }

  function _submitAdvanced(dialog) {
    var template = $('#template', dialog).val();
    var marketPlaceAppObj = {
      "marketplaceapp" : {
        "marketplaceapp_raw" : template
      },
      "mp_id" : this.marketPlacesTableAdvanced.idInput().val()
    };

    Sunstone.runAction("MarketPlaceApp.create", marketPlaceAppObj);

    return false;
  }
});

